const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({ secret: process.env.SESSION_SECRET || 'secret', resave: false, saveUninitialized: true }));

// Simple CORS middleware - allow requests from frontend/origin configured in env or allow all
app.use((req, res, next) => {
  const origin = process.env.CORS_ORIGIN || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Serve admin static pages
app.use('/admin', express.static(path.join(__dirname, '..', 'public')));

// Serve frontend (project root) so frontend and backend share same domain.
const projectRoot = path.join(__dirname, '..', '..');
app.use(express.static(projectRoot));
// Fallback to index.html for SPA or direct file requests
app.get('/', (req, res) => res.sendFile(path.join(projectRoot, 'index.html')));


// API routes
const submitRoutes = require('./routes/submit');
const adminRoutes = require('./routes/admin');

app.use('/api/submit', submitRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('payit backend running');
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
