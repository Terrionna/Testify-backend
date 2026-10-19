// Tests for sendError, the function every controller uses to send an error.
const { sendError } = require('../../src/utils/errors');

// Builds a fake response that remembers the status and body it was given.
const fakeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('sendError', () => {
    test('sends 400 for an invalid id', () => {
        const res = fakeRes();
        sendError(res, { name: 'CastError' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid id' });
    });

    test('sends 400 for data that fails the schema rules', () => {
        const res = fakeRes();
        sendError(res, { name: 'ValidationError' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
    });

    test('sends 409 for a duplicate value', () => {
        const res = fakeRes();
        sendError(res, { code: 11000 });
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ message: 'That record already exists' });
    });

    test('sends 500 for anything else and prints the error', () => {
        const res = fakeRes();
        const spy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const err = new Error('boom');
        sendError(res, err);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
        expect(spy).toHaveBeenCalledWith(err);
        spy.mockRestore();
    });
});