// Tests for taking a test: scoring, passing, certificates, and hiding answers.
const request = require('supertest');
const app = require('../../app');
const db = require('../helpers/db');
const Certificate = require('../../src/models/certificate');
const Attempt = require('../../src/models/attempt');
const { createUser, createTest } = require('../helpers/factories');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

// Sends answers for a test as the user with this token.
const submit = (token, testId, answers) =>
    request(app)
        .post(`/api/tests/${testId}/attempts`)
        .set('Authorization', `Bearer ${token}`)
        .send({ answers });

describe('POST /api/tests/:id/attempts', () => {
    test('scores 4 of 5 correct as 80 and passes at a passing score of 80', async () => {
        const { token } = await createUser();
        const test = await createTest({ passingScore: 80 });
        // Choice 0 is correct, so four 0s and one 1 is four correct.
        const res = await submit(token, test._id, [0, 0, 0, 0, 1]);
        expect(res.status).toBe(201);
        expect(res.body.score).toBe(80);
        expect(res.body.correct).toBe(4);
        expect(res.body.total).toBe(5);
        expect(res.body.passed).toBe(true);
        expect(res.body.certificateCode).toEqual(expect.any(String));
    });

    test('scores 3 of 5 correct as 60, fails, and issues no certificate', async () => {
        const { token } = await createUser();
        const test = await createTest({ passingScore: 80 });
        const res = await submit(token, test._id, [0, 0, 0, 1, 1]);
        expect(res.body.score).toBe(60);
        expect(res.body.passed).toBe(false);
        expect(res.body.certificateCode).toBeNull();
        expect(await Certificate.countDocuments()).toBe(0);
    });

    test('saves the attempt with the version that was taken', async () => {
        const { token, user } = await createUser();
        const test = await createTest({ version: 3 });
        await submit(token, test._id, [0, 0, 0, 0, 0]);
        const saved = await Attempt.findOne({ user: user._id });
        expect(saved.testVersion).toBe(3);
        expect(saved.score).toBe(100);
    });

    test('passing twice keeps one certificate and returns the same code', async () => {
        const { token } = await createUser();
        const test = await createTest();
        const first = await submit(token, test._id, [0, 0, 0, 0, 0]);
        const second = await submit(token, test._id, [0, 0, 0, 0, 0]);
        expect(second.body.certificateCode).toBe(first.body.certificateCode);
        expect(await Certificate.countDocuments()).toBe(1);
    });

    test('rejects the wrong number of answers with 400', async () => {
        const { token } = await createUser();
        const test = await createTest();
        const res = await submit(token, test._id, [0, 0]);
        expect(res.status).toBe(400);
    });

    test('rejects answers that are not whole numbers with 400', async () => {
        const { token } = await createUser();
        const test = await createTest();
        const res = await submit(token, test._id, ['0', 0, 0, 0, 0]);
        expect(res.status).toBe(400);
    });

    test('returns 404 for a draft test', async () => {
        const { token } = await createUser();
        const test = await createTest({ published: false });
        const res = await submit(token, test._id, [0, 0, 0, 0, 0]);
        expect(res.status).toBe(404);
    });

    test('returns 401 without a token', async () => {
        const test = await createTest();
        const res = await request(app)
            .post(`/api/tests/${test._id}/attempts`)
            .send({ answers: [0, 0, 0, 0, 0] });
        expect(res.status).toBe(401);
    });
});

describe('GET /api/tests/:id', () => {
    test('does not send the correct answers', async () => {
        const { token } = await createUser();
        const test = await createTest();
        const res = await request(app)
            .get(`/api/tests/${test._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.questions).toHaveLength(5);
        res.body.questions.forEach((question) => {
            expect(question.answer).toBeUndefined();
        });
    });
});

describe('GET /api/attempts/mine', () => {
    test('returns only the signed in user attempts', async () => {
        const mine = await createUser({ email: 'mine@example.com' });
        const other = await createUser({ email: 'other@example.com' });
        const test = await createTest();
        await submit(mine.token, test._id, [0, 0, 0, 0, 0]);
        await submit(other.token, test._id, [0, 0, 0, 0, 0]);
        const res = await request(app)
            .get('/api/attempts/mine')
            .set('Authorization', `Bearer ${mine.token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].answers).toBeUndefined();
    });
});