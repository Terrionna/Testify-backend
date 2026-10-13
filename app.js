// Entry point for the Testify API.
// This file builds the Express app, connects to MongoDB, and starts listening.
const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');
const routes = require('./src/routes');

const app = express();

// Only the frontend's own address may call this API from a browser.
// In development that is http://localhost:4200. Once the frontend is live, its real address goes here too.
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:4200';
app.use(cors({ origin: allowedOrigin }));

app.use(express.json());
app.use('/api', routes);

const port = process.env.PORT || 3000;

const start = async () => {
    try {
        await db.connect();
        const server = app.listen(port, () => {
            console.log(`API listening on port ${port}`);
        });

        const shutdown = async () => {
            server.close();
            await db.close();
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    } catch (err) {
        console.error('Startup failed:', err.message);
        process.exit(1);
    }
};

if (require.main === module) {
    start();
}

module.exports = app;