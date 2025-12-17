import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { hashShadowId } from '../utils/encryption.js';

const router = express.Router();

// Generate Shadow ID (e.g., ShadowABC123)
const generateShadowId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shadowId = 'Shadow';
  for (let i = 0; i < 6; i++) {
    shadowId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return shadowId;
};

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
 * POST /api/auth/anon
 * Persistent ShadowID authentication - find or create user
 * Supports auto-login and instant restore on refresh
 */
router.post('/anon', authLimiter, async (req, res, next) => {
  try {
    const { shadowId, nickname, password } = req.body;
    let user;
    let plainShadowId; // Store the plain shadowId for response

    // If shadowId provided, try to find existing user
    if (shadowId) {
      const hashedShadowId = hashShadowId(shadowId);
      user = await User.findOne({ shadowId: hashedShadowId, isActive: true }).select('+shadowPassword');
      
      if (!user) {
        // ShadowID not found - return error
        return res.status(404).json({
          success: false,
          message: 'ShadowID not found. Please check and try again.',
        });
      }
      
      // Verify password if user has one set
      if (user.shadowPassword) {
        if (!password) {
          return res.status(401).json({
            success: false,
            message: 'Password required for this ShadowID',
            requiresPassword: true,
          });
        }
        
        const isPasswordValid = await bcryptjs.compare(password, user.shadowPassword);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: 'Invalid password',
          });
        }
      }
      
      // Update nickname if provided
      if (nickname && nickname.trim() && nickname !== user.nickname) {
        user.nickname = nickname.trim().substring(0, 20);
        await user.save();
      } else {
        // Just update last seen
        user.lastSeen = new Date();
        await user.save();
      }
      
      // Use the plain shadowId provided by user (they already know it)
      plainShadowId = shadowId;
    }
    
    // Create new user only if no shadowId was provided
    if (!user && !shadowId) {
      const newShadowId = generateShadowId();
      const anonymousId = generateAnonymousId();
      const sessionId = generateSessionId();

      // Ensure unique shadowId
      let uniqueShadowId = newShadowId;
      let attempts = 0;
      while (await User.findOne({ shadowId: hashShadowId(uniqueShadowId) }) && attempts < 10) {
        uniqueShadowId = generateShadowId();
        attempts++;
      }

      // Hash password if provided
      let hashedPassword = null;
      if (password && password.trim()) {
        hashedPassword = await bcryptjs.hash(password.trim(), 10);
      }

      user = await User.create({
        shadowId: hashShadowId(uniqueShadowId),
        nickname: nickname?.trim().substring(0, 20) || null,
        shadowPassword: hashedPassword,
        anonymousId,
        sessionId,
      });

      // Store the plain shadowId for response
      plainShadowId = uniqueShadowId;
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        shadowId: plainShadowId,
        anonymousId: user.anonymousId,
        sessionId: user.sessionId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '90d' } // 90 days for persistent sessions
    );

    res.status(user.createdAt === user.updatedAt ? 201 : 200).json({
      success: true,
      message: user.createdAt === user.updatedAt ? 'ShadowID created' : 'Welcome back',
      data: {
        token,
        user: {
          _id: user._id,
          shadowId: plainShadowId,
          nickname: user.nickname,
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
 * POST /api/auth/create-session
 * Create a new anonymous session
 */
router.post('/create-session', authLimiter, async (req, res, next) => {
  try {
    // Generate anonymous credentials
    const anonymousId = generateAnonymousId();
    const sessionId = generateSessionId();
    const shadowId = generateShadowId();

    // Create user in database with hashed shadowId
    const user = await User.create({
      shadowId: hashShadowId(shadowId),
      anonymousId,
      sessionId,
    });

    // Generate JWT token with plain shadowId
    const token = jwt.sign(
      { 
        shadowId: shadowId,
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
          _id: user._id,
          shadowId: shadowId,
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
          _id: user._id,
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

// POST /api/auth/give-reputation - Give reputation points to another user
router.post('/give-reputation', authMiddleware, async (req, res) => {
  try {
    const { userId, points, reason } = req.body;

    if (!userId || !points) {
      return res.status(400).json({
        success: false,
        message: 'User ID and points are required',
      });
    }

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot give reputation to yourself',
      });
    }

    if (points < 1 || points > 10) {
      return res.status(400).json({
        success: false,
        message: 'Points must be between 1 and 10',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update reputation
    targetUser.reputation.points += points;
    
    // Calculate level (every 100 points = 1 level)
    targetUser.reputation.level = Math.floor(targetUser.reputation.points / 100) + 1;

    // Award badges
    const badges = [
      { name: 'Newcomer', threshold: 10 },
      { name: 'Regular', threshold: 50 },
      { name: 'Veteran', threshold: 100 },
      { name: 'Legend', threshold: 500 },
      { name: 'Master', threshold: 1000 },
    ];

    for (const badge of badges) {
      if (
        targetUser.reputation.points >= badge.threshold &&
        !targetUser.reputation.badges.some(b => b.name === badge.name)
      ) {
        targetUser.reputation.badges.push({
          name: badge.name,
          earnedAt: new Date(),
        });
      }
    }

    await targetUser.save();

    res.json({
      success: true,
      message: 'Reputation given successfully',
      data: {
        user: {
          _id: targetUser._id,
          anonymousId: targetUser.anonymousId,
          reputation: targetUser.reputation,
        },
      },
    });
  } catch (error) {
    console.error('Give reputation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to give reputation',
    });
  }
});

/**
 * POST /api/auth/public-key
 * Update user's public encryption key
 */
router.post('/public-key', authMiddleware, async (req, res, next) => {
  try {
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        message: 'Public key is required',
      });
    }

    const user = await User.findOne({ anonymousId: req.user.anonymousId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.publicKey = publicKey;
    await user.save();

    res.json({
      success: true,
      message: 'Public key updated successfully',
    });
  } catch (error) {
    console.error('Public key update error:', error);
    next(error);
  }
});

/**
 * GET /api/auth/public-key/:userId
 * Get user's public encryption key
 */
router.get('/public-key/:userId', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('publicKey anonymousId');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.publicKey) {
      return res.status(404).json({
        success: false,
        message: 'User has not set up encryption yet',
      });
    }

    res.json({
      success: true,
      data: {
        publicKey: user.publicKey,
        anonymousId: user.anonymousId,
      },
    });
  } catch (error) {
    console.error('Get public key error:', error);
    next(error);
  }
});

export default router;
