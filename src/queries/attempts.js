// Attempt queries for Testify.
// Every database call for attempts lives here, so controllers never build queries.
const Attempt = require('../models/attempt');

// Saves one attempt.
const create = (data) => Attempt.create(data);

// Returns a user's attempts, newest first, with the test title and without the answers.
const findByUser = (userId) =>
    Attempt.find({ user: userId })
        .populate('test', 'title')
        .select('-answers')
        .sort({ takenAt: -1 })
        .exec();

module.exports = { create, findByUser };