const mongoose = require('mongoose');
const VerificationRequest = require('./models/VerificationRequest');
const User = require('./models/User');

mongoose.connect('mongodb+srv://nagarajpriyan2004_db_user:1vz0SZxDtjFwCqs9@cluster0.rdczyjs.mongodb.net').then(async () => {
    const workers = await User.find({ role: 'professional' }).lean();
    console.log('Workers:', workers.length);
    const verifiedIds = workers.filter(w => w.isVerified).map(w => w.workerId);
    console.log('verifiedIds:', verifiedIds);
    
    if (verifiedIds.length > 0) {
        const verDocs = await VerificationRequest.find({ workerId: { $in: verifiedIds } }).select('workerId city profession status').lean();
        console.log('verDocs:', verDocs);
    } else {
        const allVer = await VerificationRequest.find().select('workerId city status').lean();
        console.log('All verifications:', allVer);
    }
    
    process.exit(0);
});
