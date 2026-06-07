const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Collection = require('../models/Collection');
const Photo = require('../models/Photo');

function requireAuth(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login');
}

// View all collections (main magazine page)
router.get('/:userId', requireAuth, async (req, res) => {
    if (req.session.userId !== req.params.userId) {
        return res.status(403).send('Access denied');
    }
    
    const user = await User.findById(req.params.userId);
    
    // Check if account is inactive
    if (!user || !user.isActive) {
        return res.render('inactive-account', { 
            userName: user ? user.magazineName : 'This account'
        });
    }
    
    const collections = await Collection.find({ userId: user._id }).sort({ order: 1, createdAt: -1 });
    
    // Get photo count for each collection
    const collectionsWithCount = await Promise.all(collections.map(async (collection) => {
        const photoCount = await Photo.countDocuments({ collectionId: collection._id });
        return {
            ...collection.toObject(),
            photoCount: photoCount
        };
    }));
    
    res.render('magazine/collections', {
        magazineName: user.magazineName,
        collections: collectionsWithCount,
        userId: user._id
    });
});

// View photos in a specific collection
router.get('/:userId/collection/:collectionId', requireAuth, async (req, res) => {
    if (req.session.userId !== req.params.userId) {
        return res.status(403).send('Access denied');
    }
    
    const user = await User.findById(req.params.userId);
    
    // Check if account is inactive
    if (!user || !user.isActive) {
        return res.render('inactive-account', { 
            userName: user ? user.magazineName : 'This account'
        });
    }
    
    const collection = await Collection.findById(req.params.collectionId);
    if (!collection || collection.userId.toString() !== user._id.toString()) {
        return res.status(404).send('Collection not found');
    }
    
    const photos = await Photo.find({ collectionId: collection._id }).sort({ order: 1, createdAt: -1 });
    
    res.render('magazine/photos', {
        magazineName: user.magazineName,
        collection: collection,
        photos: photos,
        userId: user._id
    });
});

module.exports = router;
