const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

// ── Token Helpers ──────────────────────────────────────────────────────────

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
};

const setRefreshCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    });
};

// Helper: compare password — supports both hashed (bcrypt) and legacy plain-text
async function verifyPassword(user, candidatePassword) {
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        return user.comparePassword(candidatePassword);
    }
    if (user.password === candidatePassword) {
        // Upgrade to bcrypt hash on successful plain-text login by triggering pre-save hook
        user.password = candidatePassword;
        await user.save();
        return true;
    }
    return false;
}

// ── REGISTER ───────────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
    let { name, email, password, role, mobile, profession, experience } = req.body;
    
    // Normalize role
    if (role === 'worker') role = 'professional';

    try {
        let exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ success: false, msg: 'User already exists' });

        let newId = undefined;
        if (role === 'professional') {
            const lastWorker = await User.findOne({ workerId: { $exists: true } }).sort({ workerId: -1 });
            newId = 'DF001';
            if (lastWorker && lastWorker.workerId) {
                const lastIdNum = parseInt(lastWorker.workerId.replace('DF', ''), 10);
                if (!isNaN(lastIdNum)) {
                    newId = `DF${String(lastIdNum + 1).padStart(3, '0')}`;
                }
            }
        }

        const user = new User({
            name, email, password, role, mobile,
            ...(role === 'professional' ? { profession, experience, workerId: newId } : {})
        });

        await user.save(); // password hashed by pre-save hook

        res.status(201).json({
            success: true,
            msg: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ── LOGIN ──────────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
    let { email, password, role } = req.body;
    
    // Normalize role
    if (role === 'worker') role = 'professional';

    try {
        // Hardcoded Admin Check (Legacy fallback)
        if ((!role || role === 'admin') && email.trim() === 'admin123' && password.trim() === 'host123') {
            const fakeAdmin = { _id: 'static_admin_id', email: 'admin123', role: 'admin', name: 'Admin' };
            const accessToken = generateAccessToken(fakeAdmin);

            return res.json({
                success: true,
                msg: 'Login successful',
                accessToken,
                user: {
                    id: fakeAdmin._id,
                    name: fakeAdmin.name,
                    email: fakeAdmin.email,
                    role: 'admin',
                    mobile: '0000000000'
                }
            });
        }

        let query = { email };
        if (role) {
            query.role = role;
        }

        const user = await User.findOne(query);

        if (!user) {
            return res.status(400).json({ success: false, msg: 'Invalid Credentials' });
        }

        const isMatch = await verifyPassword(user, password);
        if (!isMatch) {
            return res.status(400).json({ success: false, msg: 'Invalid Credentials' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store refresh token in DB
        await RefreshToken.create({
            token: refreshToken,
            userId: user._id,
            userRole: user.role,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        setRefreshCookie(res, refreshToken);

        res.json({
            success: true,
            msg: 'Login successful',
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profession: user.profession,
                experience: user.experience,
                mobile: user.mobile,
                workerId: user.workerId
            }
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ── REFRESH ────────────────────────────────────────────────────────────────

router.post('/refresh', async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            return res.status(401).json({ success: false, message: 'No refresh token provided' });
        }

        const storedToken = await RefreshToken.findOne({ token });
        if (!storedToken) {
            return res.status(401).json({ success: false, message: 'Refresh token not recognized — please login again' });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        const accessToken = generateAccessToken({
            _id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        });

        res.json({ success: true, accessToken });

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            await RefreshToken.deleteOne({ token: req.cookies?.refreshToken });
            return res.status(401).json({ success: false, message: 'Refresh token expired — please login again' });
        }
        return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
});

// ── LOGOUT ─────────────────────────────────────────────────────────────────

router.post('/logout', async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;

        if (token) {
            await RefreshToken.deleteOne({ token });
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });

        res.json({ success: true, msg: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
