// Database calls for attempts.
// Keeping these out of the controller means the controller only has to decide what to do with the result.
const Attempt = require('../models/attempt');

// Saves one attempt.
const recordAttempt = ({ userId, test, answers, score, passed }) =>
    Attempt.create({
        user: userId,
        test: test._id,
        testVersion: test.version,
        answers,
        score,
        passed
    });

// Returns one user's attempts, newest first, without the answers.
const attemptsForUser = (userId) =>
    Attempt.find({ user: userId })
        .populate('test', 'title')
        .select('-answers')
        .sort({ takenAt: -1 })
        .exec();

// Returns every attempt on one test, newest first, without the answers.
const attemptsForTest = (testId) =>
    Attempt.find({ test: testId })
        .populate('user', 'name email')
        .select('-answers')
        .sort({ takenAt: -1 })
        .exec();

module.exports = { recordAttempt, attemptsForUser, attemptsForTest };