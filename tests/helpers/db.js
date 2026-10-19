// Starts a throwaway MongoDB in memory for a test file, so tests never touch Atlas.
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let server;

// Starts the test database and connects to it. Call once in beforeAll.
const connect = async () => {
    server = await MongoMemoryServer.create();
    await mongoose.connect(server.getUri());
    // Wait for the unique indexes to exist, so duplicate checks behave like production.
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
};

// Empties every collection. Call in afterEach so each test starts clean.
const clear = async () => {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

// Disconnects and stops the test database. Call once in afterAll.
const close = async () => {
    await mongoose.disconnect();
    await server.stop();
};

module.exports = { connect, clear, close };