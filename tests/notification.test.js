const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { app } = require('../src/app');
const Notification = require('../src/models/Notification');
const config = require('../src/config');

jest.mock('../src/config/database', () => jest.fn());
jest.mock('axios');
const axios = require('axios');

const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let authToken;
const testUserId = new mongoose.Types.ObjectId().toString();

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    authToken = jwt.sign({ userId: testUserId }, config.jwt.secret, { expiresIn: '1h' });

    axios.get.mockResolvedValue({
        data: {
            valid: true,
            data: {
                userId: testUserId,
                email: 'john@campus.edu',
                studentId: 'IT20123456',
                role: 'student',
                firstName: 'John',
                lastName: 'Doe',
            },
        },
    });

    axios.post.mockResolvedValue({ data: { success: true } });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Notification.deleteMany({});
});

const sampleNotification = {
    recipientId: 'IT20123456',
    recipientEmail: 'john@campus.edu',
    type: 'enrollment',
    title: 'Course Enrollment Confirmed',
    message: 'You have been enrolled in SE4010 - Current Trends in SE',
    source: { service: 'course-service', eventId: 'evt-001' },
    metadata: { courseId: 'c1', courseCode: 'SE4010', courseName: 'Current Trends in SE' },
    priority: 'medium',
};

describe('Notification Service API', () => {
    describe('GET /health', () => {
        it('should return health status', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.service).toBe('notification-service');
        });
    });

    describe('POST /notifications/send', () => {
        it('should send a notification', async () => {
            const res = await request(app)
                .post('/notifications/send')
                .set('Authorization', `Bearer ${authToken}`)
                .send(sampleNotification);
            expect(res.status).toBe(201);
            expect(res.body.data.notification.title).toBe('Course Enrollment Confirmed');
            expect(res.body.data.notification.status).toBe('delivered');
        });

        it('should return 400 for missing fields', async () => {
            const res = await request(app)
                .post('/notifications/send')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Incomplete' });
            expect(res.status).toBe(400);
        });

        it('should return 401 without auth', async () => {
            const res = await request(app).post('/notifications/send').send(sampleNotification);
            expect(res.status).toBe(401);
        });
    });

    describe('GET /notifications', () => {
        beforeEach(async () => {
            await Notification.create({
                ...sampleNotification,
                status: 'sent',
            });
            await Notification.create({
                ...sampleNotification,
                type: 'schedule',
                title: 'Schedule Reminder',
                message: 'You have a class tomorrow',
                isRead: true,
                status: 'read',
            });
        });

        it('should list notifications', async () => {
            const res = await request(app)
                .get('/notifications')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.notifications.length).toBe(2);
            expect(res.body.data.unreadCount).toBe(1);
        });

        it('should filter by type', async () => {
            const res = await request(app)
                .get('/notifications?type=enrollment')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.notifications.length).toBe(1);
        });

        it('should filter by read status', async () => {
            const res = await request(app)
                .get('/notifications?isRead=false')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.notifications.length).toBe(1);
        });
    });

    describe('PUT /notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            const notif = await Notification.create({ ...sampleNotification, status: 'sent' });
            const res = await request(app)
                .put(`/notifications/${notif._id}/read`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.notification.isRead).toBe(true);
        });
    });

    describe('PUT /notifications/read-all', () => {
        it('should mark all as read', async () => {
            await Notification.create({ ...sampleNotification, status: 'sent' });
            await Notification.create({ ...sampleNotification, title: 'Another', status: 'sent' });
            const res = await request(app)
                .put('/notifications/read-all')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.message).toContain('2');
        });
    });

    describe('GET /notifications/stats', () => {
        it('should return notification stats', async () => {
            await Notification.create({ ...sampleNotification, status: 'sent' });
            const res = await request(app)
                .get('/notifications/stats')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.totalCount).toBe(1);
        });
    });

    describe('DELETE /notifications/:id', () => {
        it('should delete a notification', async () => {
            const notif = await Notification.create({ ...sampleNotification, status: 'sent' });
            const res = await request(app)
                .delete(`/notifications/${notif._id}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
        });
    });

    describe('404', () => {
        it('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/unknown');
            expect(res.status).toBe(404);
        });
    });
});
