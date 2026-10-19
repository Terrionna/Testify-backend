// Certificate queries for Testify.
// Every database call for certificates lives here, so controllers never build queries.
const Certificate = require('../models/certificate');

// Returns the user's certificate for this test, creating it only if none exists.
// The lookup and the insert happen in one database call, so a repeat pass cannot create a second one.
const findOrIssue = async ({ user, test, testVersion, code }) => {
    try {
        return await Certificate.findOneAndUpdate(
            { user, test },
            // These values are used only when a new certificate is inserted.
            { $setOnInsert: { testVersion, code, issuedAt: new Date() } },
            // upsert inserts when nothing matches. returnDocument returns the saved certificate.
            { upsert: true, returnDocument: 'after' }
        ).exec();
    } catch (err) {
        // Two passes at the same moment can both try to insert. The unique index rejects the second,
        // so read the certificate the first one created.
        if (err.code === 11000) {
            return Certificate.findOne({ user, test }).exec();
        }
        throw err;
    }
};

// Returns a user's certificates with the test title.
const findByUser = (userId) =>
    Certificate.find({ user: userId }).populate('test', 'title').exec();

// Returns one certificate by its public code, with the holder's name and the test title.
const findByCode = (code) =>
    Certificate.findOne({ code })
        .populate('user', 'name')
        .populate('test', 'title')
        .exec();

module.exports = { findOrIssue, findByUser, findByCode };