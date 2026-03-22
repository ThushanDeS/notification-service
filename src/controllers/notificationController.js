const axios = require('axios');
const Notification = require('../models/Notification');
const config = require('../config');

/**
 * GET /notifications
 * List notifications for the authenticated user.
 */
const getNotifications = async (req, res, next) => {
    try {
        const recipientId = req.user.studentId || req.user.userId;
        const { type, isRead, page = 1, limit = 20 } = req.query;

        const filter = { recipientId };
        if (type) { filter.type = type; }
        if (isRead !== undefined) { filter.isRead = isRead === 'true'; }

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10));

        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({ recipientId, isRead: false });

        res.status(200).json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: {
                    total,
                    page: parseInt(page, 10),
                    limit: parseInt(limit, 10),
                    pages: Math.ceil(total / parseInt(limit, 10)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /notifications/:id
 * Get a single notification by ID.
 */
const getNotificationById = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.status(200).json({ success: true, data: { notification } });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /notifications/send
 * Send a notification (called internally by Course/Timetable services).
 * This is the primary INTER-SERVICE COMMUNICATION endpoint.
 */
const sendNotification = async (req, res, next) => {
    try {
        const notification = await Notification.create({
            ...req.body,
            status: 'sent',
        });

        // Simulate delivery callback to Course Service (inter-service communication)
        if (req.body.source && req.body.source.service === 'course-service' && req.body.metadata && req.body.metadata.courseId) {
            try {
                await axios.post(
                    `${config.courseService.url}/courses/notification-status`,
                    {
                        notificationId: notification._id,
                        courseId: req.body.metadata.courseId,
                        status: 'delivered',
                        recipientId: req.body.recipientId,
                    },
                    { timeout: 5000 }
                );
                notification.status = 'delivered';
                await notification.save();
            } catch (_callbackErr) {
                // Course Service callback failed — notification still sent
                console.warn('Course Service delivery callback failed'); // eslint-disable-line no-console
            }
        }

        res.status(201).json({
            success: true,
            message: 'Notification sent successfully',
            data: { notification },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /notifications/:id/read
 * Mark a notification as read.
 */
const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true, readAt: new Date(), status: 'read' },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: { notification },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /notifications/read-all
 * Mark all notifications as read for the authenticated user.
 */
const markAllAsRead = async (req, res, next) => {
    try {
        const recipientId = req.user.studentId || req.user.userId;
        const result = await Notification.updateMany(
            { recipientId, isRead: false },
            { isRead: true, readAt: new Date(), status: 'read' }
        );

        res.status(200).json({
            success: true,
            message: `Marked ${result.modifiedCount} notifications as read`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /notifications/:id
 * Delete a notification.
 */
const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /notifications/stats
 * Get notification statistics for the user.
 */
const getStats = async (req, res, next) => {
    try {
        const recipientId = req.user.studentId || req.user.userId;

        const stats = await Notification.aggregate([
            { $match: { recipientId } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
                },
            },
        ]);

        const totalUnread = await Notification.countDocuments({ recipientId, isRead: false });
        const totalCount = await Notification.countDocuments({ recipientId });

        res.status(200).json({
            success: true,
            data: { stats, totalCount, totalUnread },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    getNotificationById,
    sendNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getStats,
};
