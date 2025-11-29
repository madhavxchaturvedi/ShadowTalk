import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Generate random anonymous ID
const generateAnonymousId = () => {
  const randomString = Math.random().toString(36).substring(2, 11);
  return `Shadow${randomString}`;
};

// Generate random session ID
const generateSessionId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * POST /api/auth/create-session
 * Create a new anonymous session
 */
router.post('/create-session', authLimiter, async (req, res, next) => {
  try {
    // Generate anonymous credentials
    const anonymousId = generateAnonymousId();
    const sessionId = generateSessionId();

    // Create user in database
    const user = await User.create({
      anonymousId,
      sessionId,
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        anonymousId: user.anonymousId,
        sessionId: user.sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Token valid for 30 days
    );

    res.status(201).json({
      success: true,
      message: 'Anonymous session created successfully',
      data: {
        token,
        user: {
          anonymousId: user.anonymousId,
          reputation: user.reputation,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/join-session
 * Rejoin existing session with token
 */
router.post('/join-session', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findOne({
      anonymousId: decoded.anonymousId,
      sessionId: decoded.sessionId,
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired',
      });
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Session rejoined successfully',
      data: {
        user: {
          anonymousId: user.anonymousId,
          reputation: user.reputation,
          createdAt: user.createdAt,
          lastSeen: user.lastSeen,
        },
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
    next(error);
  }
});

export default router;
