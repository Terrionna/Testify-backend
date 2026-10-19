// Entry point for the Testify API.
// This file builds the Express app, connects to MongoDB, and starts listening.
const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');
const routes = require('./src/routes');

const app = express();

// Only the frontend address in FRONTEND_URL may call the API from a browser.
// With no FRONTEND_URL set, no other site is allowed.
app.use(cors({ origin: process.env.FRONTEND_URL || false }));

// Read JSON sent in a request body.
app.use(express.json());

// Send every URL that starts with /api to the router.
app.use('/api', routes);

// Use the port from the environment, or 3000 when none is set.
const port = process.env.PORT || 3000;

// Connects to the database first, then starts listening for requests.
const start = async () => {
    try {
        await db.connect();
        const server = app.listen(port, () => {
            console.log(`API listening on port ${port}`);
        });

        // Closes the server and the database connection.
        const shutdown = async () => {
            server.close();
            await db.close();
            process.exit(0);
        };

        // Run the shutdown when Ctrl and C is pressed.
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    } catch (err) {
        // Report why startup failed and exit.
        console.error('Startup failed:', err.message);
        process.exit(1);
    }
};

// Start the server only when this file is run directly.
if (require.main === module) {
    start();
}

module.exports = app;