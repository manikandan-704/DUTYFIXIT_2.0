const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const VerificationRequest = require('../models/VerificationRequest');
const Notification = require('../models/Notification');

// Create a new booking
router.post('/', async (req, res) => {
    try {
        const {
            clientName,
            clientEmail,
            service,
            subService,
            contact,
            date,
            time,
            location,
            workerId,
            workerName,
            workerPhone,
            profession
        } = req.body;

        console.log('Received booking request:', JSON.stringify(req.body, null, 2));

        const newBooking = new Booking({
            bookingId: 'BK-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100), // Simple unique ID
            clientName: clientName || 'Guest User',
            clientEmail,
            service,
            subService,
            contact,
            date,
            time,
            location,
            workerId,
            workerName: workerName || 'Any Professional',
            workerPhone,
            profession
        });

        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get worker dashboard stats
router.get('/dashboard/:workerId', async (req, res) => {
    try {
        const { workerId } = req.params;

        // 1. Get Completed Bookings
        const completedBookings = await Booking.find({
            workerId: workerId,
            status: 'Completed'
        });

        // 2. Jobs Done
        const jobsDone = completedBookings.length;

        // 3. Calculate Rating
        let rating = 0.0;
        // Only consider bookings that have a rating
        const ratedBookings = completedBookings.filter(b => b.rating && b.rating > 0);

        if (ratedBookings.length > 0) {
            const totalRating = ratedBookings.reduce((sum, booking) => sum + booking.rating, 0);
            rating = (totalRating / ratedBookings.length).toFixed(1);
        }

        res.json({
            jobsDone,
            rating
        });

    } catch (err) {
        console.error('Error fetching worker stats:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get bookings for a specific worker
router.get('/worker/:workerId', async (req, res) => {
    try {
        const bookings = await Booking.find({ workerId: req.params.workerId }).sort({ createdAt: -1 }).allowDiskUse(true);
        res.json(bookings);
    } catch (err) {
        console.error('Error fetching worker bookings:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get bookings for a client (by email)
router.get('/client/:email', async (req, res) => {
    try {
        let bookings = await Booking.find({ clientEmail: req.params.email }).sort({ createdAt: -1 }).allowDiskUse(true).lean();

        // Bulk-populate workerName for old bookings
        const missingIds = [...new Set(bookings.filter(b => b.workerId && !b.workerName).map(b => b.workerId.trim()))];
        if (missingIds.length > 0) {
            const [verDocs, wrkDocs] = await Promise.all([
                VerificationRequest.find({ workerId: { $in: missingIds } }).select('workerId name mobile profilePhotoData').lean(),
                Worker.find({ workerId: { $in: missingIds } }).select('workerId name mobile').lean()
            ]);
            const wMap = {};
            wrkDocs.forEach(w => { wMap[w.workerId] = w; });
            verDocs.forEach(v => { wMap[v.workerId] = { ...wMap[v.workerId], ...v }; }); // ver overrides

            bookings.forEach(b => {
                if (b.workerId && !b.workerName && wMap[b.workerId.trim()]) {
                    const wd = wMap[b.workerId.trim()];
                    b.workerName = wd.name;
                    b.workerPhone = wd.mobile;
                    if (wd.profilePhotoData) b.workerProfilePhoto = wd.profilePhotoData;
                }
            });
        }

        res.json(bookings);
    } catch (err) {
        console.error('Error fetching client bookings:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update booking status (Accept/Reject)
router.put('/:id', async (req, res) => {
    try {
        console.log('Update Booking Request:', req.params.id, req.body);
        const { status, rejectionReason } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = status;
        if (rejectionReason) {
            booking.rejectionReason = rejectionReason;
        }
        if (req.body.cancellationReason) {
            booking.cancellationReason = req.body.cancellationReason;
        }
        if (req.body.paymentScreenshot) {
            booking.paymentScreenshot = req.body.paymentScreenshot;
        }
        if (req.body.rating) {
            booking.rating = req.body.rating;
        }
        if (req.body.feedback) {
            booking.feedback = req.body.feedback;
        }

        await booking.save();

        // Notification Logic for 'Completed' status
        if (status === 'Completed') {
            // 1. Notify Worker
            if (booking.workerId) {
                const workerNotification = new Notification({
                    recipientId: booking.workerId,
                    recipientRole: 'Worker',
                    message: `Booking ${booking.bookingId} has been marked as Completed by the client.`,
                    bookingId: booking._id
                });
                await workerNotification.save();

                // 2. Update Worker Stats (Rating & Jobs Completed)

                // A. Count Total Jobs Completed (Rated or Not)
                const allCompleted = await Booking.find({
                    workerId: booking.workerId,
                    status: 'Completed'
                });
                const totalJobsCount = allCompleted.length;

                // B. Calculate Average Rating (Only from rated bookings)
                const ratedBookings = allCompleted.filter(b => b.rating && b.rating > 0);
                let newAverageRating = 0;

                if (ratedBookings.length > 0) {
                    const sumRating = ratedBookings.reduce((sum, b) => sum + (b.rating || 0), 0);
                    newAverageRating = (sumRating / ratedBookings.length);
                }

                // Update the Worker document
                await Worker.findOneAndUpdate(
                    { workerId: booking.workerId },
                    {
                        $set: {
                            rating: newAverageRating,
                            jobsCompleted: totalJobsCount
                        }
                    }
                );
            }

            // 3. Notify Admin
            const adminNotification = new Notification({
                recipientId: 'Admin',
                recipientRole: 'Admin',
                message: `Booking ${booking.bookingId} has been marked as Completed by the client.`,
                bookingId: booking._id
            });
            await adminNotification.save();
        }

        res.json(booking);
    } catch (err) {
        console.error('Error updating booking:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get all bookings (for Admin Dashboard)
router.get('/all', async (req, res) => {
    try {
        let bookings = await Booking.find().sort({ createdAt: -1 }).allowDiskUse(true).lean();

        // Bulk-populate workerName for old bookings (no N+1)
        const missingIds = [...new Set(bookings.filter(b => b.workerId && !b.workerName).map(b => b.workerId.trim()))];
        if (missingIds.length > 0) {
            const [verDocs, wrkDocs] = await Promise.all([
                VerificationRequest.find({ workerId: { $in: missingIds } }).select('workerId name mobile').lean(),
                Worker.find({ workerId: { $in: missingIds } }).select('workerId name mobile').lean()
            ]);
            const wMap = {};
            wrkDocs.forEach(w => { wMap[w.workerId] = w; });
            verDocs.forEach(v => { wMap[v.workerId] = { ...wMap[v.workerId], ...v }; });

            bookings.forEach(b => {
                if (b.workerId && !b.workerName && wMap[b.workerId.trim()]) {
                    b.workerName = wMap[b.workerId.trim()].name;
                    b.workerPhone = wMap[b.workerId.trim()].mobile;
                }
            });
        }

        res.json(bookings);
    } catch (err) {
        console.error('Error fetching all bookings:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get all workers with ratings for Admin Dashboard
router.get('/workers-ratings', async (req, res) => {
    try {
        const workers = await Worker.find().lean();
        const completedBookings = await Booking.find({ status: 'Completed' }).lean();

        // Calculate ratings per worker
        const workerStats = {};

        completedBookings.forEach(booking => {
            if (booking.workerId && booking.rating && booking.rating > 0) {
                if (!workerStats[booking.workerId]) {
                    workerStats[booking.workerId] = { totalRating: 0, count: 0 };
                }
                workerStats[booking.workerId].totalRating += booking.rating;
                workerStats[booking.workerId].count += 1;
            }
        });

        // Bulk fetch all verification photos at once (instead of 1 query per worker)
        const verifiedIds = workers.filter(w => w.isVerified).map(w => w.workerId);
        const verPhotoMap = {};
        if (verifiedIds.length > 0) {
            const verDocs = await VerificationRequest.find({ workerId: { $in: verifiedIds } })
                .select('workerId profilePhotoData').lean();
            verDocs.forEach(v => { verPhotoMap[v.workerId] = v.profilePhotoData; });
        }

        const enrichedWorkers = workers.map(worker => {
            const stats = workerStats[worker.workerId] || { totalRating: 0, count: 0 };
            const avgRating = stats.count > 0 ? (stats.totalRating / stats.count).toFixed(1) : 'N/A';

            return {
                _id: worker._id,
                workerId: worker.workerId,
                name: worker.name,
                email: worker.email,
                profession: worker.profession || 'Professional',
                rating: avgRating,
                jobsDone: stats.count,
                profilePhoto: verPhotoMap[worker.workerId] || null,
                isVerified: worker.isVerified
            };
        });

        res.json(enrichedWorkers);

    } catch (err) {
        console.error('Error fetching workers with ratings:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
