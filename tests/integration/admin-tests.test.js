// Tests for the admin routes: who can use them, and the draft, publish, and version rules.
const request = require('supertest');
const app = require('../../app');
const db = require('../helpers/db');
const Test = require('../../src/models/test');
const { createUser, createTest } = require('../helpers/factories');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

// Valid data for creating a test.
const body = () => ({
    title: 'New Test',
    passingScore: 70,
    version: 1,
    questions: [{ text: 'Question?', choices: ['A', 'B'], answer: 1 }]
});

describe('Admin route access', () => {
    test('rejects a request with no token with 401', async () => {
        const res = await request(app).get('/api/admin/tests');
        expect(res.status).toBe(401);
    });

    test('rejects a taker with 403', async () => {
        const { token } = await createUser({ role: 'taker' });
        const res = await request(app)
            .get('/api/admin/tests')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
    });

    test('lets an admin list tests, drafts included', async () => {
        const { token } = await createUser({ role: 'admin' });
        await createTest({ title: 'Draft One', published: false });
        const res = await request(app)
            .get('/api/admin/tests')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });
});

describe('Creating, editing, publishing, and deleting', () => {
    test('a new test is always a draft, even if published is sent as true', async () => {
        const { token } = await createUser({ role: 'admin' });
        const res = await request(app)
            .post('/api/admin/tests')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...body(), published: true });
        expect(res.status).toBe(201);
        expect(res.body.published).toBe(false);
    });

    test('rejects invalid test data with 400', async () => {
        const { token } = await createUser({ role: 'admin' });
        const res = await request(app)
            .post('/api/admin/tests')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...body(), questions: [] });
        expect(res.status).toBe(400);
    });

    test('rejects the same title and version twice with 409', async () => {
        const { token } = await createUser({ role: 'admin' });
        await request(app).post('/api/admin/tests').set('Authorization', `Bearer ${token}`).send(body());
        const res = await request(app).post('/api/admin/tests').set('Authorization', `Bearer ${token}`).send(body());
        expect(res.status).toBe(409);
    });

    test('edits a draft', async () => {
        const { token } = await createUser({ role: 'admin' });
        const draft = await createTest({ published: false });
        const res = await request(app)
            .put(`/api/admin/tests/${draft._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ ...body(), title: 'Renamed' });
        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Renamed');
    });

    test('publishes a draft', async () => {
        const { token } = await createUser({ role: 'admin' });
        const draft = await createTest({ published: false });
        const res = await request(app)
            .post(`/api/admin/tests/${draft._id}/publish`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.published).toBe(true);
    });

    test('refuses to edit a published test with 409', async () => {
        const { token } = await createUser({ role: 'admin' });
        const live = await createTest({ published: true });
        const res = await request(app)
            .put(`/api/admin/tests/${live._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(body());
        expect(res.status).toBe(409);
    });

    test('deletes a draft with 204', async () => {
        const { token } = await createUser({ role: 'admin' });
        const draft = await createTest({ published: false });
        const res = await request(app)
            .delete(`/api/admin/tests/${draft._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(204);
        expect(await Test.countDocuments()).toBe(0);
    });

    test('refuses to delete a published test with 404', async () => {
        const { token } = await createUser({ role: 'admin' });
        const live = await createTest({ published: true });
        const res = await request(app)
            .delete(`/api/admin/tests/${live._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(await Test.countDocuments()).toBe(1);
    });
});

describe('POST /api/admin/tests/:id/versions', () => {
    test('copies a test into a draft with the next version number', async () => {
        const { token } = await createUser({ role: 'admin' });
        const v1 = await createTest({ title: 'Versioned', version: 1, published: true });
        const res = await request(app)
            .post(`/api/admin/tests/${v1._id}/versions`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(201);
        expect(res.body.version).toBe(2);
        expect(res.body.published).toBe(false);
        expect(res.body.questions).toHaveLength(5);
    });

    test('numbers from the highest version, not the one copied', async () => {
        const { token } = await createUser({ role: 'admin' });
        const v1 = await createTest({ title: 'Versioned', version: 1 });
        await createTest({ title: 'Versioned', version: 2 });
        const res = await request(app)
            .post(`/api/admin/tests/${v1._id}/versions`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.body.version).toBe(3);
    });
});