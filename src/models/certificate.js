// Certificate model for Testify.
// A certificate is earned by passing a test. Anyone can verify it with its code.
const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    // The user who earned it. Indexed because certificates are looked up by user.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, index: true },
    // The exact test document that was passed.
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'tests', required: true },
    testVersion: { type: Number, required: true },
    // The public code used to verify the certificate. No two share one.
    code: { type: String, required: true, unique: true },
    issuedAt: { type: Date, default: Date.now }
});

// One user can hold only one certificate for each test document.
// The database enforces this, so two passes at the same moment cannot create two.
certificateSchema.index({ user: 1, test: 1 }, { unique: true });

module.exports = mongoose.model('certificates', certificateSchema);