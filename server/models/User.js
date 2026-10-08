const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
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
        enum: ['client', 'professional', 'admin'],
        default: 'client'
    },
    mobile: {
        type: String
    },
    dob: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    address: {
        flatNumber: String,
        city: String,
        pincode: String
    },
    // Professional specific fields
    profession: {
        type: String
    },
    experience: {
        type: String
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Missing fields from Worker schema
    profilePic: {
        type: String
    },
    rating: {
        type: Number,
        default: 5.0
    },
    jobsCompleted: {
        type: Number,
        default: 0
    },
    workerId: {
        type: String,
        unique: true,
        sparse: true
    }
});

// Hash password before saving (only if modified)
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare submitted password against stored hash
UserSchema.methods.comparePassword = async function (candidatePassword) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
