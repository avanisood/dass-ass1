#!/bin/bash

# Server Test Script
echo "🚀 Testing Felicity Backend Server..."
echo ""

# Start server in background
echo "Starting server..."
cd "$(dirname "$0")"
node server.js > /tmp/felicity-test.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 2

echo "✅ Server started with PID: $SERVER_PID"
echo ""

# Test health endpoint
echo "Testing /api/health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:5000/api/health)
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
fi

echo ""

# Test root endpoint
echo "Testing root / endpoint..."
ROOT_RESPONSE=$(curl -s http://localhost:5000/)
echo "Response: $ROOT_RESPONSE"

if echo "$ROOT_RESPONSE" | grep -q '"status":"running"'; then
    echo "✅ Root endpoint working!"
else
    echo "❌ Root endpoint failed!"
fi

echo ""

# Test 404 handling
echo "Testing 404 handling..."
NOT_FOUND=$(curl -s http://localhost:5000/api/nonexistent)
echo "Response: $NOT_FOUND"

if echo "$NOT_FOUND" | grep -q '"message":"Route not found"'; then
    echo "✅ 404 handling working!"
else
    echo "❌ 404 handling failed!"
fi

echo ""
echo "🛑 Stopping server..."
kill $SERVER_PID
sleep 1

echo ""
echo "📋 Server Log:"
cat /tmp/felicity-test.log
echo ""
echo "✅ All tests complete!"
