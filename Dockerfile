FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy application files
COPY . .

# Build frontend
RUN cd client && npm run build

# Initialize database
RUN node server/database/seed.js

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Start application
CMD ["npm", "start"]
