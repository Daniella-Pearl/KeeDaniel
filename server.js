// server.js - Complete working version
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
  name: 'magazine_session',
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/'
  }
}));

// Make session and site URL available to all templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.userId = req.session.userId;
  res.locals.isAdmin = req.session.isAdmin;
  res.locals.siteUrl = process.env.SITE_URL || 'http://localhost:8000';
  next();
});

// Pug setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/magazine')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
app.use('/', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/magazine', require('./routes/magazine'));
app.use('/api/upload', require('./routes/upload'));

// Home page
app.get('/', (req, res) => {
  if (req.session.isAdmin) {
    res.redirect('/admin/dashboard');
  } else if (req.session.userId) {
    res.redirect(`/magazine/${req.session.userId}`);
  } else {
    res.redirect('/login');
  }
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Admin login: http://localhost:${PORT}/admin/login`);
  console.log(`🔗 Site URL: ${process.env.SITE_URL || `http://localhost:${PORT}`}`);
});