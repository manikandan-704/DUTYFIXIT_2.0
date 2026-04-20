const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order — Create Razorpay order for booking acceptance
router.post('/create-order', async (req, res) => {
    try {
        const { bookingId, amount } = req.body;

        // Verify the booking exists and is pending
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking.status !== 'Pending') {
            return res.status(400).json({ message: 'Booking is not in Pending status' });
        }

        // Amount in paise (₹100 = 10000 paise)
        const amountInPaise = (amount || 100) * 100;

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_${booking.bookingId}_${Date.now()}`,
            notes: {
                bookingId: booking._id.toString(),
                bookingRef: booking.bookingId,
                service: booking.service,
                workerName: booking.workerName || 'Worker',
            }
        };

        const order = await razorpay.orders.create(options);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        });

    } catch (err) {
        console.error('Error creating Razorpay order:', err);
        res.status(500).json({ message: 'Failed to create payment order', error: err.message });
    }
});

// POST /api/payment/verify — Verify payment signature & accept booking
router.post('/verify', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed — invalid signature' });
        }

        // Payment verified — Update booking to Accepted
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = 'Accepted';
        booking.paymentId = razorpay_payment_id;
        booking.paymentOrderId = razorpay_order_id;
        await booking.save();

        res.json({
            message: 'Payment verified and booking accepted',
            booking,
        });

    } catch (err) {
        console.error('Error verifying payment:', err);
        res.status(500).json({ message: 'Payment verification failed', error: err.message });
    }
});

// GET /api/payment/key — Return Razorpay key ID to frontend
router.get('/key', (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

module.exports = router;
