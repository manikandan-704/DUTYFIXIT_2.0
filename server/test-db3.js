const mongoose = require('mongoose');

// Temporary model to check the 'workers' collection
const Worker = mongoose.model('Worker', new mongoose.Schema({}, { strict: false }));

mongoose.connect('mongodb+srv://nagarajpriyan2004_db_user:1vz0SZxDtjFwCqs9@cluster0.rdczyjs.mongodb.net').then(async () => {
    const workers = await Worker.find().lean();
    console.log(`Found ${workers.length} workers in the 'workers' collection.`);
    if (workers.length > 0) {
        console.log(workers[0]);
    }
    process.exit(0);
});
