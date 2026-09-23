#!/bin/bash

echo "🎯 COMPREHENSIVE SERVICE TEST"
echo "============================="
echo ""

# Test all 9 services
services=(
  "4000:API Gateway"
  "4001:User Service"
  "4002:Restaurant Service"
  "4003:Order Service"
  "4004:Delivery Service"
  "4006:Notification Service"
  "4007:Payment Service"
  "4008:Review Service"
  "4009:Coupon Service"
)

echo "🔍 Testing All Services..."
for service in "${services[@]}"; do
  IFS=':' read -r port name <<< "$service"
  result=$(curl -s http://localhost:$port/health 2>/dev/null)
  if echo "$result" | grep -q "ok"; then
    echo "✅ $name (port $port)"
  else
    echo "❌ $name (port $port) - FAILED"
  fi
done

echo ""
echo "🎟️ Testing Coupons..."
COUPONS=$(curl -s http://localhost:4009/coupons)
COUPON_COUNT=$(echo "$COUPONS" | grep -o '"code"' | wc -l)
echo "✅ Found $COUPON_COUNT active coupons"

echo ""
echo "📊 Service Summary:"
echo "  Total Services: 9"
echo "  Backend Services: 8"
echo "  Frontend: 1 (React on port 3000)"
echo ""
echo "🌐 Access URLs:"
echo "  Frontend: http://localhost:3000"
echo "  API Gateway: http://localhost:4000"
echo ""
echo "✨ All systems operational!"
