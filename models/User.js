const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    magazineName: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    magicLinkToken: { type: String },
    magicLinkExpires: Date,
    lastLogin: { type: Date, default: null },  // FIXED: Added default null
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function(candidate) {
    return await bcrypt.compare(candidate, this.password);
};

userSchema.methods.generateMagicLink = function() {
    const crypto = require('crypto');
    this.magicLinkToken = crypto.randomBytes(32).toString('hex');
    this.magicLinkExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;
    return `${process.env.SITE_URL}/magic-login/${this.magicLinkToken}`;
};

module.exports = mongoose.model('User', userSchema);
