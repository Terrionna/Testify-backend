// Stats controller for Testify.
// Gives admins the totals and the numbers for each test.
const statsQueries = require('../queries/state');
const { sendError } = require('../utils/errors');

// GET: /api/admin/stats, returns totals and the numbers for each test.
const overview = async (req, res) => {
    try {
        const [totals, tests] = await Promise.all([statsQueries.totals(), statsQueries.perTest()]);
        return res.status(200).json({ totals, tests });
    } catch (err) {
        return sendError(res, err);
    }
};

module.exports = { overview };
