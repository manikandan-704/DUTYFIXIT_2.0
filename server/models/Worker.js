const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const WorkerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'professional'
    },
    mobile: {
        type: String
    },
    profession: {
        type: String
    },
    experience: {
        type: String
    },
    profilePic: {
        type: String // Base64 or URL
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'none'],
        default: 'none'
    },
    rating: {
        type: Number,
        default: 5.0
    },
    jobsCompleted: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    workerId: {
        type: String,
        unique: true
    }
});

// Hash password before saving (only if modified)
WorkerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare submitted password against stored hash
WorkerSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Worker', WorkerSchema);
