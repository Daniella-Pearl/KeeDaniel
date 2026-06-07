const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
    collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    caption: { type: String, default: '' },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Photo', photoSchema);
