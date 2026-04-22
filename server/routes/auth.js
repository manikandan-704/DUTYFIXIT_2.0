const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Client = require('../models/Client');
const Worker = require('../models/Worker');
const Admin = require('../models/Admin');
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
    // If the stored password looks like a bcrypt hash ($2a$ or $2b$), use bcrypt
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        return user.comparePassword(candidatePassword);
    }
    // Legacy plain-text comparison (for old users before bcrypt migration)
    if (user.password === candidatePassword) {
        // Upgrade to bcrypt hash on successful plain-text login
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(candidatePassword, salt);
        await user.save();
        return true;
    }
    return false;
}

// ── REGISTER ───────────────────────────────────────────────────────────────

// @route   POST /api/auth/register
// @desc    Register a new user (Client, Worker, or Admin)
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password, role, mobile, profession, experience } = req.body;

    try {
        let user;

        if (role === 'client') {
            let exists = await Client.findOne({ email });
            if (exists) return res.status(400).json({ success: false, msg: 'User already exists' });

            user = new Client({ name, email, password, role, mobile });
            // password hashed by pre-save hook

        } else if (role === 'professional') {
            let exists = await Worker.findOne({ email });
            if (exists) return res.status(400).json({ success: false, msg: 'User already exists' });

            let clientEx = await Client.findOne({ email });
            let adminEx = await Admin.findOne({ email });
            if (clientEx || adminEx) {
                return res.status(400).json({ success: false, msg: 'Email is already registered as Client or Admin' });
            }

            // Generate Worker ID
            const lastWorker = await Worker.findOne({ workerId: { $exists: true } }).sort({ workerId: -1 });
            let newId = 'DF001';
            if (lastWorker && lastWorker.workerId) {
                const lastIdNum = parseInt(lastWorker.workerId.replace('DF', ''), 10);
                if (!isNaN(lastIdNum)) {
                    newId = `DF${String(lastIdNum + 1).padStart(3, '0')}`;
                }
            }

            user = new Worker({
                name, email, password, role, mobile,
                profession, experience,
                verificationStatus: 'none', workerId: newId
            });

        } else if (role === 'admin') {
            let exists = await Admin.findOne({ email });
            if (exists) return res.status(400).json({ success: false, msg: 'User already exists' });

            user = new Admin({ name, email, password, role, mobile });

        } else {
            return res.status(400).json({ success: false, msg: 'Invalid Role' });
        }

        await user.save(); // bcrypt pre-save hook hashes the password

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

// @route   POST /api/auth/login
// @desc    Authenticate user, issue access + refresh tokens
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        // Hardcoded Admin Check (Legacy fallback)
        if ((!role || role === 'admin') && email.trim() === 'admin123' && password.trim() === 'host123') {
            // Issue tokens for static admin
            const fakeAdmin = { _id: 'static_admin_id', email: 'admin123', role: 'admin', name: 'Admin' };
            const accessToken = jwt.sign(
                { id: fakeAdmin._id, email: fakeAdmin.email, role: fakeAdmin.role },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

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

        let user = null;
        let dbRole = '';

        if (role) {
            // STRICT MODE: Check only the collection for the requested role
            if (role === 'client') {
                user = await Client.findOne({ email });
                dbRole = 'client';
            } else if (role === 'professional' || role === 'worker') {
                const clientEx = await Client.findOne({ email });
                const adminEx = await Admin.findOne({ email });
                if (clientEx || adminEx) {
                    return res.status(400).json({ success: false, msg: 'Access Denied: Registered as Client/Admin' });
                }
                user = await Worker.findOne({ email });
                dbRole = 'professional';
            } else if (role === 'admin') {
                user = await Admin.findOne({ email });
                dbRole = 'admin';
            } else {
                return res.status(400).json({ success: false, msg: 'Invalid Role Specified' });
            }

            if (!user) {
                return res.status(400).json({ success: false, msg: 'User not found in this role' });
            }
        } else {
            // FALLBACK / LEGACY MODE (Sequential Check)
            user = await Admin.findOne({ email });
            if (user) dbRole = 'admin';

            if (!user) {
                user = await Worker.findOne({ email });
                if (user) dbRole = 'professional';
            }

            if (!user) {
                user = await Client.findOne({ email });
                if (user) dbRole = 'client';
            }
        }

        if (!user) {
            return res.status(400).json({ success: false, msg: 'Invalid Credentials' });
        }

        // Verify password (bcrypt or legacy plain-text with auto-upgrade)
        const isMatch = await verifyPassword(user, password);
        if (!isMatch) {
            return res.status(400).json({ success: false, msg: 'Invalid Credentials' });
        }

        // Generate tokens
        const userRole = user.role || dbRole;
        const tokenUser = { _id: user._id, email: user.email, role: userRole };
        const accessToken = generateAccessToken(tokenUser);
        const refreshToken = generateRefreshToken(tokenUser);

        // Store refresh token in DB
        await RefreshToken.create({
            token: refreshToken,
            userId: user._id,
            userRole: userRole,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        // Set refresh token in httpOnly cookie
        setRefreshCookie(res, refreshToken);

        // Return access token + user info
        res.json({
            success: true,
            msg: 'Login successful',
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: userRole,
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

// @route   POST /api/auth/refresh
// @desc    Issue a new access token using the refresh token cookie
// @access  Public (but requires valid refresh token)
router.post('/refresh', async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            return res.status(401).json({ success: false, message: 'No refresh token provided' });
        }

        // Verify the refresh token is in DB
        const storedToken = await RefreshToken.findOne({ token });
        if (!storedToken) {
            return res.status(401).json({ success: false, message: 'Refresh token not recognized — please login again' });
        }

        // Verify JWT signature
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        // Issue new access token
        const accessToken = generateAccessToken({
            _id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        });

        res.json({ success: true, accessToken });

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            // Clean up expired token from DB
            await RefreshToken.deleteOne({ token: req.cookies?.refreshToken });
            return res.status(401).json({ success: false, message: 'Refresh token expired — please login again' });
        }
        return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
});

// ── LOGOUT ─────────────────────────────────────────────────────────────────

// @route   POST /api/auth/logout
// @desc    Clear refresh token from DB and cookie
// @access  Public
router.post('/logout', async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;

        if (token) {
            // Remove from DB
            await RefreshToken.deleteOne({ token });
        }

        // Clear cookie
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
