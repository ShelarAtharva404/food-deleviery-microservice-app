#!/bin/bash
# Seed data for Docker containers

echo "🌱 Seeding Food Delivery Platform Data..."

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Seed Restaurant Data
echo "🍽️  Seeding restaurants..."
docker exec fd_postgres psql -U postgres -d restaurantdb <<EOF
-- Insert 10 restaurants
INSERT INTO restaurants (name, address, phone, cuisine_type) VALUES
('Pizza Palace', '123 Main St, Downtown', '555-0101', 'Italian'),
('Burger House', '456 Oak Ave, Midtown', '555-0102', 'American'),
('Sushi Master', '789 Pine Rd, Uptown', '555-0103', 'Japanese'),
('Spice Garden', '321 Elm St, Westside', '555-0104', 'Indian'),
('Taco Fiesta', '654 Maple Dr, Eastside', '555-0105', 'Mexican'),
('Dragon Wok', '987 Cedar Ln, Northside', '555-0106', 'Chinese'),
('Mediterranean Grill', '147 Birch Ct, Southside', '555-0107', 'Mediterranean'),
('Pasta Paradise', '258 Willow Way, Central', '555-0108', 'Italian'),
('Thai Basil', '369 Spruce St, Harbor', '555-0109', 'Thai'),
('Steakhouse Prime', '741 Redwood Blvd, Heights', '555-0110', 'Steakhouse')
ON CONFLICT DO NOTHING;

-- Get restaurant IDs and insert menu items
DO \$\$
DECLARE
    r RECORD;
BEGIN
    -- Pizza Palace Menu
    SELECT id INTO r FROM restaurants WHERE name = 'Pizza Palace' LIMIT 1;
    IF FOUND THEN
        INSERT INTO menu_items (restaurant_id, name, description, price, category, available) VALUES
        (r.id, 'Margherita Pizza', 'Classic tomato, mozzarella, basil', 12.99, 'Pizza', true),
        (r.id, 'Pepperoni Pizza', 'Loaded with pepperoni', 14.99, 'Pizza', true),
        (r.id, 'Veggie Supreme', 'Fresh vegetables, mushrooms, olives', 13.99, 'Pizza', true),
        (r.id, 'BBQ Chicken Pizza', 'BBQ sauce, chicken, onions', 15.99, 'Pizza', true),
        (r.id, 'Garlic Bread', 'Toasted with butter and garlic', 5.99, 'Sides', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Burger House Menu
    SELECT id INTO r FROM restaurants WHERE name = 'Burger House' LIMIT 1;
    IF FOUND THEN
        INSERT INTO menu_items (restaurant_id, name, description, price, category, available) VALUES
        (r.id, 'Classic Burger', 'Beef patty, lettuce, tomato, cheese', 10.99, 'Burgers', true),
        (r.id, 'Bacon Cheeseburger', 'Double patty with bacon', 13.99, 'Burgers', true),
        (r.id, 'Veggie Burger', 'Plant-based patty', 11.99, 'Burgers', true),
        (r.id, 'French Fries', 'Crispy golden fries', 4.99, 'Sides', true),
        (r.id, 'Milkshake', 'Chocolate, vanilla, or strawberry', 5.99, 'Drinks', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Sushi Master Menu
    SELECT id INTO r FROM restaurants WHERE name = 'Sushi Master' LIMIT 1;
    IF FOUND THEN
        INSERT INTO menu_items (restaurant_id, name, description, price, category, available) VALUES
        (r.id, 'California Roll', 'Crab, avocado, cucumber', 8.99, 'Rolls', true),
        (r.id, 'Spicy Tuna Roll', 'Fresh tuna with spicy mayo', 10.99, 'Rolls', true),
        (r.id, 'Dragon Roll', 'Eel, avocado, topped with fish roe', 14.99, 'Rolls', true),
        (r.id, 'Miso Soup', 'Traditional Japanese soup', 3.99, 'Soup', true),
        (r.id, 'Edamame', 'Steamed soybeans', 4.99, 'Appetizers', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Spice Garden Menu
    SELECT id INTO r FROM restaurants WHERE name = 'Spice Garden' LIMIT 1;
    IF FOUND THEN
        INSERT INTO menu_items (restaurant_id, name, description, price, category, available) VALUES
        (r.id, 'Chicken Tikka Masala', 'Creamy tomato curry', 15.99, 'Main Course', true),
        (r.id, 'Lamb Biryani', 'Fragrant rice with spiced lamb', 17.99, 'Main Course', true),
        (r.id, 'Paneer Butter Masala', 'Cottage cheese in rich gravy', 13.99, 'Vegetarian', true),
        (r.id, 'Garlic Naan', 'Fresh baked bread', 3.99, 'Bread', true),
        (r.id, 'Samosa', 'Crispy pastry with spiced potatoes', 5.99, 'Appetizers', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Taco Fiesta Menu
    SELECT id INTO r FROM restaurants WHERE name = 'Taco Fiesta' LIMIT 1;
    IF FOUND THEN
        INSERT INTO menu_items (restaurant_id, name, description, price, category, available) VALUES
        (r.id, 'Beef Tacos', 'Three soft tacos with seasoned beef', 9.99, 'Tacos', true),
        (r.id, 'Chicken Burrito', 'Grilled chicken, beans, rice', 11.99, 'Burritos', true),
        (r.id, 'Fish Tacos', 'Crispy fish with cabbage slaw', 12.99, 'Tacos', true),
        (r.id, 'Chips & Guacamole', 'Fresh tortilla chips', 6.99, 'Appetizers', true),
        (r.id, 'Quesadilla', 'Cheese-filled tortilla', 8.99, 'Quesadillas', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Dragon Wok Menu
    SELECT id INTO r FROM restaurants WHERE name = 'Dragon Wok' LIMIT 1;
    IF FOUND THEN
        INSERT INTO menu_items (restaurant_id, name, description, price, category, available) VALUES
        (r.id, 'Kung Pao Chicken', 'Spicy stir-fry with peanuts', 13.99, 'Main Course', true),
        (r.id, 'Beef Lo Mein', 'Noodles with vegetables', 12.99, 'Noodles', true),
        (r.id, 'Sweet & Sour Pork', 'Crispy pork in tangy sauce', 14.99, 'Main Course', true),
        (r.id, 'Spring Rolls', 'Vegetable filled rolls', 5.99, 'Appetizers', true),
        (r.id, 'Fried Rice', 'Egg fried rice with vegetables', 9.99, 'Rice', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Mediterranean Grill Menu
    SELECT id INTO r FROM restaurants WHERE name = 'Mediterranean Grill' LIMIT 1;
    IF FOUND THEN
        INSERT INTO menu_items (restaurant_id, name, description, price, category, available) VALUES
        (r.id, 'Chicken Shawarma', 'Grilled chicken wrap', 11.99, 'Wraps', true),
        (r.id, 'Lamb Kebab', 'Skewered grilled lamb', 16.99, 'Main Course', true),
        (r.id, 'Falafel Plate', 'Chickpea fritters with tahini', 10.99, 'Vegetarian', true),
        (r.id, 'Hummus & Pita', 'Creamy chickpea dip', 6.99, 'Appetizers', true),
        (r.id, 'Greek Salad', 'Fresh vegetables with feta', 8.99, 'Salads', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Pasta Paradise Menu
    SELECT id INTO r FROM restaurants WHERE name = 'Pasta Paradise' LIMIT 1;
    IF FOUND THEN
        INSERT INTO menu_items (restaurant_id, name, description, price, category, available) VALUES
        (r.id, 'Spaghetti Carbonara', 'Creamy bacon pasta', 14.99, 'Pasta', true),
        (r.id, 'Fettuccine Alfredo', 'Rich cream sauce', 13.99, 'Pasta', true),
        (r.id, 'Lasagna', 'Layered pasta with meat sauce', 15.99, 'Pasta', true),
        (r.id, 'Caesar Salad', 'Romaine with parmesan', 7.99, 'Salads', true),
        (r.id, 'Tiramisu', 'Classic Italian dessert', 6.99, 'Desserts', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Thai Basil Menu
    SELECT id INTO r FROM restaurants WHERE name = 'Thai Basil' LIMIT 1;
    IF FOUND THEN
        INSERT INTO menu_items (restaurant_id, name, description, price, category, available) VALUES
        (r.id, 'Pad Thai', 'Stir-fried noodles with shrimp', 13.99, 'Noodles', true),
        (r.id, 'Green Curry', 'Spicy coconut curry', 14.99, 'Curry', true),
        (r.id, 'Tom Yum Soup', 'Hot and sour soup', 8.99, 'Soup', true),
        (r.id, 'Spring Rolls', 'Fresh vegetable rolls', 6.99, 'Appetizers', true),
        (r.id, 'Mango Sticky Rice', 'Sweet dessert', 7.99, 'Desserts', true)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Steakhouse Prime Menu
    SELECT id INTO r FROM restaurants WHERE name = 'Steakhouse Prime' LIMIT 1;
    IF FOUND THEN
        INSERT INTO menu_items (restaurant_id, name, description, price, category, available) VALUES
        (r.id, 'Ribeye Steak', '12oz premium cut', 29.99, 'Steaks', true),
        (r.id, 'Filet Mignon', '8oz tender cut', 34.99, 'Steaks', true),
        (r.id, 'Grilled Salmon', 'Atlantic salmon fillet', 24.99, 'Seafood', true),
        (r.id, 'Loaded Baked Potato', 'With cheese and bacon', 6.99, 'Sides', true),
        (r.id, 'Chocolate Lava Cake', 'Warm chocolate dessert', 8.99, 'Desserts', true)
        ON CONFLICT DO NOTHING;
    END IF;
END \$\$;
EOF

echo "✅ Restaurants seeded successfully!"

# Seed Coupon Data
echo "🎟️  Seeding coupons..."
docker exec fd_postgres psql -U postgres -d coupondb <<EOF
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_until, usage_limit, user_limit, is_active) VALUES
('WELCOME50', 'Welcome discount - 50% off', 'percentage', 50.00, 15.00, 10.00, NOW(), NOW() + INTERVAL '1 year', 1000, 1, true),
('SAVE20', '20% off on orders above \$25', 'percentage', 20.00, 25.00, 15.00, NOW(), NOW() + INTERVAL '1 year', 2000, 3, true),
('FLAT10', '\$10 flat discount', 'fixed', 10.00, 30.00, 10.00, NOW(), NOW() + INTERVAL '1 year', 1500, 2, true),
('FEAST30', '30% off on orders above \$50', 'percentage', 30.00, 50.00, 25.00, NOW(), NOW() + INTERVAL '1 year', 500, 1, true)
ON CONFLICT (code) DO NOTHING;
EOF

echo "✅ Coupons seeded successfully!"

echo ""
echo "🎉 All data seeded successfully!"
echo ""
echo "📊 Summary:"
echo "  - 10 Restaurants with 50+ menu items"
echo "  - 4 Active coupons (WELCOME50, SAVE20, FLAT10, FEAST30)"
echo ""
echo "🌐 Access your application:"
echo "  Frontend: http://localhost:3000"
echo "  API Gateway: http://localhost:4000"
echo ""
echo "✨ Ready to order food!"
