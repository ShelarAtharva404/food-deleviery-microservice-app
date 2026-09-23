const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// In-memory log of notifications — swap for email/SMS/push provider or a
// queue (RabbitMQ/SQS) once you wire up real infra.
const notifications = [];

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notification-service' }));

app.post('/notify', (req, res) => {
  const { event, payload } = req.body || {};
  if (!event) return res.status(400).json({ error: 'event is required' });
  const record = { event, payload, receivedAt: new Date().toISOString() };
  notifications.unshift(record);
  if (notifications.length > 500) notifications.pop();
  console.log(`[notification] ${event}`, JSON.stringify(payload));
  res.status(202).json({ accepted: true });
});

// GET /notifications — inspect what's been sent (useful for demoing/debugging)
app.get('/notifications', (req, res) => {
  res.json(notifications.slice(0, 50));
});

const PORT = process.env.PORT || 4005;
app.listen(PORT, () => console.log(`notification-service listening on ${PORT}`));
