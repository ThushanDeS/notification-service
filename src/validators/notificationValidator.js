const Joi = require('joi');

const sendNotificationSchema = Joi.object({
    recipientId: Joi.string().required(),
    recipientEmail: Joi.string().email().allow(''),
    type: Joi.string().valid('enrollment', 'schedule', 'reminder', 'system', 'alert').required(),
    title: Joi.string().trim().max(200).required(),
    message: Joi.string().trim().max(1000).required(),
    source: Joi.object({
        service: Joi.string().valid('auth-service', 'course-service', 'timetable-service', 'notification-service'),
        eventId: Joi.string(),
    }),
    metadata: Joi.object({
        courseId: Joi.string(),
        courseCode: Joi.string(),
        courseName: Joi.string(),
        timetableEntryId: Joi.string(),
    }),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
});

const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: error.details.map((d) => d.message),
        });
    }
    req.body = value;
    next();
};

module.exports = { sendNotificationSchema, validate };
