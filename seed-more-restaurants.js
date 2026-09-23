const http = require('http');

const API_BASE = 'localhost:4000';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE.split(':')[0],
      port: API_BASE.split(':')[1],
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || `Status ${res.statusCode}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function seedMoreRestaurants() {
  try {
    console.log('🌱 Adding more restaurants...\n');

    // Login as admin
    const loginRes = await makeRequest('POST', '/users/login', {
      email: 'admin@fooddelivery.com',
      password: 'admin123'
    });
    const adminToken = loginRes.token;
    console.log('✓ Admin logged in\n');

    // More restaurants with diverse cuisines
    const restaurants = [
      {
        name: 'Spice Garden',
        address: '101 Curry Lane, Surat',
        phone: '+91-9876543213',
        cuisine: 'Indian'
      },
      {
        name: 'Taco Fiesta',
        address: '202 Mexican Way, Surat',
        phone: '+91-9876543214',
        cuisine: 'Mexican'
      },
      {
        name: 'Dragon Wok',
        address: '303 Chinese Street, Surat',
        phone: '+91-9876543215',
        cuisine: 'Chinese'
      },
      {
        name: 'Mediterranean Delight',
        address: '404 Greek Ave, Surat',
        phone: '+91-9876543216',
        cuisine: 'Mediterranean'
      },
      {
        name: 'Pasta Paradise',
        address: '505 Italian Blvd, Surat',
        phone: '+91-9876543217',
        cuisine: 'Italian'
      },
      {
        name: 'Thai Basil',
        address: '606 Bangkok Road, Surat',
        phone: '+91-9876543218',
        cuisine: 'Thai'
      },
      {
        name: 'Steakhouse Supreme',
        address: '707 Grill Street, Surat',
        phone: '+91-9876543219',
        cuisine: 'Steakhouse'
      }
    ];

    const restaurantIds = [];
    console.log('Creating restaurants...');
    for (const restaurant of restaurants) {
      try {
        const res = await makeRequest('POST', '/restaurants', restaurant, adminToken);
        restaurantIds.push({ id: res.id, ...restaurant });
        console.log(`✓ Created: ${restaurant.name}`);
      } catch (err) {
        console.log(`⚠ Error creating ${restaurant.name}:`, err.message);
      }
    }
    console.log('');

    // Add menu items for each restaurant
    console.log('Adding menu items...\n');

    // Spice Garden (Indian)
    const indianRestaurant = restaurantIds.find(r => r.name === 'Spice Garden');
    if (indianRestaurant) {
      console.log(`Adding items for ${indianRestaurant.name}...`);
      const items = [
        { name: 'Butter Chicken', description: 'Creamy tomato curry with tender chicken', price: 15.99 },
        { name: 'Paneer Tikka Masala', description: 'Cottage cheese in spicy curry', price: 13.99 },
        { name: 'Biryani', description: 'Aromatic rice with mixed spices', price: 14.99 },
        { name: 'Naan Bread', description: 'Freshly baked Indian flatbread', price: 3.99 },
        { name: 'Samosa', description: 'Crispy pastry with potato filling', price: 5.99 }
      ];
      for (const item of items) {
        try {
          await makeRequest('POST', `/restaurants/${indianRestaurant.id}/menu`, item, adminToken);
          console.log(`  ✓ ${item.name}`);
        } catch (err) {}
      }
    }

    // Taco Fiesta (Mexican)
    const mexicanRestaurant = restaurantIds.find(r => r.name === 'Taco Fiesta');
    if (mexicanRestaurant) {
      console.log(`\nAdding items for ${mexicanRestaurant.name}...`);
      const items = [
        { name: 'Beef Tacos', description: 'Three soft tacos with seasoned beef', price: 11.99 },
        { name: 'Chicken Burrito', description: 'Large wrap with rice and beans', price: 13.99 },
        { name: 'Quesadilla', description: 'Grilled tortilla with cheese', price: 10.99 },
        { name: 'Guacamole & Chips', description: 'Fresh avocado dip with tortilla chips', price: 7.99 },
        { name: 'Churros', description: 'Sweet fried dough with chocolate', price: 6.99 }
      ];
      for (const item of items) {
        try {
          await makeRequest('POST', `/restaurants/${mexicanRestaurant.id}/menu`, item, adminToken);
          console.log(`  ✓ ${item.name}`);
        } catch (err) {}
      }
    }

    // Dragon Wok (Chinese)
    const chineseRestaurant = restaurantIds.find(r => r.name === 'Dragon Wok');
    if (chineseRestaurant) {
      console.log(`\nAdding items for ${chineseRestaurant.name}...`);
      const items = [
        { name: 'Kung Pao Chicken', description: 'Spicy stir-fry with peanuts', price: 14.99 },
        { name: 'Sweet & Sour Pork', description: 'Crispy pork in tangy sauce', price: 15.99 },
        { name: 'Fried Rice', description: 'Classic Chinese fried rice', price: 9.99 },
        { name: 'Spring Rolls', description: 'Crispy vegetable rolls', price: 6.99 },
        { name: 'Chow Mein', description: 'Stir-fried noodles with vegetables', price: 12.99 }
      ];
      for (const item of items) {
        try {
          await makeRequest('POST', `/restaurants/${chineseRestaurant.id}/menu`, item, adminToken);
          console.log(`  ✓ ${item.name}`);
        } catch (err) {}
      }
    }

    // Mediterranean Delight
    const mediterraneanRestaurant = restaurantIds.find(r => r.name === 'Mediterranean Delight');
    if (mediterraneanRestaurant) {
      console.log(`\nAdding items for ${mediterraneanRestaurant.name}...`);
      const items = [
        { name: 'Gyro Platter', description: 'Seasoned lamb with pita and tzatziki', price: 16.99 },
        { name: 'Falafel Wrap', description: 'Chickpea fritters in pita', price: 11.99 },
        { name: 'Greek Salad', description: 'Fresh vegetables with feta cheese', price: 9.99 },
        { name: 'Hummus Plate', description: 'Smooth chickpea dip with pita', price: 8.99 },
        { name: 'Baklava', description: 'Sweet pastry with honey and nuts', price: 6.99 }
      ];
      for (const item of items) {
        try {
          await makeRequest('POST', `/restaurants/${mediterraneanRestaurant.id}/menu`, item, adminToken);
          console.log(`  ✓ ${item.name}`);
        } catch (err) {}
      }
    }

    // Pasta Paradise (Italian)
    const italianRestaurant = restaurantIds.find(r => r.name === 'Pasta Paradise');
    if (italianRestaurant) {
      console.log(`\nAdding items for ${italianRestaurant.name}...`);
      const items = [
        { name: 'Spaghetti Carbonara', description: 'Creamy pasta with bacon', price: 14.99 },
        { name: 'Fettuccine Alfredo', description: 'Rich cream sauce pasta', price: 13.99 },
        { name: 'Lasagna', description: 'Layered pasta with meat sauce', price: 15.99 },
        { name: 'Caesar Salad', description: 'Romaine with parmesan', price: 8.99 },
        { name: 'Tiramisu', description: 'Classic Italian dessert', price: 7.99 }
      ];
      for (const item of items) {
        try {
          await makeRequest('POST', `/restaurants/${italianRestaurant.id}/menu`, item, adminToken);
          console.log(`  ✓ ${item.name}`);
        } catch (err) {}
      }
    }

    // Thai Basil
    const thaiRestaurant = restaurantIds.find(r => r.name === 'Thai Basil');
    if (thaiRestaurant) {
      console.log(`\nAdding items for ${thaiRestaurant.name}...`);
      const items = [
        { name: 'Pad Thai', description: 'Stir-fried rice noodles', price: 13.99 },
        { name: 'Green Curry', description: 'Spicy coconut curry', price: 14.99 },
        { name: 'Tom Yum Soup', description: 'Hot and sour soup', price: 8.99 },
        { name: 'Spring Rolls', description: 'Fresh vegetables wrapped in rice paper', price: 6.99 },
        { name: 'Mango Sticky Rice', description: 'Sweet coconut rice with mango', price: 7.99 }
      ];
      for (const item of items) {
        try {
          await makeRequest('POST', `/restaurants/${thaiRestaurant.id}/menu`, item, adminToken);
          console.log(`  ✓ ${item.name}`);
        } catch (err) {}
      }
    }

    // Steakhouse Supreme
    const steakhouseRestaurant = restaurantIds.find(r => r.name === 'Steakhouse Supreme');
    if (steakhouseRestaurant) {
      console.log(`\nAdding items for ${steakhouseRestaurant.name}...`);
      const items = [
        { name: 'Ribeye Steak', description: 'Prime 12oz ribeye', price: 29.99 },
        { name: 'Filet Mignon', description: 'Tender 8oz filet', price: 32.99 },
        { name: 'BBQ Ribs', description: 'Full rack of baby back ribs', price: 24.99 },
        { name: 'Baked Potato', description: 'Loaded with butter and sour cream', price: 5.99 },
        { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with vanilla ice cream', price: 8.99 }
      ];
      for (const item of items) {
        try {
          await makeRequest('POST', `/restaurants/${steakhouseRestaurant.id}/menu`, item, adminToken);
          console.log(`  ✓ ${item.name}`);
        } catch (err) {}
      }
    }

    console.log('\n✅ More restaurants added successfully!');
    console.log('🌐 Refresh your browser to see all the new restaurants!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

seedMoreRestaurants();
