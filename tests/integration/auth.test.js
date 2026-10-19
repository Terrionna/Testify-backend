// Tests for registering, logging in, and the token check, through the real routes.
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const db = require('../helpers/db');
const { createUser } = require('../helpers/factories');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

describe('POST /api/register', () => {
    test('creates an account and returns a token', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({ name: 'Sam', email: 'sam@example.com', password: 'password123' });
        expect(res.status).toBe(201);
        expect(res.body.token).toBeDefined();
    });

    test('ignores a role sent in the request', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({ name: 'Sam', email: 'sam@example.com', password: 'password123', role: 'admin' });
        const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
        expect(decoded.role).toBe('taker');
    });

    test('rejects a password shorter than 8 characters', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({ name: 'Sam', email: 'sam@example.com', password: 'short' });
        expect(res.status).toBe(400);
    });

    test('rejects an email that is already registered', async () => {
        await createUser({ email: 'sam@example.com' });
        const res = await request(app)
            .post('/api/register')
            .send({ name: 'Other', email: 'SAM@example.com', password: 'password123' });
        expect(res.status).toBe(409);
    });
});

describe('POST /api/login', () => {
    test('returns a token for the right email and password', async () => {
        await createUser({ email: 'sam@example.com', password: 'password123' });
        const res = await request(app)
            .post('/api/login')
            .send({ email: 'sam@example.com', password: 'password123' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    test('rejects a wrong password with 401', async () => {
        await createUser({ email: 'sam@example.com', password: 'password123' });
        const res = await request(app)
            .post('/api/login')
            .send({ email: 'sam@example.com', password: 'wrong-password' });
        expect(res.status).toBe(401);
    });

    test('gives the same message for an unknown email', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ email: 'nobody@example.com', password: 'password123' });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Incorrect email or password');
    });
});

describe('Routes that need a token', () => {
    test('GET /api/tests without a token returns 401', async () => {
        const res = await request(app).get('/api/tests');
        expect(res.status).toBe(401);
    });
});