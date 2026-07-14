const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true,
        select: false
    },
    magazineName: { 
        type: String, 
        default: '',
        trim: true
    },
    profilePicture: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    role: { 
        type: String, 
        enum: ['user', 'admin', 'moderator'], 
        default: 'user' 
    },
    isActive: { 
        type: Boolean, 
        default: true,
        index: true
    },
    isVerified: { type: Boolean, default: false },
    magicLinkToken: { type: String, select: false },
    magicLinkExpires: Date,
    lastLogin: { type: Date, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    preferences: {
        emailNotifications: { type: Boolean, default: true },
        theme: { type: String, enum: ['light', 'dark'], default: 'light' }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ magicLinkToken: 1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidate) {
    return await bcrypt.compare(candidate, this.password);
};

// FIXED: Generate magic link with SITE_URL
userSchema.methods.generateMagicLink = function() {
    const crypto = require('crypto');
    this.magicLinkToken = crypto.randomBytes(32).toString('hex');
    this.magicLinkExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;
    
    // FIXED: Use SITE_URL from environment with fallback
    const siteUrl = process.env.SITE_URL || 'http://localhost:8000';
    return `${siteUrl}/magic-login/${this.magicLinkToken}`;
};

userSchema.methods.generateResetToken = function() {
    this.resetPasswordToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordExpires = Date.now() + 3600000;
    return this.resetPasswordToken;
};

userSchema.methods.incrementLoginAttempts = function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    return this.updateOne({
        $inc: { loginAttempts: 1 },
        $set: { lockUntil: Date.now() + 3600000 }
    });
};

// Static methods
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByMagicToken = function(token) {
    return this.findOne({
        magicLinkToken: token,
        magicLinkExpires: { $gt: Date.now() },
        isActive: true
    });
};

// Virtuals
userSchema.virtual('fullName').get(function() {
    return this.magazineName || this.email;
});

module.exports = mongoose.model('User', userSchema);