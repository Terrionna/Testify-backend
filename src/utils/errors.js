// Error helper for Testify.
// Every controller sends its errors through this function.

// Sends an error response with the right status code.
const sendError = (res, err) => {
    // Invalid id.
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid id' });
    }
    // The data failed the schema rules.
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Invalid data' });
    }
    // Duplicate value on a unique field, such as an email.
    if (err.code === 11000) {
        return res.status(409).json({ message: 'That record already exists' });
    }
    // Any other error: print it in the terminal and send back 500 with "Server error".
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
};

module.exports = { sendError };