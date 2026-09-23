const express = require('express');
const { pool } = require('../db');
const { authRequired, staffOnly } = require('../middleware/auth');
const { getMenuItem, getRestaurant, notify } = require('../clients');

const router = express.Router();

// POST /orders  — place a new order
// body: { restaurantId, deliveryAddress, items: [{ menuItemId, quantity }] }
router.post('/', authRequired, async (req, res) => {
  const client = await pool.connect();
  try {
    const { restaurantId, deliveryAddress, deliveryInstructions, items } = req.body;
    if (!restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'restaurantId and a non-empty items array are required' });
    }

    // Validate restaurant exists
    await getRestaurant(restaurantId);

    // Resolve & price each item from restaurant-service (source of truth for price)
    const resolvedItems = [];
    let total = 0;
    for (const item of items) {
      const menuItem = await getMenuItem(item.menuItemId);
      if (!menuItem.available) {
        return res.status(400).json({ error: `Menu item ${item.menuItemId} is unavailable` });
      }
      const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const lineTotal = Number(menuItem.price) * quantity;
      total += lineTotal;
      resolvedItems.push({ menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity });
    }

    await client.query('BEGIN');
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, restaurant_id, total_amount, delivery_address, delivery_instructions)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.sub, restaurantId, total.toFixed(2), deliveryAddress || null, deliveryInstructions || null]
    );
    const order = orderResult.rows[0];

    for (const it of resolvedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, it.menuItemId, it.name, it.price, it.quantity]
      );
    }
    await client.query('COMMIT');

    notify('ORDER_PLACED', { orderId: order.id, userId: req.user.sub, total: order.total_amount });

    res.status(201).json({ ...order, items: resolvedItems });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.response) {
      // upstream service returned an error (e.g. 404 menu item)
      return res.status(err.response.status).json(err.response.data);
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /orders/mine — orders for the logged-in user
router.get('/mine', authRequired, async (req, res) => {
  const orders = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.sub]
  );
  
  // Fetch items for each order
  const ordersWithItems = await Promise.all(
    orders.rows.map(async (order) => {
      const itemsResult = await pool.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order.id]
      );
      return { ...order, items: itemsResult.rows };
    })
  );
  
  res.json(ordersWithItems);
});

// GET /orders/:id
router.get('/:id', authRequired, async (req, res) => {
  const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  const order = orderResult.rows[0];
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.user_id !== req.user.sub && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
  res.json({ ...order, items: itemsResult.rows });
});

// PATCH /orders/:id/status  — used by restaurant/delivery staff or internally
// body: { status }
router.patch('/:id/status', authRequired, staffOnly, async (req, res) => {
  const { status } = req.body;
  const allowed = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });
  }
  const result = await pool.query(
    'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Order not found' });

  notify('ORDER_STATUS_CHANGED', { orderId: result.rows[0].id, status });
  res.json(result.rows[0]);
});

module.exports = router;
