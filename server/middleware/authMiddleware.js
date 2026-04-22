const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const Worker = require('../models/Worker');
const Admin = require('../models/Admin');

/**
 * protect — Verifies the Bearer access token from Authorization header.
 * Attaches decoded user info to req.user and calls next().
 * Returns 401 if token is missing/invalid/expired.
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // Extract Bearer token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized — no token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info from token payload to request
        // The token payload contains: { id, email, role }
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired — please refresh' });
        }
        return res.status(401).json({ success: false, message: 'Not authorized — invalid token' });
    }
};

/**
 * authorize — Checks if req.user.role is in the allowed roles list.
 * Must be used AFTER protect middleware.
 * Returns 403 Forbidden if role not allowed.
 *
 * Usage: router.get('/admin-only', protect, authorize('admin'), handler)
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden — role '${req.user.role}' is not authorized for this resource`,
            });
        }

        next();
    };
};

module.exports = { protect, authorize };
