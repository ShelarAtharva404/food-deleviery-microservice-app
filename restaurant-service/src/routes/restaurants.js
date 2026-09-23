const express = require('express');
const { pool } = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /restaurants  (public - browse)
router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM restaurants WHERE is_active = true ORDER BY id'
  );
  res.json(result.rows);
});

// GET /menu-items/:id  (internal — used by order-service to validate & price items)
// NOTE: registered before /:id so it isn't shadowed
router.get('/menu-items/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Menu item not found' });
  res.json(result.rows[0]);
});

// GET /restaurants/:id
router.get('/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM restaurants WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Restaurant not found' });
  res.json(result.rows[0]);
});

// GET /restaurants/:id/menu
router.get('/:id/menu', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM menu_items WHERE restaurant_id = $1 AND available = true ORDER BY id',
    [req.params.id]
  );
  res.json(result.rows);
});

// POST /restaurants  (admin)
router.post('/', authRequired, adminOnly, async (req, res) => {
  const { name, address, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = await pool.query(
    'INSERT INTO restaurants (name, address, phone) VALUES ($1, $2, $3) RETURNING *',
    [name, address || null, phone || null]
  );
  res.status(201).json(result.rows[0]);
});

// POST /restaurants/:id/menu  (admin)
router.post('/:id/menu', authRequired, adminOnly, async (req, res) => {
  const { name, description, price } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'name and price are required' });
  }
  const result = await pool.query(
    `INSERT INTO menu_items (restaurant_id, name, description, price)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.params.id, name, description || null, price]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
