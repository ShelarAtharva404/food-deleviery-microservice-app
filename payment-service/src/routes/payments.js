const express = require('express');
const { pool } = require('../db');
const { authRequired } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:4003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4006';

// POST /payments - Process payment for an order
router.post('/payments', authRequired, async (req, res) => {
  try {
    const { orderId, paymentMethod, cardDetails } = req.body;
    
    if (!orderId || !paymentMethod) {
      return res.status(400).json({ error: 'orderId and paymentMethod are required' });
    }

    // Fetch order details from order service
    let order;
    try {
      const orderResponse = await axios.get(`${ORDER_SERVICE_URL}/${orderId}`, {
        headers: { Authorization: req.headers.authorization }
      });
      order = orderResponse.data;
    } catch (err) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if payment already exists for this order
    const existing = await pool.query(
      'SELECT id FROM payments WHERE order_id = $1 AND payment_status = $2',
      [orderId, 'completed']
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Payment already completed for this order' });
    }

    // Simulate payment processing
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const paymentStatus = Math.random() > 0.1 ? 'completed' : 'failed'; // 90% success rate

    const result = await pool.query(
      `INSERT INTO payments (order_id, user_id, amount, payment_method, payment_status, transaction_id, payment_gateway, card_last4, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        orderId,
        req.user.sub,
        order.total_amount,
        paymentMethod,
        paymentStatus,
        transactionId,
        'mock_gateway',
        cardDetails?.last4 || null,
        JSON.stringify({ cardDetails })
      ]
    );

    const payment = result.rows[0];

    // Notify user
    if (paymentStatus === 'completed') {
      try {
        await axios.post(`${NOTIFICATION_SERVICE_URL}/notify`, {
          event: 'PAYMENT_SUCCESS',
          payload: { orderId, userId: req.user.sub, amount: payment.amount, transactionId }
        });
      } catch (err) {
        console.error('Failed to send notification:', err.message);
      }
    }

    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /payments/order/:orderId - Get payment for an order
router.get('/payments/order/:orderId', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE order_id = $1 AND user_id = $2',
      [req.params.orderId, req.user.sub]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /payments/mine - Get all user's payments
router.get('/payments/mine', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.sub]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /payments/:id/refund - Request refund
router.post('/payments/:id/refund', authRequired, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const payment = await pool.query(
      'SELECT * FROM payments WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.sub]
    );
    
    if (payment.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.rows[0].payment_status !== 'completed') {
      return res.status(400).json({ error: 'Can only refund completed payments' });
    }

    const result = await pool.query(
      `UPDATE payments 
       SET payment_status = 'refunded', refund_amount = amount, refund_reason = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [reason || 'Customer requested refund', req.params.id]
    );

    // Notify
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/notify`, {
        event: 'REFUND_PROCESSED',
        payload: { paymentId: req.params.id, userId: req.user.sub }
      });
    } catch (err) {
      console.error('Failed to send notification:', err.message);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payment Methods Management
// GET /payment-methods - Get user's saved payment methods
router.get('/payment-methods', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.sub]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /payment-methods - Add payment method
router.post('/payment-methods', authRequired, async (req, res) => {
  try {
    const { methodType, provider, last4, isDefault } = req.body;
    
    if (!methodType || !provider) {
      return res.status(400).json({ error: 'methodType and provider are required' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await pool.query(
        'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
        [req.user.sub]
      );
    }

    const result = await pool.query(
      `INSERT INTO payment_methods (user_id, method_type, provider, last4, is_default)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.sub, methodType, provider, last4 || null, isDefault || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
