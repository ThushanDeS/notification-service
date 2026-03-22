const errorHandler = (err, _req, res, _next) => {
    console.error('Error:', err.message); // eslint-disable-line no-console

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    }
    if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'Duplicate notification entry.' });
    }
    res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal Server Error' });
};

module.exports = errorHandler;
