# Food Delivery App - Quick Start Guide

## 🚀 Start the Application

```bash
cd /home/atharva/Downloads/food-delivery-app
docker compose up -d
```

Wait 30 seconds for all services to initialize.

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | User interface |
| **API Gateway** | http://localhost:4000 | API endpoint |
| **PostgreSQL** | localhost:5433 | Database (user: postgres, pass: postgres) |

## 📱 Test the Application

### Option 1: Use the Frontend
1. Open http://localhost:3000
2. Click "Register" and create an account
3. Login with your credentials
4. Browse restaurants and place an order

### Option 2: Use the Test Script
```bash
cd /home/atharva/Downloads/food-delivery-app
./comprehensive-test.sh
```

This script will:
- Register a test user
- Login and get JWT token
- Test all API endpoints
- Create orders, payments, reviews
- Validate coupons
- Show success/failure for each test

## 🎟️ Available Coupons

| Code | Discount | Min Order | Max Discount |
|------|----------|-----------|--------------|
| **WELCOME50** | 50% off | $15 | $10 |
| **SAVE20** | 20% off | $25 | $15 |
| **FLAT10** | $10 flat | $30 | $10 |
| **FEAST30** | 30% off | $50 | $25 |

## 🍕 Sample Restaurants

1. **Pizza Palace** - Pizzas, Garlic Bread
2. **Burger House** - Burgers, Fries
3. **Sushi Master** - Sushi, Rolls
4. **Spice Garden** - Indian Cuisine
5. **Taco Fiesta** - Mexican Food
6. **Dragon Wok** - Chinese Food
7. **Mediterranean Grill** - Mediterranean
8. **Pasta Paradise** - Italian Pasta
9. **Thai Basil** - Thai Food
10. **Steakhouse Prime** - Steaks

## 🔧 Useful Commands

### Check Service Status
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker logs fd_order_service -f
```

### Restart a Service
```bash
docker compose restart service-name
# Example: docker compose restart payment-service
```

### Stop Everything
```bash
docker compose down
```

### Stop and Remove Data
```bash
docker compose down -v
```

## 📊 Database Access

```bash
# Connect to PostgreSQL
docker exec -it fd_postgres psql -U postgres

# List databases
\l

# Connect to a specific database
\c restaurantdb

# List tables
\dt

# Run query
SELECT * FROM restaurants;
```

## 🐛 Troubleshooting

### Frontend not loading?
```bash
docker compose restart frontend
```

### Service keeps restarting?
```bash
# Check logs for the specific service
docker logs fd_service_name --tail 50
```

### Database connection issues?
```bash
# Restart PostgreSQL
docker compose restart postgres

# Check database is running
docker exec fd_postgres pg_isready
```

### Port already in use?
```bash
# Find process using port (e.g., 3000)
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Reset everything?
```bash
# Stop and remove all containers and volumes
docker compose down -v

# Start fresh
docker compose up -d

# Re-seed data
./seed-docker-data.sh
```

## 🎯 Common Tasks

### Add a new restaurant
```bash
docker exec fd_postgres psql -U postgres -d restaurantdb -c "
INSERT INTO restaurants (name, address, phone) 
VALUES ('New Restaurant', '123 Food Street', '555-0123');
"
```

### Add menu items
```bash
docker exec fd_postgres psql -U postgres -d restaurantdb -c "
INSERT INTO menu_items (restaurant_id, name, description, price, category) 
VALUES (2, 'Special Pizza', 'House special', 19.99, 'Main');
"
```

### View all orders
```bash
docker exec fd_postgres psql -U postgres -d orderdb -c "
SELECT o.id, o.status, o.total_amount, u.email, r.name as restaurant
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN restaurants r ON o.restaurant_id = r.id
ORDER BY o.created_at DESC
LIMIT 10;
"
```

### Check coupon usage
```bash
docker exec fd_postgres psql -U postgres -d coupondb -c "
SELECT c.code, c.used_count, c.usage_limit, 
       (c.usage_limit - c.used_count) as remaining
FROM coupons c;
"
```

## 📈 System Health Check

Run this one-liner to check everything:
```bash
curl -s http://localhost:4000/health && \
docker ps --filter name=fd_ --format "{{.Names}}: {{.Status}}" | grep -c healthy && \
echo "Services healthy"
```

Expected output: Shows API gateway is "ok" and all services are healthy.

## 🔐 Default Credentials

### Test User (created by test script)
- Email: test[timestamp]@food.com
- Password: test123

### Database
- User: postgres
- Password: postgres
- Host: localhost
- Port: 5433

## 📚 API Documentation

See [TEST-RESULTS.md](./TEST-RESULTS.md) for:
- Complete API endpoint list
- Request/response examples
- Authentication details
- Feature documentation

## 💡 Pro Tips

1. **Keep logs clean**: Restart containers periodically
   ```bash
   docker compose restart
   ```

2. **Monitor resources**: Check CPU/Memory usage
   ```bash
   docker stats
   ```

3. **Backup database**: Export before major changes
   ```bash
   docker exec fd_postgres pg_dump -U postgres -d restaurantdb > backup.sql
   ```

4. **Use jq for API testing**: Format JSON responses
   ```bash
   curl http://localhost:4000/api/restaurants | jq .
   ```

5. **Check notification logs**: See all triggered events
   ```bash
   docker logs fd_notification_service | grep "EVENT:"
   ```

## 🎉 You're All Set!

The application is fully functional with:
- ✅ 13 Restaurants
- ✅ 53 Menu Items
- ✅ 4 Active Coupons
- ✅ Complete Payment System
- ✅ Review & Rating System
- ✅ Order Tracking
- ✅ User Authentication

**Start exploring at:** http://localhost:3000

---

Need help? Check logs with `docker compose logs -f` or run `./comprehensive-test.sh` to verify everything works.
