const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: String,
            required: [true, 'Recipient ID is required'],
            index: true,
        },
        recipientEmail: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            required: [true, 'Notification type is required'],
            enum: ['enrollment', 'schedule', 'reminder', 'system', 'alert'],
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: 200,
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            maxlength: 1000,
        },
        source: {
            service: {
                type: String,
                enum: ['auth-service', 'course-service', 'timetable-service', 'notification-service'],
            },
            eventId: String,
        },
        metadata: {
            courseId: String,
            courseCode: String,
            courseName: String,
            timetableEntryId: String,
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
            default: 'pending',
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Index for efficient queries
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
