const mongoose = require('mongoose');

const connect = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error('MONGO_URI is not set');
    }

    // Pass credentials explicitly in options to avoid URI parsing bugs
    await mongoose.connect(uri, {
        auth: {
            username: process.env.MONGO_USER || 'tkmcghee_db_user',
            password: process.env.MONGO_PASS || 'k6P4m9X2v7R5w8B'
        }
    });
    console.log('Connected to MongoDB');
};

const close = async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
};

module.exports = { connect, close };