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

// FIXED: Session configuration with proper cookie settings
app.use(session({
    name: 'magazine_session',  // Custom session cookie name
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,           // Set to true if using HTTPS
        httpOnly: true,          // Prevents client-side JavaScript from accessing the cookie
        maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
        sameSite: 'lax',         // Protects against CSRF
        path: '/'                // Cookie available on all paths
    }
}));

// Make session available to all templates
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.userId = req.session.userId;
    res.locals.isAdmin = req.session.isAdmin;
    next();
});

// Pug setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Database
mongoose.connect(process.env.MONGODB_URI)
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Admin login: http://localhost:${PORT}/admin/login`);
    console.log(`🔐 Admin: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
});
