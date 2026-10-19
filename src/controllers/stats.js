// Stats controller for Testify.
// Sends the numbers the admin page shows.
const statsQueries = require('../queries/stats');
const { sendError } = require('../utils/errors');

// GET: /api/admin/stats, returns the totals and one row of numbers per test.
const overview = async (req, res) => {
    try {
        // Run both queries at the same time.
        const [totals, tests] = await Promise.all([statsQueries.totals(), statsQueries.perTest()]);
        return res.status(200).json({ totals, tests });
    } catch (err) {
        return sendError(res, err);
    }
};

module.exports = { overview };