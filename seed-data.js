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

async function seedData() {
  try {
    console.log('🌱 Starting to seed data...\n');

    // 1. Register an admin user
    console.log('1. Registering admin user...');
    let adminToken;
    try {
      await makeRequest('POST', '/users/register', {
        name: 'Admin User',
        email: 'admin@fooddelivery.com',
        password: 'admin123',
        address: '123 Admin Street',
        phone: '+1234567890',
        role: 'admin'
      });
      console.log('   ✓ Admin user registered');
    } catch (err) {
      if (err.message.includes('exists') || err.message.includes('registered')) {
        console.log('   ℹ Admin user already exists, logging in...');
      } else {
        console.log('   ⚠ Registration error:', err.message);
      }
    }

    // Login as admin
    const loginRes = await makeRequest('POST', '/users/login', {
      email: 'admin@fooddelivery.com',
      password: 'admin123'
    });
    adminToken = loginRes.token;
    console.log('   ✓ Admin logged in\n');

    // 2. Create restaurants
    console.log('2. Creating restaurants...');
    const restaurants = [
      {
        name: 'Pizza Palace',
        address: '456 Italian Ave, Surat',
        phone: '+91-9876543210'
      },
      {
        name: 'Burger House',
        address: '789 Fast Food Lane, Surat',
        phone: '+91-9876543211'
      },
      {
        name: 'Sushi Master',
        address: '321 Japanese St, Surat',
        phone: '+91-9876543212'
      }
    ];

    const restaurantIds = [];
    for (const restaurant of restaurants) {
      try {
        const res = await makeRequest('POST', '/restaurants', restaurant, adminToken);
        restaurantIds.push(res.id);
        console.log(`   ✓ Created: ${restaurant.name}`);
      } catch (err) {
        console.log(`   ⚠ Error creating ${restaurant.name}:`, err.message);
      }
    }
    console.log('');

    // 3. Add menu items
    console.log('3. Adding menu items...');
    
    // Pizza Palace menu
    if (restaurantIds[0]) {
      const pizzaItems = [
        { name: 'Margherita Pizza', description: 'Classic tomato and mozzarella', price: 12.99 },
        { name: 'Pepperoni Pizza', description: 'Loaded with pepperoni', price: 14.99 },
        { name: 'Veggie Supreme', description: 'Fresh vegetables', price: 13.99 },
        { name: 'Garlic Bread', description: 'Crispy garlic bread', price: 5.99 }
      ];
      
      for (const item of pizzaItems) {
        try {
          await makeRequest('POST', `/restaurants/${restaurantIds[0]}/menu`, item, adminToken);
          console.log(`   ✓ Added to Pizza Palace: ${item.name}`);
        } catch (err) {
          console.log(`   ⚠ Error adding ${item.name}:`, err.message);
        }
      }
    }

    // Burger House menu
    if (restaurantIds[1]) {
      const burgerItems = [
        { name: 'Classic Burger', description: 'Beef patty with lettuce and tomato', price: 9.99 },
        { name: 'Cheese Burger', description: 'Double cheese goodness', price: 10.99 },
        { name: 'Chicken Burger', description: 'Grilled chicken breast', price: 11.99 },
        { name: 'French Fries', description: 'Crispy golden fries', price: 3.99 }
      ];
      
      for (const item of burgerItems) {
        try {
          await makeRequest('POST', `/restaurants/${restaurantIds[1]}/menu`, item, adminToken);
          console.log(`   ✓ Added to Burger House: ${item.name}`);
        } catch (err) {
          console.log(`   ⚠ Error adding ${item.name}:`, err.message);
        }
      }
    }

    // Sushi Master menu
    if (restaurantIds[2]) {
      const sushiItems = [
        { name: 'California Roll', description: 'Crab, avocado, cucumber', price: 15.99 },
        { name: 'Salmon Nigiri', description: 'Fresh salmon on rice', price: 18.99 },
        { name: 'Tuna Sashimi', description: 'Raw tuna slices', price: 19.99 },
        { name: 'Miso Soup', description: 'Traditional Japanese soup', price: 4.99 }
      ];
      
      for (const item of sushiItems) {
        try {
          await makeRequest('POST', `/restaurants/${restaurantIds[2]}/menu`, item, adminToken);
          console.log(`   ✓ Added to Sushi Master: ${item.name}`);
        } catch (err) {
          console.log(`   ⚠ Error adding ${item.name}:`, err.message);
        }
      }
    }

    console.log('\n✅ Data seeding completed!');
    console.log('\n📝 Admin credentials:');
    console.log('   Email: admin@fooddelivery.com');
    console.log('   Password: admin123');
    console.log('\n🌐 You can now refresh your browser to see the restaurants!\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  }
}

seedData();
