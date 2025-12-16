FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the app code
COPY . .

# Expose the port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]