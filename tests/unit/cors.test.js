// Tests that only the frontend address is allowed to call the API from a browser.
const request = require('supertest');

describe('CORS', () => {
    beforeAll(() => {
        process.env.FRONTEND_URL = 'https://testify-frontend.example.com';
    });

    test('allows the frontend address', async () => {
        // Load the app after FRONTEND_URL is set, because app.js reads it when it loads.
        const app = require('../../app');
        const res = await request(app)
            .options('/api/login')
            .set('Origin', 'https://testify-frontend.example.com')
            .set('Access-Control-Request-Method', 'POST');
        expect(res.headers['access-control-allow-origin']).toBe('https://testify-frontend.example.com');
    });

    test('does not allow another address', async () => {
        const app = require('../../app');
        const res = await request(app)
            .options('/api/login')
            .set('Origin', 'https://some-other-site.example.com')
            .set('Access-Control-Request-Method', 'POST');
        expect(res.headers['access-control-allow-origin']).not.toBe('https://some-other-site.example.com');
        expect(res.headers['access-control-allow-origin']).not.toBe('*');
    });
});