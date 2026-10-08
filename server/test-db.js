const mongoose = require('mongoose');
const VerificationRequest = require('./models/VerificationRequest');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/final-year').then(async () => {
    const workers = await User.find({ role: 'professional' }).lean();
    console.log('Workers:');
    workers.forEach(w => console.log(`- ${w.name}, workerId: ${w.workerId}, isVerified: ${w.isVerified}`));
    
    const verifiedIds = workers.filter(w => w.isVerified).map(w => w.workerId);
    console.log('verifiedIds:', verifiedIds);
    
    if (verifiedIds.length > 0) {
        const verDocs = await VerificationRequest.find({ workerId: { $in: verifiedIds } }).select('workerId city profession').lean();
        console.log('verDocs:', verDocs);
    } else {
        console.log('No verified workers found in User collection!');
        const allVer = await VerificationRequest.find().select('workerId name status').lean();
        console.log('All verifications:', allVer);
    }
    
    process.exit(0);
});
