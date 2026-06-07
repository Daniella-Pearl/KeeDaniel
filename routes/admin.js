const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Collection = require('../models/Collection');
const Photo = require('../models/Photo');
const crypto = require('crypto');

function requireAdmin(req, res, next) {
    if (req.session.isAdmin) return next();
    res.redirect('/admin/login');
}

router.get('/login', (req, res) => {
    res.render('admin/login', { error: null });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.redirect('/admin/dashboard');
    } else {
        res.render('admin/login', { error: 'Invalid credentials' });
    }
});

router.get('/dashboard', requireAdmin, async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    const collections = await Collection.countDocuments();
    const photos = await Photo.countDocuments();
    
    res.render('admin/dashboard', {
        stats: { totalUsers: users.length, totalCollections: collections, totalPhotos: photos },
        users: users
    });
});

router.get('/users', requireAdmin, async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.render('admin/users', { users });
});

router.get('/users/create', requireAdmin, (req, res) => {
    res.render('admin/create-user', { error: null, success: null, user: null, magicLink: null });
});

router.post('/users/create', requireAdmin, async (req, res) => {
    try {
        const { email, password, magazineName } = req.body;
        
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.render('admin/create-user', { error: 'Email already exists', success: null, user: null, magicLink: null });
        }
        
        const user = new User({
            email: email.toLowerCase(),
            password: password,
            magazineName: magazineName || `${email.split('@')[0]}'s Magazine`,
            isActive: true
        });
        
        await user.save();
        
        user.magicLinkToken = crypto.randomBytes(32).toString('hex');
        user.magicLinkExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;
        await user.save();
        
        const magicLink = `http://localhost:3000/magic-login/${user.magicLinkToken}`;
        
        res.render('admin/create-user', {
            error: null,
            success: true,
            user: user,
            magicLink: magicLink
        });
    } catch (error) {
        res.render('admin/create-user', { error: 'Failed to create user', success: null, user: null, magicLink: null });
    }
});

// FIXED: View user's collections WITH photo count
router.get('/users/:userId/magazine', requireAdmin, async (req, res) => {
    const user = await User.findById(req.params.userId);
    const collections = await Collection.find({ userId: user._id }).sort({ order: 1, createdAt: -1 });
    
    // Calculate photo count for each collection
    const collectionsWithCount = await Promise.all(collections.map(async (collection) => {
        const photoCount = await Photo.countDocuments({ collectionId: collection._id });
        return {
            ...collection.toObject(),
            photoCount: photoCount
        };
    }));
    
    res.render('admin/user-magazine', { user, collections: collectionsWithCount });
});

// Create collection
router.post('/users/:userId/collections', requireAdmin, async (req, res) => {
    const { name, description, thumbnailImage } = req.body;
    
    const collection = new Collection({
        userId: req.params.userId,
        name: name,
        description: description || '',
        thumbnailImage: thumbnailImage || ''
    });
    
    await collection.save();
    res.redirect(`/admin/users/${req.params.userId}/magazine`);
});

// View collection photos
router.get('/users/:userId/collections/:collectionId', requireAdmin, async (req, res) => {
    const user = await User.findById(req.params.userId);
    const collection = await Collection.findById(req.params.collectionId);
    const photos = await Photo.find({ collectionId: collection._id }).sort({ order: 1, createdAt: -1 });
    
    res.render('admin/collection-photos', { user, collection, photos });
});

// Upload photo to collection
router.post('/users/:userId/collections/:collectionId/photos', requireAdmin, async (req, res) => {
    const { imageUrl, caption } = req.body;
    
    const photo = new Photo({
        collectionId: req.params.collectionId,
        userId: req.params.userId,
        imageUrl: imageUrl,
        caption: caption || ''
    });
    
    await photo.save();
    res.redirect(`/admin/users/${req.params.userId}/collections/${req.params.collectionId}`);
});

// Update photo caption
router.put('/users/:userId/collections/:collectionId/photos/:photoId', requireAdmin, async (req, res) => {
    try {
        const { caption } = req.body;
        await Photo.findByIdAndUpdate(req.params.photoId, { caption: caption || '' });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating caption:', error);
        res.status(500).json({ error: 'Failed to update caption' });
    }
});

// Delete photo
router.delete('/users/:userId/collections/:collectionId/photos/:photoId/delete', requireAdmin, async (req, res) => {
    await Photo.findByIdAndDelete(req.params.photoId);
    res.redirect(`/admin/users/${req.params.userId}/collections/${req.params.collectionId}`);
});

// Update collection
router.post('/users/:userId/collections/:collectionId/update', requireAdmin, async (req, res) => {
    await Collection.findByIdAndUpdate(req.params.collectionId, {
        name: req.body.name,
        description: req.body.description,
        thumbnailImage: req.body.thumbnailImage
    });
    res.redirect(`/admin/users/${req.params.userId}/magazine`);
});

// Delete collection
router.delete('/users/:userId/collections/:collectionId/delete', requireAdmin, async (req, res) => {
    await Photo.deleteMany({ collectionId: req.params.collectionId });
    await Collection.findByIdAndDelete(req.params.collectionId);
    res.redirect(`/admin/users/${req.params.userId}/magazine`);
});

router.post('/users/:userId/update', requireAdmin, async (req, res) => {
    const isActive = req.body.isActive === 'on';
    await User.findByIdAndUpdate(req.params.userId, {
        magazineName: req.body.magazineName,
        isActive: isActive
    });
    res.redirect(`/admin/users/${req.params.userId}/magazine`);
});

router.post('/users/:userId/magic-link', requireAdmin, async (req, res) => {
    const user = await User.findById(req.params.userId);
    user.magicLinkToken = crypto.randomBytes(32).toString('hex');
    user.magicLinkExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await user.save();
    
    const magicLink = `http://localhost:3000/magic-login/${user.magicLinkToken}`;
    res.json({ magicLink });
});

router.delete('/users/:userId/delete', requireAdmin, async (req, res) => {
    const collections = await Collection.find({ userId: req.params.userId });
    for (const collection of collections) {
        await Photo.deleteMany({ collectionId: collection._id });
    }
    await Collection.deleteMany({ userId: req.params.userId });
    await User.findByIdAndDelete(req.params.userId);
    res.redirect('/admin/users');
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

module.exports = router;
