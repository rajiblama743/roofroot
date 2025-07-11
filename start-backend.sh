#!/bin/bash

# Start Backend Server Script for RoofRoot
echo "🚀 Starting RoofRoot Backend Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "backend/server.js" ]; then
    echo "❌ Please run this script from the RoofRoot project root directory."
    exit 1
fi

# Navigate to backend directory
cd backend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Check if service account key exists
if [ ! -f "service-account-key.json" ]; then
    echo "❌ Service account key not found. Please ensure service-account-key.json exists in the backend directory."
    exit 1
fi

# Start the server
echo "✅ Starting backend server on http://localhost:3000"
echo "📱 Health check: http://localhost:3000/health"
echo ""
echo "💡 Keep this terminal open while using the app."
echo "🛑 Press Ctrl+C to stop the server."
echo ""

npm start 