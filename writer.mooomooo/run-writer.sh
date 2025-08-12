#!/bin/bash

echo "🚀 Starting Writer App with Enhanced Logging..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
if ! command_exists node; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ docker-compose not found. Please install Docker Compose first."
    exit 1
fi

# Start dependencies (database, caddy) in Docker
echo "🐳 Starting dependencies (database, reverse proxy)..."
docker-compose -f docker-compose.deps.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

cd writer-app

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Make sure the writer-app directory exists."
    exit 1
fi

# Install/update dependencies
echo "📦 Installing/updating dependencies..."
npm install

# Set up environment variables for external database
export DATABASE_URL="postgresql://writer:writer_password@localhost:5432/writer_db"
export NEXTAUTH_SECRET="your-nextauth-secret-here"
export NEXTAUTH_URL="https://localhost"
export NODE_ENV="development"

# Generate Prisma client and run migrations
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push

# Start the development server with fallback methods
echo "✨ Starting development server..."
echo ""
echo "🔍 Wide Events Logging System Enabled!"
echo "   • Click the 📊 icon in the app to view logs"
echo "   • Open browser console and try: wideEventsDemo.runAllDemos()"
echo "   • All user actions are automatically logged with rich context"
echo ""
echo "📖 See LOGGING_README.md for detailed documentation"
echo ""
echo "🌐 App will be available at:"
echo "   • https://localhost (via Caddy proxy)"
echo "   • http://localhost:4000 (direct access)"
echo ""

# Try different methods to start Next.js
if npx next dev --port 4000 2>/dev/null; then
    echo "Started with npx next"
elif PATH="./node_modules/.bin:$PATH" npm run dev -- --port 4000; then
    echo "Started with npm run dev"
elif ./node_modules/.bin/next dev --port 4000; then
    echo "Started with direct binary"
else
    echo "❌ Failed to start Next.js. Please run ./troubleshoot.sh for help."
    exit 1
fi