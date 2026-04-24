/**
 * migrate_passwords.js
 *
 * One-time migration script: hashes all plain-text passwords in the
 * Client, Worker, and Admin collections using bcrypt (salt rounds: 10).
 *
 * Run ONCE: node server/scripts/migrate_passwords.js
 *
 * Safe to re-run — already-hashed passwords (starting with $2a$ / $2b$)
 * are automatically skipped.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Client = require('../models/Client');
const Worker = require('../models/Worker');
const Admin = require('../models/Admin');

const SALT_ROUNDS = 10;

async function migrateCollection(Model, name) {
    const docs = await Model.find({});
    let hashed = 0;
    let skipped = 0;

    for (const doc of docs) {
        // Skip already-hashed passwords
        if (doc.password && (doc.password.startsWith('$2a$') || doc.password.startsWith('$2b$'))) {
            skipped++;
            continue;
        }

        if (!doc.password) {
            console.warn(`  [WARN] ${name} ${doc.email} has no password — skipping`);
            skipped++;
            continue;
        }

        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hashed_pw = await bcrypt.hash(doc.password, salt);

        // Use updateOne to bypass the pre-save hook (password is already hashed)
        await Model.updateOne({ _id: doc._id }, { $set: { password: hashed_pw } });
        console.log(`  ✅ Hashed password for ${name}: ${doc.email}`);
        hashed++;
    }

    console.log(`\n  ${name}: ${hashed} hashed, ${skipped} skipped (total ${docs.length})`);
}

async function run() {
    console.log('🔐 Starting password migration...\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('→ Migrating Clients...');
    await migrateCollection(Client, 'Client');

    console.log('\n→ Migrating Workers...');
    await migrateCollection(Worker, 'Worker');

    console.log('\n→ Migrating Admins...');
    await migrateCollection(Admin, 'Admin');

    console.log('\n🎉 Migration complete. All plain-text passwords have been hashed.');
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
