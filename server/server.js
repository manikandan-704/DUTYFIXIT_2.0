const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const path = require('path');
const { protect, authorize } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true, // Required for httpOnly cookies
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Serve Static Files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Database Connection
const connectDB = require('./config/db');
connectDB();

// ── Public Routes ──
app.use('/api/auth', require('./routes/auth'));

// ── Protected Routes ──
app.use('/api/verification', protect, require('./routes/verification'));
app.use('/api/profile', protect, require('./routes/profile'));
app.use('/api/bookings', protect, require('./routes/bookings'));
app.use('/api/payment', protect, require('./routes/payment'));

// ── Admin-Only Routes ──
app.use('/api/admin', protect, authorize('admin'), require('./routes/admin'));

// Send all remaining requests to the React app (Express 5 syntax)
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack || err.message);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
