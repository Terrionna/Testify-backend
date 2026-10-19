// Tests for listing and verifying certificates.
const request = require('supertest');
const app = require('../../app');
const db = require('../helpers/db');
const { createUser, createTest } = require('../helpers/factories');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

// Passes the test as this user and returns the certificate code.
const pass = async (token, testId) => {
    const res = await request(app)
        .post(`/api/tests/${testId}/attempts`)
        .set('Authorization', `Bearer ${token}`)
        .send({ answers: [0, 0, 0, 0, 0] });
    return res.body.certificateCode;
};

describe('GET /api/certificates/verify/:code', () => {
    test('works without a token and returns only public details', async () => {
        const { token } = await createUser({ name: 'Sam Rivera', email: 'sam@example.com' });
        const test = await createTest({ title: 'Secure Coding Basics', version: 2 });
        const code = await pass(token, test._id);

        const res = await request(app).get(`/api/certificates/verify/${code}`);
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Sam Rivera');
        expect(res.body.title).toBe('Secure Coding Basics');
        expect(res.body.version).toBe(2);
        expect(res.body.issuedAt).toBeDefined();
        // The email and the user id must never be sent.
        expect(JSON.stringify(res.body)).not.toContain('sam@example.com');
        expect(res.body.user).toBeUndefined();
    });

    test('returns 404 for a code that does not exist', async () => {
        const res = await request(app).get('/api/certificates/verify/doesnotexist');
        expect(res.status).toBe(404);
    });
});

describe('GET /api/certificates/mine', () => {
    test('returns only the signed in user certificates', async () => {
        const mine = await createUser({ email: 'mine@example.com' });
        const other = await createUser({ email: 'other@example.com' });
        const test = await createTest();
        await pass(mine.token, test._id);
        await pass(other.token, test._id);

        const res = await request(app)
            .get('/api/certificates/mine')
            .set('Authorization', `Bearer ${mine.token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });
});