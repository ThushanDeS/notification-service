const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const connectDB = require('./config/database');
const swaggerSpec = require('./config/swagger');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.allowedOrigins, credentials: true }));

const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/notifications', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

if (config.nodeEnv !== 'test') {
    app.use(morgan('combined'));
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        service: 'notification-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
    });
});

app.use('/notifications', notificationRoutes);

app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const startServer = async () => {
    await connectDB();
    const server = app.listen(config.port, () => {
        console.log(`Notification Service running on port ${config.port}`); // eslint-disable-line no-console
        console.log(`API Docs: http://localhost:${config.port}/api-docs`); // eslint-disable-line no-console
    });
    return server;
};

if (config.nodeEnv !== 'test') {
    startServer();
}

module.exports = { app, startServer };
