import express from 'express';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sanitizeInput } from '../utils/validators.js';

const router = express.Router();

// GET /api/messages/:roomId - Get messages for a room with pagination
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is member of the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    if (!room.members.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member to view messages',
      });
    }

    // Get messages with pagination
    const messages = await Message.find({
      room: roomId,
      isDeleted: false,
      parentMessage: null, // Only get top-level messages (not replies)
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('sender', 'anonymousId reputation')
      .lean();

    // Reverse to show oldest first
    messages.reverse();

    const totalMessages = await Message.countDocuments({
      room: roomId,
      isDeleted: false,
      parentMessage: null,
    });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalMessages,
          pages: Math.ceil(totalMessages / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
    });
  }
});

// POST /api/messages/:roomId - Send a message (for fallback when Socket.io unavailable)
router.post('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long (max 2000 characters)',
      });
    }

    // Check if user is member of the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    if (!room.members.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member to send messages',
      });
    }

    // Create message
    const message = await Message.create({
      content: sanitizeInput(content),
      sender: req.user.id,
      room: roomId,
    });

    // Update room's last activity and message count
    await Room.findByIdAndUpdate(roomId, {
      lastActivity: new Date(),
      $inc: { messageCount: 1 },
    });

    // Populate sender info
    await message.populate('sender', 'anonymousId reputation');

    res.status(201).json({
      success: true,
      data: { message },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
    });
  }
});

export default router;
