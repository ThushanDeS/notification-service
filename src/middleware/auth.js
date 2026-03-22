const jwt = require("jsonwebtoken");
const axios = require("axios");
const config = require("../config");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = { userId: decoded.userId };

      try {
        const authResponse = await axios.get(
          `${config.authService.url}/auth/validate`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          },
        );
        if (authResponse.data.valid) {
          req.user = {
            userId: authResponse.data.data.userId,
            email: authResponse.data.data.email,
            studentId: authResponse.data.data.studentId,
            role: authResponse.data.data.role,
            firstName: authResponse.data.data.firstName,
            lastName: authResponse.data.data.lastName,
          };
        }
      } catch (_authErr) {
        console.warn("Auth service unavailable, using local token data"); // eslint-disable-line no-console
      }
      next();
    } catch (jwtError) {
      const msg =
        jwtError.name === "TokenExpiredError"
          ? "Token expired."
          : "Invalid token.";
      return res.status(401).json({ success: false, message: msg });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to allow internal service-to-service calls.
 * Accepts either JWT auth or an internal API key.
 */
const authenticateInternal = async (req, res, next) => {
  const internalKey = req.headers["x-internal-key"];
  const configuredInternalApiKey = process.env.INTERNAL_API_KEY;

  // Only allow internal key auth when a key is explicitly configured
  // and the request supplies the exact same key.
  if (
    configuredInternalApiKey &&
    internalKey &&
    internalKey === configuredInternalApiKey
  ) {
    req.user = {
      role: "service",
      service: req.headers["x-service-name"] || "unknown",
    };
    return next();
  }
  return authenticate(req, res, next);
};

module.exports = { authenticate, authenticateInternal };
