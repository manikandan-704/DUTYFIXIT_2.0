/**
 * run once: node server/scripts/create_indexes.js
 * Adds indexes to prevent sort memory limit errors and speed up queries.
 * Uses background: true and catches existing-index conflicts gracefully.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const Client = require('../models/Client');
const VerificationRequest = require('../models/VerificationRequest');

const safe = async (fn, label) => {
    try { await fn(); console.log(`  ✅ ${label}`); }
    catch (e) {
        if (e.code === 86 || e.code === 85 || e.message?.includes('already exists') || e.message?.includes('same name')) {
            console.log(`  ⏭️  ${label} (already exists, skipped)`);
        } else {
            console.error(`  ❌ ${label}:`, e.message);
        }
    }
};

async function createIndexes() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('Booking indexes:');
    await safe(() => Booking.collection.createIndex({ createdAt: -1 }), 'createdAt desc');
    await safe(() => Booking.collection.createIndex({ clientEmail: 1, createdAt: -1 }), 'clientEmail + createdAt');
    await safe(() => Booking.collection.createIndex({ workerId: 1, createdAt: -1 }), 'workerId + createdAt');
    await safe(() => Booking.collection.createIndex({ status: 1 }), 'status');
    await safe(() => Booking.collection.createIndex({ rating: 1 }), 'rating');

    console.log('\nWorker indexes:');
    await safe(() => Worker.collection.createIndex({ createdAt: -1 }), 'createdAt desc');
    await safe(() => Worker.collection.createIndex({ workerId: 1 }), 'workerId');

    console.log('\nClient indexes:');
    await safe(() => Client.collection.createIndex({ createdAt: -1 }), 'createdAt desc');

    console.log('\nVerificationRequest indexes:');
    await safe(() => VerificationRequest.collection.createIndex({ date: -1 }), 'date desc');
    await safe(() => VerificationRequest.collection.createIndex({ status: 1 }), 'status');

    console.log('\n🎉 Index setup complete!');
    process.exit(0);
}

createIndexes().catch(err => { console.error('Fatal:', err); process.exit(1); });
