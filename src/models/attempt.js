// Attempt model for Testify.
// An attempt is one saved try at a test: the answers, the score, and the result.
const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
    // The user who took the test.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    // The exact test document taken. Each version is its own document.
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'tests', required: true },
    // A copy of the version number, so it is known without looking up the test.
    testVersion: { type: Number, required: true },
    // The position of each chosen answer, in question order.
    answers: { type: [Number], required: true },
    score: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    takenAt: { type: Date, default: Date.now }
});

// Attempts are listed by user, newest first. This index serves that exact lookup.
attemptSchema.index({ user: 1, takenAt: -1 });
// The stats pipeline groups attempts by test.
attemptSchema.index({ test: 1 });

module.exports = mongoose.model('attempts', attemptSchema);