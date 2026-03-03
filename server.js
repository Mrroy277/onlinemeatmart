const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');   // added

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));  // added

// MySQL connection using environment variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,          // e.g. sql202.infinityfree.com
  user: process.env.DB_USER,          // e.g. if0_41291596
  password: process.env.DB_PASS,      // your InfinityFree MySQL password
  database: process.env.DB_NAME,      // e.g. if0_41291596_meatmart
  port: process.env.DB_PORT || 3306
});

db.connect((err) => {
  if (err) {
    console.error('DB connection failed:', err);
    process.exit(1);                  // stop app if DB not reachable
  }
  console.log('Connected to MySQL (InfinityFree)');
});

// REGISTER route
app.post('/register', (req, res) => {
  const { name, email, password, address } = req.body;
  if (!name || !email || !password || !address) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  db.query(
    'INSERT INTO users (name, email, address, password) VALUES (?, ?, ?, ?)',
    [name, email, address, password],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Email already registered' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, userId: result.insertId });
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
    'SELECT id, name FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      res.json({ success: true, userId: rows[0].id, name: rows[0].name });
    }
  );
});

// ORDERS route
app.post('/orders', (req, res) => {
  const { product, quantity, total, phone } = req.body;
  db.query(
    'INSERT INTO orders (product_name, quantity, total_price, phone) VALUES (?, ?, ?, ?)',
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
