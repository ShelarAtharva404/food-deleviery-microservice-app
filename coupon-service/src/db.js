const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function waitForDb() {
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.query('SELECT NOW()');
      console.log('Database connected');
      return;
    } catch (err) {
      console.log(`DB not ready yet, retrying... ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Could not connect to database');
}

async function initSchema() {
  const fs = require('fs');
  const path = require('path');
  const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', 'init.sql'), 'utf8');
  await pool.query(sql);
}

module.exports = { pool, waitForDb, initSchema };
