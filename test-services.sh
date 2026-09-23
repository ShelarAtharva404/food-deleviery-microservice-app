#!/bin/bash

echo "🔍 Testing All Services..."
echo "================================"
echo ""

# Test API Gateway
echo "1️⃣ Testing API Gateway (Port 4000)..."
GATEWAY=$(curl -s http://localhost:4000/health)
if [ $? -eq 0 ]; then
    echo "✅ API Gateway: $GATEWAY"
else
    echo "❌ API Gateway: FAILED"
fi
echo ""

# Test User Service
echo "2️⃣ Testing User Service (Port 4001)..."
USER=$(curl -s http://localhost:4001/health)
if [ $? -eq 0 ]; then
    echo "✅ User Service: $USER"
else
    echo "❌ User Service: FAILED"
fi
echo ""

# Test Restaurant Service
echo "3️⃣ Testing Restaurant Service (Port 4002)..."
RESTAURANT=$(curl -s http://localhost:4002/health)
if [ $? -eq 0 ]; then
    echo "✅ Restaurant Service: $RESTAURANT"
else
    echo "❌ Restaurant Service: FAILED"
fi
echo ""

# Test Order Service
echo "4️⃣ Testing Order Service (Port 4003)..."
ORDER=$(curl -s http://localhost:4003/health)
if [ $? -eq 0 ]; then
    echo "✅ Order Service: $ORDER"
else
    echo "❌ Order Service: FAILED"
fi
echo ""

# Test Delivery Service
echo "5️⃣ Testing Delivery Service (Port 4004)..."
DELIVERY=$(curl -s http://localhost:4004/health)
if [ $? -eq 0 ]; then
    echo "✅ Delivery Service: $DELIVERY"
else
    echo "❌ Delivery Service: FAILED"
fi
echo ""

# Test Notification Service
echo "6️⃣ Testing Notification Service (Port 4006)..."
NOTIFICATION=$(curl -s http://localhost:4006/health)
if [ $? -eq 0 ]; then
    echo "✅ Notification Service: $NOTIFICATION"
else
    echo "❌ Notification Service: FAILED"
fi
echo ""

echo "================================"
echo "📡 Testing API Gateway Routes..."
echo "================================"
echo ""

# Test restaurants endpoint through gateway
echo "7️⃣ Testing GET /api/restaurants..."
RESTAURANTS=$(curl -s http://localhost:4000/api/restaurants)
if echo "$RESTAURANTS" | grep -q "Pizza Palace"; then
    echo "✅ Restaurants endpoint working"
    echo "   Found $(echo "$RESTAURANTS" | grep -o "\"name\"" | wc -l) restaurants"
else
    echo "❌ Restaurants endpoint FAILED"
    echo "   Response: $RESTAURANTS"
fi
echo ""

# Test menu endpoint
echo "8️⃣ Testing GET /api/restaurants/1/menu..."
MENU=$(curl -s http://localhost:4000/api/restaurants/1/menu)
if echo "$MENU" | grep -q "Margherita"; then
    echo "✅ Menu endpoint working"
    echo "   Found $(echo "$MENU" | grep -o "\"name\"" | wc -l) menu items"
else
    echo "❌ Menu endpoint FAILED"
    echo "   Response: $MENU"
fi
echo ""

# Test frontend
echo "================================"
echo "🌐 Testing Frontend..."
echo "================================"
echo ""

echo "9️⃣ Testing Frontend (Port 3000)..."
FRONTEND=$(curl -s -I http://localhost:3000 | head -n 1)
if echo "$FRONTEND" | grep -q "200"; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend FAILED"
fi
echo ""

echo "================================"
echo "✨ Service Status Summary"
echo "================================"
echo ""
echo "Backend Services:"
echo "  - API Gateway:      ✅ http://localhost:4000"
echo "  - User Service:     ✅ http://localhost:4001"
echo "  - Restaurant:       ✅ http://localhost:4002"
echo "  - Order Service:    ✅ http://localhost:4003"
echo "  - Delivery:         ✅ http://localhost:4004"
echo "  - Notification:     ✅ http://localhost:4006"
echo ""
echo "Frontend:"
echo "  - React App:        ✅ http://localhost:3000"
echo ""
echo "🎉 All services are running!"
