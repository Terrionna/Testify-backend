// Stats queries for Testify.
// Uses an aggregation pipeline: the database groups and averages the attempts, not the server.
const Attempt = require('../models/attempt');
const User = require('../models/user');
const Certificate = require('../models/certificate');

// Returns one row per test with the attempt count, pass count, average score, pass rate, and number of different takers.
const perTest = () =>
    Attempt.aggregate([
        // Put all attempts for the same test document together.
        {
            $group: {
                _id: '$test',
                attempts: { $sum: 1 },
                averageScore: { $avg: '$score' },
                // Add 1 for every passed attempt and 0 for every failed one.
                passes: { $sum: { $cond: ['$passed', 1, 0] } },
                // A set holds each user once, so its size is the number of different takers.
                takers: { $addToSet: '$user' }
            }
        },
        // Bring in the test document for the title and version.
        { $lookup: { from: 'tests', localField: '_id', foreignField: '_id', as: 'test' } },
        { $unwind: '$test' },
        // Choose the fields to send back and round the numbers to one decimal place.
        {
            $project: {
                _id: 0,
                testId: '$_id',
                title: '$test.title',
                version: '$test.version',
                attempts: 1,
                passes: 1,
                takers: { $size: '$takers' },
                averageScore: { $round: ['$averageScore', 1] },
                passRate: { $round: [{ $multiply: [{ $divide: ['$passes', '$attempts'] }, 100] }, 1] }
            }
        },
        { $sort: { title: 1, version: 1 } }
    ]);

// Returns the number of users, attempts, and certificates.
const totals = async () => {
    const [users, attempts, certificates] = await Promise.all([
        User.countDocuments(),
        Attempt.countDocuments(),
        Certificate.countDocuments()
    ]);
    return { users, attempts, certificates };
};

module.exports = { perTest, totals };