require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initSchema, pool } = require('./db');
const { authRequired } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'review-service' }));

// POST /reviews/restaurant - Add restaurant review
app.post('/reviews/restaurant', authRequired, async (req, res) => {
  try {
    const { restaurantId, orderId, rating, reviewText, foodRating, serviceRating, deliveryRating } = req.body;
    
    console.log('Review submission:', { restaurantId, orderId, rating, userId: req.user.sub });
    
    if (!restaurantId || !rating) {
      return res.status(400).json({ error: 'restaurantId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const result = await pool.query(
      `INSERT INTO restaurant_reviews (restaurant_id, user_id, order_id, rating, review_text, food_rating, service_rating, delivery_rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [restaurantId, req.user.sub, orderId || null, rating, reviewText || null, foodRating || null, serviceRating || null, deliveryRating || null]
    );

    console.log('Review created successfully:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// GET /reviews/restaurant/:id - Get reviews for a restaurant
app.get('/reviews/restaurant/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM restaurant_reviews WHERE restaurant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reviews/restaurant/:id/stats - Get rating statistics
app.get('/reviews/restaurant/:id/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating), 2) as average_rating,
        ROUND(AVG(food_rating), 2) as avg_food_rating,
        ROUND(AVG(service_rating), 2) as avg_service_rating,
        ROUND(AVG(delivery_rating), 2) as avg_delivery_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM restaurant_reviews WHERE restaurant_id = $1`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /reviews/:id/helpful - Mark review as helpful
app.post('/reviews/:id/helpful', authRequired, async (req, res) => {
  try {
    const vote = await pool.query(
      'INSERT INTO review_helpful (review_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, req.user.sub]
    );

    if (vote.rowCount > 0) {
      await pool.query(
        'UPDATE restaurant_reviews SET helpful_count = helpful_count + 1 WHERE id = $1',
        [req.params.id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 4008;

async function start() {
  for (let retries = 10; retries > 0; retries -= 1) {
    try {
      await initSchema();
      app.listen(PORT, () => console.log(`review-service listening on ${PORT}`));
      return;
    } catch (err) {
      console.error('DB not ready yet, retrying...', err.message);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  process.exit(1);
}

start();
