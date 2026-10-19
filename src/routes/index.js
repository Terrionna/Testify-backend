// Routes for Testify.
// Each route sends a URL to a controller function.
// requireAuth checks the token. requireAdmin checks for an admin.
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const auth = require('../controllers/auth');
const tests = require('../controllers/tests');
const attempts = require('../controllers/attempts');
const certificates = require('../controllers/certificates');
const stats = require('../controllers/stats');

// Open to everyone.
// POST: /api/register, creates an account.
router.post('/register', auth.register);
// POST: /api/login, logs a user in.
router.post('/login', auth.login);
// GET: /api/certificates/verify/:code, checks a certificate by its code.
router.get('/certificates/verify/:code', certificates.verify);

// Signed in users.
// GET: /api/tests, lists the published tests.
router.get('/tests', requireAuth, tests.listPublished);
// GET: /api/tests/:id, returns one published test.
router.get('/tests/:id', requireAuth, tests.getPublished);
// POST: /api/tests/:id/attempts, scores a submitted test.
router.post('/tests/:id/attempts', requireAuth, attempts.submit);
// GET: /api/attempts/mine, lists the user's attempts.
router.get('/attempts/mine', requireAuth, attempts.mine);
// GET: /api/certificates/mine, lists the user's certificates.
router.get('/certificates/mine', requireAuth, certificates.mine);

// Admins only.
// GET: /api/admin/tests, lists all tests, including drafts.
router.get('/admin/tests', requireAuth, requireAdmin, tests.listAll);
// POST: /api/admin/tests, creates a draft test.
router.post('/admin/tests', requireAuth, requireAdmin, tests.create);
// PUT: /api/admin/tests/:id, edits a draft test.
router.put('/admin/tests/:id', requireAuth, requireAdmin, tests.update);
// POST: /api/admin/tests/:id/publish, publishes a draft.
router.post('/admin/tests/:id/publish', requireAuth, requireAdmin, tests.publish);
// POST: /api/admin/tests/:id/versions, copies a test into a new draft version.
router.post('/admin/tests/:id/versions', requireAuth, requireAdmin, tests.newVersion);
// GET: /api/admin/stats, returns totals and the numbers for each test.
router.get('/admin/stats', requireAuth, requireAdmin, stats.overview);
// DELETE: /api/admin/tests/:id, deletes a draft.
router.delete('/admin/tests/:id', requireAuth, requireAdmin, tests.remove);

module.exports = router;