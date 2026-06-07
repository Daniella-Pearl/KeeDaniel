const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    thumbnailImage: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Collection', collectionSchema);
