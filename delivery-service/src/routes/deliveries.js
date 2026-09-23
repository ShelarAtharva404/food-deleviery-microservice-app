const express = require('express');
const axios = require('axios');
const { pool } = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:4003';
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4005';

async function notify(event, payload) {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/notify`, { event, payload }, { timeout: 3000 });
  } catch (err) {
    console.error(`notification failed for event=${event}:`, err.message);
  }
}

// POST /deliveries  (admin/dispatch) — create a delivery record for an order
router.post('/', authRequired, adminOnly, async (req, res) => {
  const { orderId, driverName } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId is required' });
  const result = await pool.query(
    `INSERT INTO deliveries (order_id, driver_name, status, assigned_at)
     VALUES ($1, $2, 'ASSIGNED', now())
     ON CONFLICT (order_id) DO UPDATE SET driver_name = EXCLUDED.driver_name, status = 'ASSIGNED', assigned_at = now()
     RETURNING *`,
    [orderId, driverName || null]
  );
  notify('DELIVERY_ASSIGNED', { orderId, driverName });
  res.status(201).json(result.rows[0]);
});

// GET /deliveries/order/:orderId
router.get('/order/:orderId', authRequired, async (req, res) => {
  try {
    await axios.get(`${ORDER_SERVICE_URL}/${req.params.orderId}`, {
      headers: { Authorization: req.headers.authorization },
      timeout: 3000,
    });
  } catch (err) {
    return res.status(err.response?.status || 502).json({ error: 'Order not found or inaccessible' });
  }
  const result = await pool.query('SELECT * FROM deliveries WHERE order_id = $1', [req.params.orderId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Delivery not found' });
  res.json(result.rows[0]);
});

// PATCH /deliveries/:id/status   body: { status }
router.patch('/:id/status', authRequired, adminOnly, async (req, res) => {
  const { status } = req.body;
  const allowed = ['UNASSIGNED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });
  }
  const deliveredAt = status === 'DELIVERED' ? 'now()' : 'delivered_at';
  const result = await pool.query(
    `UPDATE deliveries SET status = $1, delivered_at = ${deliveredAt} WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Delivery not found' });

  // keep order-service in sync
  const orderStatusMap = {
    ASSIGNED: 'CONFIRMED',
    PICKED_UP: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
  };
  if (orderStatusMap[status]) {
    try {
      await axios.patch(
        `${ORDER_SERVICE_URL}/${result.rows[0].order_id}/status`,
        { status: orderStatusMap[status] },
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (err) {
      console.error('failed to sync order status:', err.message);
    }
  }

  notify('DELIVERY_STATUS_CHANGED', { orderId: result.rows[0].order_id, status });
  res.json(result.rows[0]);
});

module.exports = router;
