#!/bin/bash

# Planner E2E Test Runner
# Ensures dependencies are installed and runs comprehensive tests

echo "🧪 Planner E2E Test Suite"
echo "========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed. Please install npm first."
    exit 1
fi

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Installing test dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "📦 Installing Puppeteer..."
    npm install puppeteer
fi

# Make the test file executable
chmod +x e2e-test.js

echo "🚀 Starting E2E tests..."
echo ""

# Run the tests
if [ "$1" = "--headless" ]; then
    echo "🖥️  Running in headless mode..."
    HEADLESS=true node e2e-test.js
else
    echo "🖼️  Running with browser UI (add --headless for headless mode)..."
    node e2e-test.js
fi

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 All tests completed successfully!"
else
    echo ""
    echo "❌ Some tests failed. Check the output above for details."
    exit 1
fi