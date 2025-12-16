const express = require('express');
const { chromium } = require('playwright');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Allow large HTML payloads

app.post('/generate-pdf', async (req, res) => {
    const { html, css } = req.body;

    if (!html) {
        return res.status(400).send('Missing HTML content');
    }

    let browser = null;

    try {
        browser = await chromium.launch({ 
            headless: true,
            // CRITICAL FIX: These arguments prevent Docker crashes
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Prevents memory crash in Docker
                '--disable-gpu'            // Disables GPU hardware acceleration
            ]
        });

        const page = await browser.newPage();

        // Construct the full page
        const fullContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    /* Reset & Base Styles */
                    body { margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; }
                    ${css}
                </style>
            </head>
            <body>
                <div id="resume-container">${html}</div>
            </body>
            </html>
        `;

        await page.setContent(fullContent, { waitUntil: 'networkidle' });

        // Generate PDF (A4 Size)
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' } 
        });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).send('PDF Generation Failed');
    } finally {
        // Ensure browser always closes to prevent zombie processes
        if (browser) {
            await browser.close();
        }
    }
});

// Use the port Railway gives us, or fallback to 3000 for local testing
const PORT = process.env.PORT || 3000;

// Listen on '0.0.0.0' to ensure external access (critical for Docker/Railway)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`PDF Service running on port ${PORT}`);
});