// Tests for the admin stats route and the one-certificate-per-test rule in the database.
const request = require('supertest');
const app = require('../../app');
const db = require('../helpers/db');
const Certificate = require('../../src/models/certificate');
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

describe('GET /api/admin/stats', () => {
    test('rejects a taker with 403', async () => {
        const { token } = await createUser({ role: 'taker' });
        const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
    });

    test('returns the totals and the numbers for each test', async () => {
        const admin = await createUser({ email: 'admin@example.com', role: 'admin' });
        const a = await createUser({ email: 'a@example.com' });
        const b = await createUser({ email: 'b@example.com' });
        const test = await createTest({ title: 'Stats Test', passingScore: 80 });

        // User a passes with 100. User b fails with 60.
        await submit(a.token, test._id, [0, 0, 0, 0, 0]);
        await submit(b.token, test._id, [0, 0, 0, 1, 1]);

        const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${admin.token}`);
        expect(res.status).toBe(200);
        expect(res.body.totals).toEqual({ users: 3, attempts: 2, certificates: 1 });
        expect(res.body.tests).toHaveLength(1);
        expect(res.body.tests[0]).toMatchObject({
            title: 'Stats Test',
            version: 1,
            attempts: 2,
            passes: 1,
            takers: 2,
            averageScore: 80,
            passRate: 50
        });
    });
});

describe('Certificate unique index', () => {
    test('the database refuses a second certificate for the same user and test', async () => {
        const { user, token } = await createUser();
        const test = await createTest();
        await submit(token, test._id, [0, 0, 0, 0, 0]);
        await expect(
            Certificate.create({ user: user._id, test: test._id, testVersion: 1, code: 'different-code' })
        ).rejects.toMatchObject({ code: 11000 });
    });

    test('two passes sent at the same moment still leave one certificate', async () => {
        const { token } = await createUser();
        const test = await createTest();
        const answers = [0, 0, 0, 0, 0];
        const [first, second] = await Promise.all([
            submit(token, test._id, answers),
            submit(token, test._id, answers)
        ]);
        expect(first.body.certificateCode).toBe(second.body.certificateCode);
        expect(await Certificate.countDocuments()).toBe(1);
    });
});