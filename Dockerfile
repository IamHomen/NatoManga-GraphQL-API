# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install --only=production

# Copy the rest of the app
COPY . .

# Expose the port Render uses
EXPOSE 10000

# Start the app
CMD ["node", "server.js"]
