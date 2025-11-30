import rateLimit from 'express-rate-limit';

// General API rate limiter - 1000 requests per 15 minutes (very generous for production)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health', // Don't rate limit health checks
});

// Auth endpoints rate limiter - 100 requests per 15 minutes (allows validation on refresh)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many session creation attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Message posting rate limiter - 20 messages per minute
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    message: 'Slow down! You are sending messages too quickly.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
