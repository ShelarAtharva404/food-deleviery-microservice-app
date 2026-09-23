require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initSchema } = require('./db');
const restaurantsRouter = require('./routes/restaurants');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'restaurant-service' }));
app.use('/', restaurantsRouter);

const PORT = process.env.PORT || 4002;

async function start() {
  let retries = 10;
  while (retries > 0) {
    try {
      await initSchema();
      break;
    } catch (err) {
      console.error('DB not ready yet, retrying...', err.message);
      retries -= 1;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, () => console.log(`restaurant-service listening on ${PORT}`));
}

start();
