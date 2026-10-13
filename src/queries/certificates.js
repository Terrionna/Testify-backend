// Database calls for certificates.
const crypto = require('crypto');
const Certificate = require('../models/certificate');

// Issues a certificate, or returns the one that already exists.
// findOneAndUpdate with upsert runs as one database operation, so two requests
// arriving at the same moment cannot both create a certificate.
const issueCertificate = async (userId, test) => {
    const filter = { user: userId, test: test._id };
    try {
        return await Certificate.findOneAndUpdate(
            filter,
            {
                // $setOnInsert only applies these fields when a new document is being created.
                $setOnInsert: {
                    testVersion: test.version,
                    code: crypto.randomBytes(8).toString('hex'),
                    issuedAt: new Date()
                }
            },
            { upsert: true, new: true }
        ).exec();
    } catch (err) {
        // Code 11000 means the unique index on user and test rejected a second insert.
        // That means another request created the certificate first, so read that one instead.
        if (err.code === 11000) {
            return Certificate.findOne(filter).exec();
        }
        throw err;
    }
};

const certificatesForUser = (userId) =>
    Certificate.find({ user: userId }).populate('test', 'title').exec();

module.exports = { issueCertificate, certificatesForUser };// JavaScript source code
