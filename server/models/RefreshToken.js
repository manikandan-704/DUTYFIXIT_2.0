const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    userRole: {
        type: String,
        required: true,
        enum: ['client', 'professional', 'admin'],
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // TTL index — auto-deletes expired docs
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
