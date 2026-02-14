#!/bin/bash

echo "🚀 Starting build process..."

# Install root dependencies
echo "📦 Installing server dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Build React app
echo "🔨 Building React application..."
cd client
npm run build
cd ..

# Initialize database and seed data
echo "🗄️ Initializing database..."
node server/database/seed.js

echo "✅ Build completed successfully!"
