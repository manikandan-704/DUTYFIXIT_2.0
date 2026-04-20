const express = require('express');
const router = express.Router();
const VerificationRequest = require('../models/VerificationRequest');
const Worker = require('../models/Worker');

// @route   POST /api/verification
// @desc    Submit a new verification request
// @access  Public (Worker)
router.post('/', async (req, res) => {
    try {
        const {
            name, email, mobile, profession, gender, idType, idNumber, city, pincode,
            certificate, certificateData, workerId,
            profilePhoto, profilePhotoData
        } = req.body;

        const newRequest = new VerificationRequest({
            workerId,
            name,
            email,
            mobile,
            profession,
            gender,
            idType,
            idNumber,
            city,
            pincode,
            certificate,
            certificateData,
            profilePhoto,
            profilePhotoData
        });

        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// @route   GET /api/verification
// @desc    Get all verification requests (with optional filtering)
// @access  Public (Worker/Client) or Private (Admin)
router.get('/', async (req, res) => {
    try {
        const { city, profession, status } = req.query;
        let query = {};

        if (status) query.status = status;
        if (city) query.city = { $regex: city, $options: 'i' };
        if (profession) query.profession = { $regex: profession, $options: 'i' };

        // Exclude large Base64 fields unless explicitly needed
        const requests = await VerificationRequest.find(query)
            .sort({ date: -1 })
            .allowDiskUse(true)
            .lean();

        // Bulk fetch all workers at once (instead of 1 query per request)
        const approvedEmails = requests.filter(r => r.status === 'Approved').map(r => r.email);
        const workerMap = {};
        if (approvedEmails.length > 0) {
            const workers = await Worker.find({ email: { $in: approvedEmails } })
                .select('email rating jobsCompleted')
                .lean();
            workers.forEach(w => { workerMap[w.email] = w; });
        }

        // Merge in O(n)
        const enriched = requests.map(r => {
            if (r.status === 'Approved' && workerMap[r.email]) {
                r.rating = workerMap[r.email].rating || 5.0;
                r.jobsCompleted = workerMap[r.email].jobsCompleted || 0;
            }
            return r;
        });

        res.json(enriched);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Worker model imported at top

// @route   PUT /api/verification/:id
// @desc    Update request status (Approve/Reject)
// @access  Private (Admin)
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;

        let request = await VerificationRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ msg: 'Request not found' });
        }

        request.status = status;
        await request.save();

        if (status === 'Approved') {
            const worker = await Worker.findOne({ email: request.email });
            if (worker) {
                worker.isVerified = true;
                worker.verificationStatus = 'approved';
                if (request.profilePhotoData) {
                    worker.profilePic = request.profilePhotoData;
                }
                await worker.save();
            }
        } else if (status === 'Rejected') {
            const worker = await Worker.findOne({ email: request.email });
            if (worker) {
                worker.verificationStatus = 'rejected';
                await worker.save();
            }
        }

        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/verification/status
// @desc    Get verification status for a specific user (by email)
// @access  Public (Worker)
router.get('/status', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ msg: 'Email is required' });

        const request = await VerificationRequest.findOne({ email });
        if (!request) return res.json({ status: 'Not Found' });

        res.json({
            status: request.status,
            data: request // Return full data
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
