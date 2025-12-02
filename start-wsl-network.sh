#!/bin/bash

# Quick start script for WSL network mode
# Just run: ./start-wsl-network.sh

# Your Windows IP (update this if it changes)
WINDOWS_IP="192.168.1.67"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down > /dev/null 2>&1

# Set environment variables and start
echo "🚀 Starting services with IP: $WINDOWS_IP"
export LOCAL_IP=$WINDOWS_IP
export VITE_API_URL="http://$WINDOWS_IP:3001/api"
export CORS_ORIGIN="http://$WINDOWS_IP:5173"

# Create .env file
cat > .env << ENVEOF
# Network Configuration
LOCAL_IP=$WINDOWS_IP
VITE_API_URL=http://$WINDOWS_IP:3001/api
CORS_ORIGIN=http://$WINDOWS_IP:5173
ENVEOF

# Start services
docker-compose up -d

echo ""
echo "✅ Services started!"
echo ""
echo "📱 Open on your phone:"
echo "   http://$WINDOWS_IP:5173"
echo ""
echo "💻 Local access:"
echo "   http://localhost:5173"
echo ""
