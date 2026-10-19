// Tests for requireAuth and requireAdmin.
const jwt = require('jsonwebtoken');
const { requireAuth, requireAdmin } = require('../../src/middleware/auth');

const fakeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('requireAuth', () => {
    test('rejects a request with no Authorization header', () => {
        const res = fakeRes();
        const next = jest.fn();
        requireAuth({ headers: {} }, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('rejects a token signed with the wrong secret', () => {
        const res = fakeRes();
        const next = jest.fn();
        const token = jwt.sign({ role: 'taker' }, 'some-other-secret');
        requireAuth({ headers: { authorization: `Bearer ${token}` } }, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('rejects an expired token', () => {
        const res = fakeRes();
        const next = jest.fn();
        const token = jwt.sign({ role: 'taker', exp: Math.floor(Date.now() / 1000) - 3600 }, process.env.JWT_SECRET);
        requireAuth({ headers: { authorization: `Bearer ${token}` } }, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('accepts a valid token, saves it on req.auth, and continues', () => {
        const res = fakeRes();
        const next = jest.fn();
        const token = jwt.sign({ _id: 'abc', role: 'taker' }, process.env.JWT_SECRET);
        const req = { headers: { authorization: `Bearer ${token}` } };
        requireAuth(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.auth._id).toBe('abc');
    });
});

describe('requireAdmin', () => {
    test('rejects a taker with 403', () => {
        const res = fakeRes();
        const next = jest.fn();
        requireAdmin({ auth: { role: 'taker' } }, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test('lets an admin continue', () => {
        const res = fakeRes();
        const next = jest.fn();
        requireAdmin({ auth: { role: 'admin' } }, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });
});