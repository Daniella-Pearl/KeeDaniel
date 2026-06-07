const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    caption: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
