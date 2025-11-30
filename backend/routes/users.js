import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users/:userId - Get user profile
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('_id anonymousId reputation lastSeen');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
});

// POST /api/users/:userId/block - Block a user
router.post('/:userId/block', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const currentUser = await User.findById(req.user.id);
    
    // Check if already blocked
    if (currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already blocked',
      });
    }

    // Add to blocked list
    currentUser.blockedUsers.push(userId);
    await currentUser.save();

    res.json({
      success: true,
      message: 'User blocked successfully',
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block user',
    });
  }
});

// POST /api/users/:userId/unblock - Unblock a user
router.post('/:userId/unblock', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user.id);
    
    // Check if blocked
    if (!currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not blocked',
      });
    }

    // Remove from blocked list
    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (id) => id.toString() !== userId
    );
    await currentUser.save();

    res.json({
      success: true,
      message: 'User unblocked successfully',
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock user',
    });
  }
});

// GET /api/users/blocked - Get list of blocked users
router.get('/blocked/list', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id)
      .populate('blockedUsers', '_id anonymousId reputation');

    res.json({
      success: true,
      data: {
        blockedUsers: currentUser.blockedUsers,
      },
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blocked users',
    });
  }
});

export default router;
