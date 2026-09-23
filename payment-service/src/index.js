require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initSchema } = require('./db');
const paymentsRouter = require('./routes/payments');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'payment-service' }));

app.use('/', paymentsRouter);

const PORT = process.env.PORT || 4007;

async function start() {
  for (let retries = 10; retries > 0; retries -= 1) {
    try {
      await initSchema();
      app.listen(PORT, () => console.log(`payment-service listening on ${PORT}`));
      return;
    } catch (err) {
      console.error('DB not ready yet, retrying...', err.message);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  process.exit(1);
}

start();
