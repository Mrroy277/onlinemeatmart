const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');   // added

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));  // added

// Postgres connection using DATABASE_URL from Render
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

db.connect((err, client, release) => {
  if (err) {
    console.error('DB connection failed:', err);
    process.exit(1);                  // stop app if DB not reachable
  }
  console.log('Connected to Postgres (Render)');
  release();
});

// REGISTER route
app.post('/register', (req, res) => {
  const { name, email, password, address } = req.body;
  if (!name || !email || !password || !address) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  db.query(
    'INSERT INTO users (name, email, address, password) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, email, address, password],
    (err, result) => {
      if (err) {
        // 23505 = unique_violation in Postgres (use this if email column is UNIQUE)
        if (err.code === '23505') {
          return res.status(400).json({ error: 'Email already registered' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, userId: result.rows[0].id });
    }
  );
});

// LOGIN route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  db.query(
    'SELECT id, name FROM users WHERE email = $1 AND password = $2',
    [email, password],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      res.json({
        success: true,
        userId: result.rows[0].id,
        name: result.rows[0].name
      });
    }
  );
});

// ORDERS route
app.post('/orders', (req, res) => {
  const { product, quantity, total, phone } = req.body;
  db.query(
    'INSERT INTO orders (product_name, quantity, total_price, phone) VALUES ($1, $2, $3, $4)',
    [product, quantity, total, phone],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
