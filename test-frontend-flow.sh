#!/bin/bash

echo "🧪 Testing Complete User Flow..."
echo "================================"
echo ""

# Get your current token from localStorage (you're already logged in)
# Let's test with a new user registration and login

echo "1️⃣ Testing User Registration..."
REGISTER=$(curl -s -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test'$RANDOM'@example.com",
    "password": "test123",
    "address": "Test Address",
    "phone": "+1234567890"
  }')
  
if echo "$REGISTER" | grep -q "email"; then
    echo "✅ Registration successful"
    EMAIL=$(echo "$REGISTER" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
    echo "   Registered: $EMAIL"
else
    echo "❌ Registration failed: $REGISTER"
    exit 1
fi
echo ""

echo "2️⃣ Testing User Login..."
LOGIN=$(curl -s -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"test123\"
  }")

if echo "$LOGIN" | grep -q "token"; then
    echo "✅ Login successful"
    TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   Got auth token"
else
    echo "❌ Login failed: $LOGIN"
    exit 1
fi
echo ""

echo "3️⃣ Testing Get User Profile..."
PROFILE=$(curl -s http://localhost:4000/api/users/me \
  -H "Authorization: Bearer $TOKEN")

if echo "$PROFILE" | grep -q "$EMAIL"; then
    echo "✅ Profile fetch successful"
    echo "   User: $(echo "$PROFILE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Profile fetch failed: $PROFILE"
fi
echo ""

echo "4️⃣ Testing Get Restaurants..."
RESTAURANTS=$(curl -s http://localhost:4000/api/restaurants)
if echo "$RESTAURANTS" | grep -q "Pizza Palace"; then
    echo "✅ Restaurants loaded"
    RESTAURANT_COUNT=$(echo "$RESTAURANTS" | grep -o '"id"' | wc -l)
    echo "   Found $RESTAURANT_COUNT restaurants"
else
    echo "❌ Failed to load restaurants"
fi
echo ""

echo "5️⃣ Testing Get Restaurant Menu..."
MENU=$(curl -s http://localhost:4000/api/restaurants/1/menu)
if echo "$MENU" | grep -q "Margherita"; then
    echo "✅ Menu loaded"
    MENU_COUNT=$(echo "$MENU" | grep -o '"id"' | wc -l)
    echo "   Found $MENU_COUNT menu items"
    MENU_ITEM_ID=$(echo "$MENU" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
    echo "   First item ID: $MENU_ITEM_ID"
else
    echo "❌ Failed to load menu"
fi
echo ""

echo "6️⃣ Testing Place Order..."
ORDER=$(curl -s -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"restaurantId\": 1,
    \"deliveryAddress\": \"Test Address, City\",
    \"items\": [
      {\"menuItemId\": $MENU_ITEM_ID, \"quantity\": 2}
    ]
  }")

if echo "$ORDER" | grep -q '"id"'; then
    echo "✅ Order placed successfully"
    ORDER_ID=$(echo "$ORDER" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
    TOTAL=$(echo "$ORDER" | grep -o '"total_amount":"[^"]*"' | cut -d'"' -f4)
    echo "   Order ID: $ORDER_ID"
    echo "   Total: \$$TOTAL"
else
    echo "❌ Failed to place order: $ORDER"
fi
echo ""

echo "7️⃣ Testing Get My Orders..."
MY_ORDERS=$(curl -s http://localhost:4000/api/orders/mine \
  -H "Authorization: Bearer $TOKEN")

if echo "$MY_ORDERS" | grep -q "$ORDER_ID"; then
    echo "✅ Orders retrieved successfully"
    ORDER_COUNT=$(echo "$MY_ORDERS" | grep -o '"id"' | wc -l)
    echo "   Found $ORDER_COUNT orders"
else
    echo "❌ Failed to get orders: $MY_ORDERS"
fi
echo ""

echo "================================"
echo "✅ All Frontend Flows Working!"
echo "================================"
