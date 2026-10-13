// JavaScript source code
// Reports attempt counts, pass rate, and average score for every test version.
const Attempt = require('../models/attempt');

const testStats = () =>
    Attempt.aggregate([
        // Group every attempt by which test it belongs to.
        {
            $group: {
                _id: '$test',
                attempts: { $sum: 1 },
                passes: { $sum: { $cond: ['$passed', 1, 0] } },
                averageScore: { $avg: '$score' }
            }
        },
        // Join in the test document so its title and version can be reported.
        { $lookup: { from: 'tests', localField: '_id', foreignField: '_id', as: 'test' } },
        { $unwind: '$test' },
        // Shape the final result and work out the pass rate as a percent.
        {
            $project: {
                _id: 0,
                testId: '$_id',
                title: '$test.title',
                version: '$test.version',
                attempts: 1,
                passes: 1,
                passRate: { $round: [{ $multiply: [{ $divide: ['$passes', '$attempts'] }, 100] }, 1] },
                averageScore: { $round: ['$averageScore', 1] }
            }
        },
        { $sort: { title: 1, version: 1 } }
    ]).exec();

module.exports = { testStats };