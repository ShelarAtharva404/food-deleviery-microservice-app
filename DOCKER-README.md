# 🍔 Food Delivery Platform - Docker Setup

A complete microservices-based food delivery platform with 9 backend services, API Gateway, PostgreSQL database, and React frontend.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Services Overview](#services-overview)
- [Database Configuration](#database-configuration)
- [Environment Variables](#environment-variables)
- [Docker Commands](#docker-commands)
- [Accessing Services](#accessing-services)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                      http://localhost:3000                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (Port 4000)                      │
│           Centralized routing for all microservices              │
└─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────────────┘
      │     │     │     │     │     │     │     │
      ▼     ▼     ▼     ▼     ▼     ▼     ▼     ▼
    ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
    │ U │ │ R │ │ O │ │ D │ │ N │ │ P │ │ R │ │ C │
    │ S │ │ S │ │ S │ │ S │ │ S │ │ S │ │ S │ │ S │
    │ E │ │ E │ │ R │ │ E │ │ O │ │ A │ │ E │ │ O │
    │ R │ │ S │ │ D │ │ L │ │ T │ │ Y │ │ V │ │ U │
    └─┬─┘ └─┬─┘ └─┬─┘ └─┬─┘ └───┘ └─┬─┘ └─┬─┘ └─┬─┘
      │     │     │     │           │     │     │
      └─────┴─────┴─────┴───────────┴─────┴─────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │    PostgreSQL Database            │
        │  (7 separate databases)           │
        │  - userdb                         │
        │  - restaurantdb                   │
        │  - orderdb                        │
        │  - deliverydb                     │
        │  - paymentdb                      │
        │  - reviewdb                       │
        │  - coupondb                       │
        └───────────────────────────────────┘
```

**Services:**
- **US** = User Service (4001)
- **RS** = Restaurant Service (4002)
- **OS** = Order Service (4003)
- **DS** = Delivery Service (4004)
- **NS** = Notification Service (4006)
- **PS** = Payment Service (4007)
- **RS** = Review Service (4008)
- **CS** = Coupon Service (4009)

---

## ✅ Prerequisites

Before running the application with Docker, ensure you have:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **8GB RAM** minimum (recommended for all services)
- **10GB disk space** available

### Check Docker Installation:
```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start

### 1. Clone or Navigate to Project
```bash
cd /path/to/food-delivery-app
```

### 2. Build and Start All Services
```bash
docker-compose up --build
```

This will:
- ✅ Build all 12 containers (9 services + API Gateway + PostgreSQL + Frontend)
- ✅ Create 7 PostgreSQL databases
- ✅ Run database migrations
- ✅ Start all services with proper dependencies
- ✅ Set up internal networking

### 3. Wait for Services to Start
Wait until you see:
```
fd_api_gateway         | api-gateway listening on 4000
fd_user_service        | user-service listening on 4001
fd_restaurant_service  | restaurant-service listening on 4002
...
fd_frontend            | Nginx started
```

### 4. Access the Application
Open your browser: **http://localhost:3000**

---

## 🔧 Services Overview

| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| **Frontend** | 3000 | - | React web application |
| **API Gateway** | 4000 | - | Central routing endpoint |
| **User Service** | 4001 | userdb | Authentication & user management |
| **Restaurant Service** | 4002 | restaurantdb | Restaurant & menu management |
| **Order Service** | 4003 | orderdb | Order processing & tracking |
| **Delivery Service** | 4004 | deliverydb | Delivery assignment & tracking |
| **Notification Service** | 4006 | - | Email/SMS notifications |
| **Payment Service** | 4007 | paymentdb | Payment processing |
| **Review Service** | 4008 | reviewdb | Restaurant reviews & ratings |
| **Coupon Service** | 4009 | coupondb | Discount coupon management |
| **PostgreSQL** | 5432 | 7 databases | Database server |

---

## 🗄️ Database Configuration

### PostgreSQL Setup

**Single PostgreSQL instance** running 7 separate databases:

1. **userdb** - User accounts, authentication
2. **restaurantdb** - Restaurants, menus, menu items
3. **orderdb** - Orders, order items, order history
4. **deliverydb** - Delivery assignments, tracking
5. **paymentdb** - Payment records, transactions
6. **reviewdb** - Restaurant reviews, ratings
7. **coupondb** - Discount coupons, usage tracking

### Database Credentials (Docker)
```
Host: postgres (internal) / localhost (external)
Port: 5432
Username: postgres
Password: postgres
```

### Initialization
Databases are automatically created via `/db-init/init-databases.sh` on first run.

### Migrations
Each service runs its own migrations from the `migrations/` folder on startup using the `waitForDb()` function.

### Accessing PostgreSQL
```bash
# From host machine
psql -h localhost -U postgres -d userdb

# From inside Docker network
docker exec -it fd_postgres psql -U postgres -d userdb
```

---

## 🔐 Environment Variables

### Production Considerations

**⚠️ CHANGE THESE IN PRODUCTION:**

1. **JWT_SECRET** - Currently: `dev_secret_change_me_in_production`
   ```yaml
   JWT_SECRET: "your-strong-secret-key-here"
   ```

2. **PostgreSQL Password** - Currently: `postgres`
   ```yaml
   POSTGRES_PASSWORD: "strong-password-here"
   ```

3. **Database Credentials** - Update in all service configs

### Custom Environment Variables

Create `.env` files in each service directory:

```bash
# Example: user-service/.env
JWT_SECRET=custom_secret
PGPASSWORD=custom_password
```

---

## 🐳 Docker Commands

### Start Services (Detached Mode)
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ Deletes all data)
```bash
docker-compose down -v
```

### Rebuild Specific Service
```bash
docker-compose build user-service
docker-compose up -d user-service
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-service

# Last 100 lines
docker-compose logs --tail=100 -f
```

### Check Service Status
```bash
docker-compose ps
```

### Restart a Service
```bash
docker-compose restart user-service
```

### Execute Commands in Container
```bash
# Open shell in user-service
docker exec -it fd_user_service sh

# Run npm command
docker exec -it fd_user_service npm run test
```

### Scale Services (if needed)
```bash
docker-compose up -d --scale user-service=3
```

---

## 🌐 Accessing Services

### Frontend
- **URL:** http://localhost:3000
- **Features:** Browse restaurants, place orders, manage cart, checkout

### API Gateway
- **Base URL:** http://localhost:4000
- **Health Check:** http://localhost:4000/health

### API Endpoints (via Gateway)

```bash
# User endpoints
POST http://localhost:4000/api/users/register
POST http://localhost:4000/api/users/login
GET  http://localhost:4000/api/users/me

# Restaurant endpoints
GET  http://localhost:4000/api/restaurants
GET  http://localhost:4000/api/restaurants/:id
GET  http://localhost:4000/api/restaurants/:id/menu

# Order endpoints
POST http://localhost:4000/api/orders
GET  http://localhost:4000/api/orders/mine

# Payment endpoints
POST http://localhost:4000/api/payments
GET  http://localhost:4000/api/payments/:orderId

# Review endpoints
POST http://localhost:4000/api/reviews/restaurant
GET  http://localhost:4000/api/reviews/restaurant/:id

# Coupon endpoints
GET  http://localhost:4000/api/coupons
POST http://localhost:4000/api/coupons/validate
```

### Direct Service Access (for debugging)
```bash
curl http://localhost:4001/health  # User Service
curl http://localhost:4002/health  # Restaurant Service
curl http://localhost:4003/health  # Order Service
# ... etc
```

---

## 🔍 Troubleshooting

### Services Won't Start

**Check logs:**
```bash
docker-compose logs
```

**Common issues:**
- Port conflicts: Ensure ports 3000, 4000-4009, 5432 are free
- Memory: Increase Docker memory allocation to 8GB
- Disk space: Ensure sufficient disk space

### Database Connection Errors

**Verify PostgreSQL is running:**
```bash
docker-compose ps postgres
```

**Check database exists:**
```bash
docker exec -it fd_postgres psql -U postgres -c "\l"
```

**Restart database:**
```bash
docker-compose restart postgres
```

### Frontend Not Loading

**Check if build completed:**
```bash
docker-compose logs frontend
```

**Rebuild frontend:**
```bash
docker-compose build frontend
docker-compose up -d frontend
```

### API Gateway Returns 502

**Verify all backend services are running:**
```bash
docker-compose ps
```

**Check service health:**
```bash
for port in {4001..4009}; do
  echo "Checking port $port:"
  curl -s http://localhost:$port/health || echo "Failed"
done
```

### Reset Everything

**Complete cleanup and fresh start:**
```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild and start
docker-compose up --build
```

### Container Keeps Restarting

**Check specific service logs:**
```bash
docker-compose logs --tail=50 service-name
```

**Common causes:**
- Database not ready (wait for health check)
- Missing dependencies (rebuild: `docker-compose build service-name`)
- Port conflicts
- Environment variable issues

---

## 📊 Monitoring & Health Checks

### Service Health Endpoints
All services expose `/health` endpoints:
```bash
curl http://localhost:4000/health  # Gateway
curl http://localhost:4001/health  # User Service
# ... etc
```

### Docker Health Status
```bash
docker-compose ps
```

Look for `healthy` status in the State column.

---

## 🛑 Stopping the Application

### Graceful Shutdown
```bash
docker-compose down
```

### Force Stop
```bash
docker-compose kill
```

### Remove All Data
```bash
docker-compose down -v
```

---

## 📝 Notes

- **First run takes 5-10 minutes** to build all images
- **Subsequent starts are faster** (~1 minute)
- **Data persists** between restarts (stored in Docker volume `pgdata`)
- **JWT tokens** are for development only - change in production
- **CORS is enabled** for localhost:3000 by default

---

## 🎯 Next Steps

1. ✅ **Register a user** at http://localhost:3000/register
2. ✅ **Login** with your credentials
3. ✅ **Browse restaurants** on the home page
4. ✅ **Add items to cart** and checkout
5. ✅ **Apply coupons** (WELCOME50, SAVE20, FLAT10, FEAST30)
6. ✅ **Complete payment** (fake payment gateway)
7. ✅ **Track orders** in "My Orders"
8. ✅ **Leave reviews** after order completion

---

## 🤝 Support

For issues, check:
1. Service logs: `docker-compose logs service-name`
2. Database logs: `docker-compose logs postgres`
3. Network connectivity: `docker network inspect food-delivery-app_food-delivery-network`

---

**Happy Coding! 🚀**
