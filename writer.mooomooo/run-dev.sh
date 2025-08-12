#!/bin/bash

# Script to run the writer app in development mode

echo "🚀 Starting Writer App in Development Mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Use the local docker-compose file for development
echo "📦 Building and starting services..."
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up --build

echo "✅ Development environment stopped."
