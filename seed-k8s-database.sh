#!/bin/bash

# Script to seed Kubernetes PostgreSQL database with initial data
# Run this after deploying to Kubernetes

set -e

echo "=========================================="
echo "Seeding Kubernetes Database"
echo "=========================================="
echo ""

# Get postgres pod name
POSTGRES_POD=$(kubectl get pod -n food-delivery -l app=postgres -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POSTGRES_POD" ]; then
  echo "Error: PostgreSQL pod not found"
  echo "Make sure PostgreSQL is deployed: kubectl get pods -n food-delivery"
  exit 1
fi

echo "Found PostgreSQL pod: $POSTGRES_POD"
echo ""

# Seed restaurants
echo "Seeding restaurants..."
kubectl exec -n food-delivery $POSTGRES_POD -- psql -U postgres -d restaurantdb <<EOF
INSERT INTO restaurants (name, address, phone) VALUES
('Pizza Palace', '123 Main St, Downtown', '555-0101'),
('Burger House', '456 Oak Ave, Midtown', '555-0102'),
('Sushi Master', '789 Pine Rd, Uptown', '555-0103'),
('Spice Garden', '321 Elm St, Westside', '555-0104'),
('Taco Fiesta', '654 Maple Dr, Eastside', '555-0105'),
('Dragon Wok', '987 Cedar Ln, Northside', '555-0106'),
('Mediterranean Grill', '147 Birch Ct, Southside', '555-0107'),
('Pasta Paradise', '258 Willow Way, Central', '555-0108'),
('Thai Basil', '369 Spruce St, Harbor', '555-0109'),
('Steakhouse Prime', '741 Redwood Blvd, Heights', '555-0110')
ON CONFLICT DO NOTHING;
EOF

echo "✓ Restaurants seeded"

# Seed menu items
echo "Seeding menu items..."
kubectl exec -n food-delivery $POSTGRES_POD -- psql -U postgres -d restaurantdb <<'EOF'
-- Pizza Palace menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
(1, 'Margherita Pizza', 'Classic tomato, mozzarella, basil', 12.99, 'Main'),
(1, 'Pepperoni Pizza', 'Loaded with pepperoni', 14.99, 'Main'),
(1, 'Veggie Supreme', 'Fresh vegetables, mushrooms, olives', 13.99, 'Main'),
(1, 'BBQ Chicken Pizza', 'BBQ sauce, chicken, onions', 15.99, 'Main'),
(1, 'Garlic Bread', 'Toasted with butter and garlic', 5.99, 'Side')
ON CONFLICT DO NOTHING;

-- Burger House menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
(2, 'Classic Burger', 'Beef patty, lettuce, tomato, cheese', 9.99, 'Main'),
(2, 'Bacon Cheeseburger', 'With crispy bacon', 11.99, 'Main'),
(2, 'Veggie Burger', 'Plant-based patty', 10.99, 'Main'),
(2, 'French Fries', 'Crispy golden fries', 3.99, 'Side'),
(2, 'Onion Rings', 'Beer-battered onion rings', 4.99, 'Side')
ON CONFLICT DO NOTHING;

-- Sushi Master menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
(3, 'California Roll', '8 pieces', 8.99, 'Main'),
(3, 'Spicy Tuna Roll', '8 pieces', 9.99, 'Main'),
(3, 'Salmon Nigiri', '6 pieces', 12.99, 'Main'),
(3, 'Miso Soup', 'Traditional Japanese soup', 3.99, 'Side'),
(3, 'Edamame', 'Steamed soybeans', 4.99, 'Side')
ON CONFLICT DO NOTHING;

-- Spice Garden menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
(4, 'Chicken Tikka Masala', 'Creamy tomato curry', 13.99, 'Main'),
(4, 'Butter Chicken', 'Rich and creamy', 14.99, 'Main'),
(4, 'Vegetable Biryani', 'Aromatic rice dish', 11.99, 'Main'),
(4, 'Naan Bread', 'Freshly baked', 2.99, 'Side'),
(4, 'Samosas', '4 pieces', 5.99, 'Appetizer')
ON CONFLICT DO NOTHING;

-- Taco Fiesta menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
(5, 'Beef Tacos', '3 tacos', 8.99, 'Main'),
(5, 'Chicken Quesadilla', 'Grilled with cheese', 10.99, 'Main'),
(5, 'Burrito Bowl', 'Rice, beans, choice of protein', 11.99, 'Main'),
(5, 'Nachos', 'With cheese and jalapeños', 6.99, 'Appetizer'),
(5, 'Guacamole & Chips', 'Fresh guacamole', 5.99, 'Side')
ON CONFLICT DO NOTHING;

-- Dragon Wok menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
(6, 'Kung Pao Chicken', 'Spicy stir-fry', 12.99, 'Main'),
(6, 'Beef Fried Rice', 'Classic fried rice', 10.99, 'Main'),
(6, 'Sweet & Sour Pork', 'Tangy sauce', 13.99, 'Main'),
(6, 'Spring Rolls', '4 pieces', 4.99, 'Appetizer'),
(6, 'Wonton Soup', 'Pork wontons', 5.99, 'Soup')
ON CONFLICT DO NOTHING;

-- Mediterranean Grill menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
(7, 'Chicken Shawarma', 'Wrapped in pita', 11.99, 'Main'),
(7, 'Lamb Kebab', 'Grilled lamb skewers', 15.99, 'Main'),
(7, 'Falafel Plate', 'Vegetarian chickpea fritters', 10.99, 'Main'),
(7, 'Hummus & Pita', 'Creamy chickpea dip', 6.99, 'Appetizer'),
(7, 'Greek Salad', 'Fresh vegetables, feta', 7.99, 'Side')
ON CONFLICT DO NOTHING;

-- Pasta Paradise menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
(8, 'Spaghetti Carbonara', 'Creamy bacon pasta', 13.99, 'Main'),
(8, 'Fettuccine Alfredo', 'Rich cream sauce', 12.99, 'Main'),
(8, 'Lasagna', 'Layered meat and cheese', 14.99, 'Main'),
(8, 'Caesar Salad', 'Romaine, croutons, parmesan', 7.99, 'Side'),
(8, 'Tiramisu', 'Italian coffee dessert', 6.99, 'Dessert')
ON CONFLICT DO NOTHING;

-- Thai Basil menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
(9, 'Pad Thai', 'Stir-fried noodles', 11.99, 'Main'),
(9, 'Green Curry', 'Spicy coconut curry', 12.99, 'Main'),
(9, 'Tom Yum Soup', 'Hot and sour soup', 8.99, 'Soup'),
(9, 'Spring Rolls', 'Fresh vegetable rolls', 5.99, 'Appetizer'),
(9, 'Mango Sticky Rice', 'Sweet dessert', 6.99, 'Dessert')
ON CONFLICT DO NOTHING;

-- Steakhouse Prime menu
INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES
(10, 'Ribeye Steak', '12oz premium cut', 29.99, 'Main'),
(10, 'Filet Mignon', '8oz tender cut', 34.99, 'Main'),
(10, 'Grilled Salmon', 'Atlantic salmon', 24.99, 'Main'),
(10, 'Loaded Baked Potato', 'Cheese, bacon, sour cream', 6.99, 'Side'),
(10, 'Chocolate Lava Cake', 'Warm molten center', 7.99, 'Dessert')
ON CONFLICT DO NOTHING;
EOF

echo "✓ Menu items seeded"

# Seed coupons
echo "Seeding coupons..."
kubectl exec -n food-delivery $POSTGRES_POD -- psql -U postgres -d coupondb <<EOF
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, valid_until) VALUES
('WELCOME50', 'Welcome discount - 50% off', 'percentage', 50, 15, 10, '2027-12-31'),
('SAVE20', '20% off on orders above \$25', 'percentage', 20, 25, 15, '2027-12-31'),
('FLAT10', '\$10 flat discount', 'fixed', 10, 30, 10, '2027-12-31'),
('FEAST30', '30% off on orders above \$50', 'percentage', 30, 50, 25, '2027-12-31')
ON CONFLICT (code) DO NOTHING;
EOF

echo "✓ Coupons seeded"

echo ""
echo "=========================================="
echo "✓ Database seeded successfully!"
echo "=========================================="
echo ""
echo "Data seeded:"
echo "  - 10 Restaurants"
echo "  - 50 Menu Items"
echo "  - 4 Coupons"
echo ""
echo "You can now test the application!"
echo ""
