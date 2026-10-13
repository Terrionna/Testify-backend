// Attempt controller for Testify.
// Scores a submitted test, saves the attempt, and issues a certificate if the test is passed.
const Test = require('../models/test');
const { recordAttempt, attemptsForUser, attemptsForTest } = require('../queries/attempts');
const { issueCertificate } = require('../queries/certificates');
const { sendError } = require('../utils/errors');

// POST: /api/tests/:id/attempts, scores a submitted test.
const submit = async (req, res) => {
    const { answers } = req.body;

    if (!Array.isArray(answers) || !answers.every(Number.isInteger)) {
        return res.status(400).json({ message: 'Answers must be a list of whole numbers' });
    }

    try {
        const test = await Test.findOne({ _id: req.params.id, published: true }).exec();
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        const total = test.questions.length;
        if (answers.length !== total) {
            return res.status(400).json({ message: 'One answer is required for every question' });
        }

        let correct = 0;
        test.questions.forEach((question, index) => {
            if (answers[index] === question.answer) {
                correct += 1;
            }
        });

        const score = Math.round((correct / total) * 100);
        const passed = score >= test.passingScore;

        await recordAttempt({ userId: req.auth._id, test, answers, score, passed });

        let certificateCode = null;
        if (passed) {
            const certificate = await issueCertificate(req.auth._id, test);
            certificateCode = certificate.code;
        }

        return res.status(201).json({ score, passed, correct, total, certificateCode });
    } catch (err) {
        return sendError(res, err);
    }
};

// GET: /api/attempts/mine, returns the signed in user's own attempts.
const mine = async (req, res) => {
    try {
        return res.status(200).json(await attemptsForUser(req.auth._id));
    } catch (err) {
        return sendError(res, err);
    }
};

// GET: /api/admin/tests/:id/attempts, returns every attempt on one test.
const forTest = async (req, res) => {
    try {
        return res.status(200).json(await attemptsForTest(req.params.id));
    } catch (err) {
        return sendError(res, err);
    }
};

module.exports = { submit, mine, forTest };