# Use Node.js LTS
FROM node:20-alpine

# Set work directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Expose port
EXPOSE 5173

# Run Vite dev server with host flag to accept external connections
CMD ["npm", "run", "dev", "--", "--host"]
