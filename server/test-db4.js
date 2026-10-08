const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb+srv://nagarajpriyan2004_db_user:1vz0SZxDtjFwCqs9@cluster0.rdczyjs.mongodb.net').then(async () => {
    const workers = await User.find({ role: 'professional' }).lean();
    console.log(workers.map(w => ({ email: w.email, workerId: w.workerId, hasProfilePic: !!w.profilePic })));
    process.exit(0);
});
