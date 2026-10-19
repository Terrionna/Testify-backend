// Tests for validateTest, the function that checks test data sent by an admin.
const { validateTest } = require('../../src/controllers/tests');

// Returns valid test data. Each test changes one part of it.
const validBody = () => ({
    title: 'Sample Test',
    passingScore: 80,
    version: 1,
    questions: [
        { text: 'Question one?', choices: ['A', 'B'], answer: 0 }
    ]
});

describe('validateTest', () => {
    test('returns null for valid data', () => {
        expect(validateTest(validBody())).toBeNull();
    });

    test('rejects a missing title', () => {
        const body = validBody();
        body.title = '   ';
        expect(validateTest(body)).toBe('Title is required');
    });

    test('rejects a passing score above 100', () => {
        const body = validBody();
        body.passingScore = 101;
        expect(validateTest(body)).toBe('Passing score must be a number from 0 to 100');
    });

    test('rejects a version of 0', () => {
        const body = validBody();
        body.version = 0;
        expect(validateTest(body)).toBe('Version must be a whole number of 1 or more');
    });

    test('rejects a test with no questions', () => {
        const body = validBody();
        body.questions = [];
        expect(validateTest(body)).toBe('At least one question is required');
    });

    test('rejects a question with one choice', () => {
        const body = validBody();
        body.questions[0].choices = ['Only one'];
        expect(validateTest(body)).toBe('Every question needs at least two choices');
    });

    test('rejects an answer that points past the last choice', () => {
        const body = validBody();
        body.questions[0].answer = 2;
        expect(validateTest(body)).toBe('Every answer must point to one of the choices');
    });
});