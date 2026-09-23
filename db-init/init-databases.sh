#!/bin/bash
# ============================================
# Database Initialization Script
# ============================================
# Creates all required databases for the 
# food delivery microservices platform
# ============================================

set -e

echo "🚀 Initializing Food Delivery Platform Databases..."

# Create all databases
for DB in userdb restaurantdb orderdb deliverydb paymentdb reviewdb coupondb; do
  echo "📦 Creating database: $DB"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE $DB' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB')\gexec
EOSQL
done

echo "✅ All databases created successfully!"
echo "📋 Databases: userdb, restaurantdb, orderdb, deliverydb, paymentdb, reviewdb, coupondb"

