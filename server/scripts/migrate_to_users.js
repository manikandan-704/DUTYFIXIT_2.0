require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
    console.log('🔄 Starting migration to unified User collection...\n');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    const collectionsToMigrate = [
        { name: 'clients', role: 'client' },
        { name: 'workers', role: 'professional' },
        { name: 'admins', role: 'admin' }
    ];

    for (const coll of collectionsToMigrate) {
        try {
            const items = await db.collection(coll.name).find({}).toArray();
            let count = 0;
            for (const item of items) {
                const exists = await User.findOne({ email: item.email });
                if (!exists) {
                    const user = new User({
                        ...item,
                        role: coll.role
                    });
                    
                    // Maintain the original _id so relations aren't broken
                    const doc = user.toObject();
                    doc._id = item._id; 
                    
                    await User.collection.insertOne(doc);
                    count++;
                }
            }
            console.log(`✅ Migrated ${count} out of ${items.length} ${coll.name}`);
        } catch (e) {
            console.log(`⚠️ Could not migrate ${coll.name} - it might not exist or threw an error: ${e.message}`);
        }
    }

    console.log('\n🎉 Migration complete! You can now safely delete the old clients, workers, and admins collections if everything works.');
    process.exit(0);
}

run().catch(console.error);
