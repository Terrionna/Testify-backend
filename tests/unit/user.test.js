// Tests for the password and token methods on the user model. No database is needed.
const jwt = require('jsonwebtoken');
const User = require('../../src/models/user');

describe('User password methods', () => {
    test('accepts the password that was set', () => {
        const user = new User({ name: 'Sam', email: 'sam@example.com' });
        user.setPassword('correct-password');
        expect(user.validPassword('correct-password')).toBe(true);
    });

    test('rejects a different password', () => {
        const user = new User({ name: 'Sam', email: 'sam@example.com' });
        user.setPassword('correct-password');
        expect(user.validPassword('wrong-password')).toBe(false);
    });

    test('never saves the password itself', () => {
        const user = new User({ name: 'Sam', email: 'sam@example.com' });
        user.setPassword('correct-password');
        expect(user.hash).not.toContain('correct-password');
        expect(user.salt).toHaveLength(32);
    });

    test('gives two users with the same password different hashes', () => {
        const a = new User({ name: 'A', email: 'a@example.com' });
        const b = new User({ name: 'B', email: 'b@example.com' });
        a.setPassword('same-password');
        b.setPassword('same-password');
        expect(a.hash).not.toBe(b.hash);
    });
});

describe('User generateJwt', () => {
    test('puts the id, email, name, and role in the token', () => {
        const user = new User({ name: 'Sam', email: 'Sam@Example.com' });
        const decoded = jwt.verify(user.generateJwt(), process.env.JWT_SECRET);
        expect(decoded._id).toBe(String(user._id));
        expect(decoded.email).toBe('sam@example.com');
        expect(decoded.name).toBe('Sam');
        expect(decoded.role).toBe('taker');
    });

    test('sets the expiry about seven days out', () => {
        const user = new User({ name: 'Sam', email: 'sam@example.com' });
        const decoded = jwt.verify(user.generateJwt(), process.env.JWT_SECRET);
        const days = (decoded.exp - Date.now() / 1000) / 86400;
        expect(days).toBeGreaterThan(6.9);
        expect(days).toBeLessThan(7.1);
    });
});