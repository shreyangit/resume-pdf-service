# Use the official Playwright image. 
# This is crucial because it includes all the Linux OS dependencies (libnss, etc.) 
# that are missing from the standard Railway environment.
FROM mcr.microsoft.com/playwright:v1.41.0-jammy

# Set the working directory
WORKDIR /app

# Copy dependency files first
COPY package.json package-lock.json ./

# Install your Node.js dependencies (Express, etc.)
RUN npm ci

# Copy the rest of your server code
COPY . .

# Explicitly install the Chromium binary inside the container
RUN npx playwright install chromium

# Expose the port Railway expects
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]