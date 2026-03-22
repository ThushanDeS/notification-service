const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Notification Service API",
      version: "1.0.0",
      description:
        "Notification microservice for Smart Campus Services. Handles sending, listing, and managing notifications triggered by enrollment and schedule events.",
      contact: { name: "Student 4" },
    },
    servers: [
      {
        url: "https://notification-service-e8ve.onrender.com",
        description: "Production (Render) server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
