const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');

router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.render('login', { error: 'Invalid email or password' });
        }
        
        if (!user.isActive) {
            return res.render('login', { error: 'Account inactive. Contact support.' });
        }
        
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.render('login', { error: 'Invalid email or password' });
        }
        
        // FIXED: Save last login timestamp
        user.lastLogin = new Date();
        await user.save();
        
        console.log(`✅ User ${user.email} logged in at ${user.lastLogin}`);
        
        // Set session
        req.session.userId = user._id;
        req.session.userEmail = user.email;
        req.session.magazineName = user.magazineName;
        
        res.redirect(`/magazine/${user._id}`);
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'Login failed. Try again.' });
    }
});

// Magic link login
router.get('/magic-login/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            magicLinkToken: req.params.token,
            magicLinkExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.render('login', { error: 'Invalid or expired magic link' });
        }
        
        // Clear magic link after use
        user.magicLinkToken = undefined;
        user.magicLinkExpires = undefined;
        // FIXED: Save last login timestamp for magic link too
        user.lastLogin = new Date();
        await user.save();
        
        console.log(`✅ User ${user.email} logged in via magic link at ${user.lastLogin}`);
        
        // Set session
        req.session.userId = user._id;
        req.session.userEmail = user.email;
        req.session.magazineName = user.magazineName;
        
        res.redirect(`/magazine/${user._id}`);
    } catch (error) {
        console.error('Magic link error:', error);
        res.render('login', { error: 'Login failed' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
