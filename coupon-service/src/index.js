require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { initSchema, pool } = require('./db');
const { authRequired } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:4003';

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'coupon-service' }));

// GET /coupons - Get all active coupons
app.get('/coupons', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_until
       FROM coupons 
       WHERE is_active = true AND (valid_until IS NULL OR valid_until > NOW())
       ORDER BY discount_value DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /coupons/validate - Validate a coupon code
app.post('/coupons/validate', authRequired, async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    
    if (!code || !orderAmount) {
      return res.status(400).json({ error: 'code and orderAmount are required' });
    }

    const coupon = await pool.query(
      `SELECT * FROM coupons WHERE code = $1 AND is_active = true`,
      [code.toUpperCase()]
    );

    if (coupon.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid coupon code', valid: false });
    }

    const c = coupon.rows[0];

    // Check validity period
    if (c.valid_until && new Date(c.valid_until) < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired', valid: false });
    }

    // Check usage limit
    if (c.usage_limit && c.used_count >= c.usage_limit) {
      return res.status(400).json({ error: 'Coupon usage limit reached', valid: false });
    }

    // Check user limit
    const userUsage = await pool.query(
      'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2',
      [c.id, req.user.sub]
    );

    if (userUsage.rows[0].count >= c.user_limit) {
      return res.status(400).json({ error: 'You have already used this coupon', valid: false });
    }

    // Check minimum order amount
    if (c.min_order_amount && parseFloat(orderAmount) < parseFloat(c.min_order_amount)) {
      return res.status(400).json({ 
        error: `Minimum order amount is $${c.min_order_amount}`, 
        valid: false 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (c.discount_type === 'percentage') {
      discountAmount = (parseFloat(orderAmount) * parseFloat(c.discount_value)) / 100;
      if (c.max_discount_amount) {
        discountAmount = Math.min(discountAmount, parseFloat(c.max_discount_amount));
      }
    } else {
      discountAmount = parseFloat(c.discount_value);
    }

    discountAmount = Math.min(discountAmount, parseFloat(orderAmount));

    res.json({
      valid: true,
      coupon: {
        id: c.id,
        code: c.code,
        description: c.description
      },
      discount: {
        type: c.discount_type,
        value: c.discount_value,
        appliedAmount: discountAmount.toFixed(2),
        finalAmount: (parseFloat(orderAmount) - discountAmount).toFixed(2)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /coupons/apply - Apply coupon to an order
app.post('/coupons/apply', authRequired, async (req, res) => {
  const client = await pool.connect();
  try {
    const { couponId, orderId, discountApplied } = req.body;
    
    if (!couponId || !orderId || !discountApplied) {
      return res.status(400).json({ error: 'couponId, orderId, and discountApplied are required' });
    }

    const orderResponse = await axios.get(`${ORDER_SERVICE_URL}/${orderId}`, {
      headers: { Authorization: req.headers.authorization },
      timeout: 3000,
    });
    const orderAmount = Number(orderResponse.data.total_amount);
    if (!Number.isFinite(orderAmount)) return res.status(400).json({ error: 'Invalid order amount' });

    await client.query('BEGIN');
    const couponResult = await client.query(
      'SELECT * FROM coupons WHERE id = $1 FOR UPDATE',
      [couponId]
    );
    const coupon = couponResult.rows[0];
    if (!coupon || !coupon.is_active || (coupon.valid_until && new Date(coupon.valid_until) <= new Date())) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Coupon is not valid' });
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }
    const usage = await client.query(
      'SELECT COUNT(*)::int AS count FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2',
      [couponId, req.user.sub]
    );
    if (usage.rows[0].count >= coupon.user_limit) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You have already used this coupon' });
    }
    if (coupon.min_order_amount && orderAmount < Number(coupon.min_order_amount)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Minimum order amount is $${coupon.min_order_amount}` });
    }
    let expectedDiscount = coupon.discount_type === 'percentage'
      ? orderAmount * Number(coupon.discount_value) / 100
      : Number(coupon.discount_value);
    if (coupon.max_discount_amount) expectedDiscount = Math.min(expectedDiscount, Number(coupon.max_discount_amount));
    expectedDiscount = Math.min(expectedDiscount, orderAmount);
    if (Math.abs(Number(discountApplied) - expectedDiscount) > 0.01) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Discount does not match the coupon and order' });
    }

    await client.query(
      'INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_applied) VALUES ($1, $2, $3, $4)',
      [couponId, req.user.sub, orderId, discountApplied]
    );

    // Increment used count
    await client.query(
      'UPDATE coupons SET used_count = used_count + 1 WHERE id = $1',
      [couponId]
    );
    await client.query('COMMIT');

    res.json({ success: true, message: 'Coupon applied successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.response) return res.status(err.response.status).json({ error: 'Order not found or inaccessible' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /coupons/my-usage - Get user's coupon usage history
app.get('/coupons/my-usage', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cu.*, c.code, c.description
       FROM coupon_usage cu
       JOIN coupons c ON cu.coupon_id = c.id
       WHERE cu.user_id = $1
       ORDER BY cu.created_at DESC`,
      [req.user.sub]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 4009;

async function start() {
  for (let retries = 10; retries > 0; retries -= 1) {
    try {
      await initSchema();
      app.listen(PORT, () => console.log(`coupon-service listening on ${PORT}`));
      return;
    } catch (err) {
      console.error('DB not ready yet, retrying...', err.message);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  process.exit(1);
}

start();
