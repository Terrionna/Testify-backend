// Test statistics controller for Testify.
const { testStats } = require('../queries/stats');
const { sendError } = require('../utils/errors');

// GET: /api/admin/stats/tests, returns attempt counts, pass rate, and average score per test version.
const byTest = async (req, res) => {
    try {
        return res.status(200).json(await testStats());
    } catch (err) {
        return sendError(res, err);
    }
};

module.exports = { byTest };