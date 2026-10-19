// Small functions that put test data in the database, so each test file stays short.
const User = require('../../src/models/user');
const Test = require('../../src/models/test');

// Creates a user and returns it with a working token.
const createUser = async ({ name = 'Sam', email = 'sam@example.com', password = 'password123', role = 'taker' } = {}) => {
    const user = new User({ name, email, role });
    user.setPassword(password);
    await user.save();
    return { user, token: user.generateJwt() };
};

// Creates a test with 5 questions. Choice 0 is the correct answer for every question.
const createTest = async ({ title = 'Sample Test', version = 1, passingScore = 80, published = true } = {}) => {
    const questions = [1, 2, 3, 4, 5].map((n) => ({
        text: `Question ${n}?`,
        choices: ['Right', 'Wrong'],
        answer: 0
    }));
    return Test.create({ title, version, passingScore, published, questions });
};

module.exports = { createUser, createTest };