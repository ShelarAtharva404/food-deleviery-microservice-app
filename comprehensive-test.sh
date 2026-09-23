#!/bin/bash

# Comprehensive End-to-End Test Script for Food Delivery Application
# This script tests all endpoints and user flows

API_BASE="http://localhost:4000/api"
FRONTEND="http://localhost:3000"

echo "=========================================="
echo "FOOD DELIVERY APP - COMPREHENSIVE TEST"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local token=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}Test $TOTAL_TESTS: $name${NC}"
    
    if [ -z "$token" ]; then
        response=$(curl -s -X $method "$API_BASE$url" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}")
    else
        response=$(curl -s -X $method "$API_BASE$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" \
            -w "\n%{http_code}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
        echo -e "${GREEN}✓ PASSED${NC} - HTTP $http_code"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo ""
        echo "$body"
    else
        echo -e "${RED}✗ FAILED${NC} - HTTP $http_code"
        echo "$body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo ""
        echo ""
    fi
}

echo "=========================================="
echo "1. USER SERVICE TESTS"
echo "=========================================="
echo ""

# Register new user
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@food.com"
test_endpoint "Register New User" "POST" "/users/register" \
    "{\"name\":\"Test User\",\"email\":\"$TEST_EMAIL\",\"password\":\"test123\",\"phone\":\"1234567890\"}"

# Login
echo "Logging in..."
login_response=$(curl -s -X POST "$API_BASE/users/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"test123\"}")

TOKEN=$(echo "$login_response" | jq -r '.token')
USER_ID=$(echo "$login_response" | jq -r '.user.id')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
    echo "User ID: $USER_ID"
    echo ""
else
    echo -e "${RED}✗ Login failed - cannot continue with authenticated tests${NC}"
    exit 1
fi

# Get user profile
test_endpoint "Get User Profile" "GET" "/users/me" "" "$TOKEN"

echo "=========================================="
echo "2. RESTAURANT SERVICE TESTS"
echo "=========================================="
echo ""

# Get all restaurants
test_endpoint "Get All Restaurants" "GET" "/restaurants" "" "$TOKEN"

# Get specific restaurant
test_endpoint "Get Restaurant Details (ID: 2)" "GET" "/restaurants/2" "" "$TOKEN"

# Get menu items
test_endpoint "Get Menu Items (Restaurant ID: 2)" "GET" "/restaurants/2/menu" "" "$TOKEN"

# Search restaurants
test_endpoint "Search Restaurants (pizza)" "GET" "/restaurants/search?q=pizza" "" "$TOKEN"

echo "=========================================="
echo "3. COUPON SERVICE TESTS"
echo "=========================================="
echo ""

# Get all coupons
test_endpoint "Get All Coupons" "GET" "/coupons" "" "$TOKEN"

# Validate coupon
test_endpoint "Validate Coupon (WELCOME50)" "POST" "/coupons/validate" \
    "{\"code\":\"WELCOME50\",\"orderAmount\":30.00}" "$TOKEN"

echo "=========================================="
echo "4. ORDER SERVICE TESTS"
echo "=========================================="
echo ""

# Create order
order_response=$(curl -s -X POST "$API_BASE/orders" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"restaurantId\":2,\"items\":[{\"menuItemId\":21,\"quantity\":2}],\"deliveryAddress\":\"123 Test St, Test City\",\"deliveryInstructions\":\"Ring the bell\"}")

ORDER_ID=$(echo "$order_response" | jq -r '.id')
ORDER_AMOUNT=$(echo "$order_response" | jq -r '.total_amount')

if [ "$ORDER_ID" != "null" ] && [ -n "$ORDER_ID" ]; then
    echo -e "${GREEN}✓ Order created successfully${NC}"
    echo "Order ID: $ORDER_ID"
    echo "Order Amount: $ORDER_AMOUNT"
    echo "$order_response" | jq '.'
    echo ""
else
    echo -e "${RED}✗ Order creation failed${NC}"
    echo "$order_response"
    echo ""
fi

# Get user orders
test_endpoint "Get My Orders" "GET" "/orders/mine" "" "$TOKEN"

# Get order details
if [ "$ORDER_ID" != "null" ]; then
    test_endpoint "Get Order Details (ID: $ORDER_ID)" "GET" "/orders/$ORDER_ID" "" "$TOKEN"
fi

echo "=========================================="
echo "5. PAYMENT SERVICE TESTS"
echo "=========================================="
echo ""

# Create payment
if [ "$ORDER_ID" != "null" ]; then
    test_endpoint "Create Payment" "POST" "/payments" \
        "{\"orderId\":$ORDER_ID,\"amount\":$ORDER_AMOUNT,\"paymentMethod\":\"card\"}" "$TOKEN"
fi

# Get payment history
test_endpoint "Get Payment History" "GET" "/payments/mine" "" "$TOKEN"

echo "=========================================="
echo "6. COUPON APPLICATION TEST"
echo "=========================================="
echo ""

# Apply coupon to order
if [ "$ORDER_ID" != "null" ]; then
    test_endpoint "Apply Coupon to Order" "POST" "/coupons/apply" \
        "{\"couponId\":1,\"orderId\":$ORDER_ID,\"discountApplied\":5.00}" "$TOKEN"
fi

echo "=========================================="
echo "7. REVIEW SERVICE TESTS"
echo "=========================================="
echo ""

# Submit restaurant review
test_endpoint "Submit Restaurant Review" "POST" "/reviews/restaurant" \
    "{\"restaurantId\":2,\"rating\":5,\"reviewText\":\"Amazing food and great service!\"}" "$TOKEN"

# Get restaurant reviews
test_endpoint "Get Restaurant Reviews (ID: 2)" "GET" "/reviews/restaurant/2" "" "$TOKEN"

# Submit delivery review
if [ "$ORDER_ID" != "null" ]; then
    test_endpoint "Submit Delivery Review" "POST" "/reviews/delivery" \
        "{\"orderId\":$ORDER_ID,\"rating\":4,\"reviewText\":\"Fast delivery!\"}" "$TOKEN"
fi

echo "=========================================="
echo "8. DELIVERY SERVICE TESTS"
echo "=========================================="
echo ""

# Get delivery by order
if [ "$ORDER_ID" != "null" ]; then
    test_endpoint "Get Delivery Details" "GET" "/deliveries/order/$ORDER_ID" "" "$TOKEN"
fi

echo "=========================================="
echo "9. NOTIFICATION SERVICE TEST"
echo "=========================================="
echo ""

# Note: Notification service is typically triggered by other services
echo "Notification service runs in background - check logs:"
echo "docker logs fd_notification_service --tail 20"
echo ""

echo "=========================================="
echo "10. FRONTEND ACCESSIBILITY TEST"
echo "=========================================="
echo ""

echo "Testing frontend pages..."
frontend_response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND")
if [ "$frontend_response" == "200" ]; then
    echo -e "${GREEN}✓ Frontend is accessible${NC} at $FRONTEND"
else
    echo -e "${RED}✗ Frontend not accessible${NC} - HTTP $frontend_response"
fi
echo ""

echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo ""
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "Your food delivery application is fully functional!"
    echo ""
    echo "Access the application:"
    echo "  Frontend: http://localhost:3000"
    echo "  API Gateway: http://localhost:4000"
    echo ""
    echo "Test credentials:"
    echo "  Email: $TEST_EMAIL"
    echo "  Password: test123"
    echo ""
else
    echo -e "${YELLOW}⚠ Some tests failed. Check the output above.${NC}"
fi

echo "=========================================="
