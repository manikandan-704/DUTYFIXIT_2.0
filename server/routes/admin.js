const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const VerificationRequest = require('../models/VerificationRequest');

// GET /api/admin/stats — Dashboard KPIs (all parallel, no sort needed)
router.get('/stats', async (req, res) => {
    try {
        const [totalBookings, pendingBookings, completedBookings, totalWorkers, verifiedWorkers, totalCustomers, pendingVerifications] = await Promise.all([
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'Pending' }),
            Booking.countDocuments({ status: 'Completed' }),
            Worker.countDocuments(),
            Worker.countDocuments({ isVerified: true }),
            Client.countDocuments(),
            VerificationRequest.countDocuments({ status: 'Pending' })
        ]);

        res.json({ totalBookings, pendingBookings, completedBookings, totalWorkers, verifiedWorkers, totalCustomers, pendingVerifications });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// GET /api/admin/customers — All clients with booking counts (BULK, no N+1)
router.get('/customers', async (req, res) => {
    try {
        // 1. Fetch all clients (no password, no sort on large set — use lean)
        const clients = await Client.find().select('-password').lean();

        // 2. Single aggregation: booking count + last service per email
        const bookingStats = await Booking.aggregate([
            { $sort: { createdAt: -1 } },
            { $group: {
                _id: '$clientEmail',
                bookingCount: { $sum: 1 },
                lastService: { $first: '$service' },
                lastBookingDate: { $first: '$createdAt' }
            }}
        ]).allowDiskUse(true);

        // Build a lookup map
        const statsMap = {};
        bookingStats.forEach(s => { statsMap[s._id] = s; });

        // 3. Merge in O(n) — no per-client DB calls
        const enriched = clients.map(c => ({
            ...c,
            bookingCount: statsMap[c.email]?.bookingCount || 0,
            lastService: statsMap[c.email]?.lastService || null,
            lastBookingDate: statsMap[c.email]?.lastBookingDate || null,
        }));

        // Sort in JS (faster than MongoDB sort on unindexed field for this size)
        enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// GET /api/admin/workers — All workers enriched (BULK, no N+1)
router.get('/workers', async (req, res) => {
    try {
        // 1. All workers (no password)
        const workers = await Worker.find().select('-password').lean();

        // 2. All verification requests — select only needed fields (NO Base64 photo)
        const verReqs = await VerificationRequest.find()
            .select('email profession city status certificateData profilePhotoData')
            .lean();
        const verMap = {};
        verReqs.forEach(v => { verMap[v.email] = v; });

        // 3. Aggregation: completed jobs + avg rating per worker in one pass
        const workerStats = await Booking.aggregate([
            { $match: { status: 'Completed' } },
            { $group: {
                _id: '$workerId',
                completedJobs: { $sum: 1 },
                totalRating: { $sum: { $cond: [{ $gt: ['$rating', 0] }, '$rating', 0] } },
                ratedCount: { $sum: { $cond: [{ $gt: ['$rating', 0] }, 1, 0] } }
            }}
        ]).allowDiskUse(true);

        const wStatsMap = {};
        workerStats.forEach(s => { wStatsMap[s._id] = s; });

        // 4. Merge in O(n)
        const enriched = workers.map(w => {
            const ver = verMap[w.email];
            const st = wStatsMap[w.workerId] || {};
            const avgRating = st.ratedCount > 0
                ? (st.totalRating / st.ratedCount).toFixed(1)
                : (w.rating || 'N/A');

            return {
                ...w,
                profilePhotoData: ver?.profilePhotoData || null,
                profession: w.profession || ver?.profession || 'N/A',
                city: ver?.city || 'N/A',
                mobile: w.mobile,
                completedJobs: st.completedJobs || w.jobsCompleted || 0,
                avgRating,
                verificationStatus: ver?.status || w.verificationStatus || 'Not Submitted',
            };
        });

        enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// GET /api/admin/reviews — Bookings with ratings (no enrichment needed)
router.get('/reviews', async (req, res) => {
    try {
        const reviews = await Booking.find(
            { rating: { $gt: 0 }, feedback: { $exists: true, $ne: '' } }
        )
            .select('clientName clientEmail service subService workerName rating feedback createdAt bookingId')
            .sort({ createdAt: -1 })
            .allowDiskUse(true)
            .lean();
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// DELETE /api/admin/customers/:id
router.delete('/customers/:id', async (req, res) => {
    try {
        await Client.findByIdAndDelete(req.params.id);
        res.json({ message: 'Customer deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// DELETE /api/admin/workers/:id
router.delete('/workers/:id', async (req, res) => {
    try {
        await Worker.findByIdAndDelete(req.params.id);
        res.json({ message: 'Worker deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

module.exports = router;
