// Certificate controller for Testify.
// Lists a user's certificates and verifies a certificate by its code.
const Certificate = require('../models/certificate');
const { certificatesForUser } = require('../queries/certificates');
const { sendError } = require('../utils/errors');

// GET: /api/certificates/mine, returns the signed in user's own certificates.
const mine = async (req, res) => {
    try {
        return res.status(200).json(await certificatesForUser(req.auth._id));
    } catch (err) {
        return sendError(res, err);
    }
};

// GET: /api/certificates/verify/:code, checks a certificate by its code.
const verify = async (req, res) => {
    try {
        const certificate = await Certificate.findOne({ code: req.params.code })
            .populate('user', 'name')
            .populate('test', 'title')
            .exec();
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        return res.status(200).json({
            name: certificate.user.name,
            title: certificate.test.title,
            version: certificate.testVersion,
            issuedAt: certificate.issuedAt
        });
    } catch (err) {
        return sendError(res, err);
    }
};

module.exports = { mine, verify };