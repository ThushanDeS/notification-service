const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { authenticate, authenticateInternal } = require('../middleware/auth');
const { validate, sendNotificationSchema } = require('../validators/notificationValidator');

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: List notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [enrollment, schedule, reminder, system, alert]
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of notifications with pagination and unread count
 */
router.get('/', authenticate, ctrl.getNotifications);

/**
 * @swagger
 * /notifications/stats:
 *   get:
 *     summary: Get notification statistics (by type, unread count)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics
 */
router.get('/stats', authenticate, ctrl.getStats);

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/read-all', authenticate, ctrl.markAllAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   get:
 *     summary: Get a notification by ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification details
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, ctrl.getNotificationById);

/**
 * @swagger
 * /notifications/send:
 *   post:
 *     summary: Send a notification (inter-service endpoint)
 *     tags: [Inter-Service]
 *     description: |
 *       Called by Course Service and Timetable Service to send notifications.
 *       Supports both JWT auth and internal API key (X-Internal-Key header).
 *       After sending, makes a delivery status callback to Course Service.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientId, type, title, message]
 *             properties:
 *               recipientId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [enrollment, schedule, reminder, system, alert]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               source:
 *                 type: object
 *                 properties:
 *                   service:
 *                     type: string
 *                   eventId:
 *                     type: string
 *               metadata:
 *                 type: object
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       201:
 *         description: Notification sent
 */
router.post('/send', authenticateInternal, validate(sendNotificationSchema), ctrl.sendNotification);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.put('/:id/read', authenticate, ctrl.markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', authenticate, ctrl.deleteNotification);

module.exports = router;
