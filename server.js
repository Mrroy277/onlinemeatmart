const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');   // added

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));  // added

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'jam8910',
  database: 'meatmart_db'
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
