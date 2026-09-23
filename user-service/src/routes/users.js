const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { authRequired, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password are required' });
    }
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, phone, role)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'customer'))
       RETURNING id, name, email, role, address, phone, created_at`,
      [name, email, hash, address || null, phone || null, 'customer']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /me
router.get('/me', authRequired, async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, role, address, phone, created_at FROM users WHERE id = $1',
    [req.user.sub]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

// GET /:id  (internal use — e.g. order-service resolving a user)
router.get('/:id', authRequired, async (req, res) => {
  if (Number(req.params.id) !== req.user.sub && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const result = await pool.query(
    'SELECT id, name, email, role, address, phone FROM users WHERE id = $1',
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

module.exports = router;
