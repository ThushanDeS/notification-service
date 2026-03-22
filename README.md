# Notification Service — Smart Campus Services

Notification microservice for the Smart Campus Services platform (CTSE Cloud Computing Assignment).

## Features

- **Send Notifications** — Triggered by Course and Timetable services
- **List & Filter** — By type, read status, with pagination
- **Mark as Read** — Individual or bulk
- **Stats Dashboard** — Notification counts by type
- **Delivery Callbacks** — Reports delivery status back to Course Service
- **Internal Auth** — Supports both JWT and API key for service-to-service calls
- **Security** — Helmet, CORS, rate limiting, input validation (Joi)

## Tech Stack

- Node.js 18 + Express
- MongoDB Atlas (Mongoose ODM)
- Axios (for inter-service communication with Auth & Course Services)
- Docker (multi-stage build, non-root user)
- GitHub Actions CI/CD
- SonarCloud + Snyk (DevSecOps)

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with MongoDB URI, JWT secret, Auth/Course Service URLs
npm run dev     # http://localhost:3004
```

### Docker

```bash
docker build -t notification-service .
docker run -p 3004:3004 --env-file .env notification-service
```

## API Endpoints

| Method | Endpoint                  | Auth    | Description                       |
| ------ | ------------------------- | ------- | --------------------------------- |
| GET    | `/notifications`          | JWT     | List notifications (filtered)     |
| GET    | `/notifications/stats`    | JWT     | Notification statistics           |
| GET    | `/notifications/:id`      | JWT     | Get by ID                         |
| POST   | `/notifications/send`     | JWT/Key | Send notification (inter-service) |
| PUT    | `/notifications/:id/read` | JWT     | Mark as read                      |
| PUT    | `/notifications/read-all` | JWT     | Mark all as read                  |
| DELETE | `/notifications/:id`      | JWT     | Delete notification               |
| GET    | `/health`                 | No      | Health check                      |

### API Documentation

Once running: http://localhost:3004/api-docs

## Production Deployment

- **Cloud Provider:** Microsoft Azure
- **Service:** Azure Container Apps (managed container orchestration)
- **Registry:** Azure Container Registry (`campusservices.azurecr.io`)
- **Live URL:** https://notification-service.redisland-b57e0bf2.eastus.azurecontainerapps.io

## CI/CD Pipeline

1. **Lint & Test** — ESLint + Jest with coverage
2. **Security Scan** — SonarCloud (SAST) + Snyk (dependency vulnerabilities)
3. **Build & Push** — Docker build → push to Azure Container Registry
4. **Deploy** — Update Azure Container App with new image

## Inter-Service Communication

1. **Auth Service**: Validates JWT tokens via `GET /auth/validate`
2. **Course Service → Notification Service**: Sends enrollment confirmation notifications via `POST /notifications/send`
3. **Timetable Service → Notification Service**: Sends schedule reminders via `POST /notifications/send`
4. **Notification Service → Course Service**: Delivery status callback after sending

## Testing

```bash
npm test
```

## License

MIT
