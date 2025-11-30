import express from 'express';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sanitizeInput } from '../utils/validators.js';
import { contentFilter } from '../middleware/contentFilter.js';

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
      .populate('sender', '_id anonymousId reputation')
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
router.post('/:roomId', authMiddleware, contentFilter, async (req, res) => {
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
    await message.populate('sender', '_id anonymousId reputation');

    // Broadcast to all room members via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('new_message', {
        ...message.toObject(),
      });
    }

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

// POST /api/messages/:messageId/react - Add or remove reaction
router.post('/:messageId/react', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required',
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Find existing reaction for this emoji
    const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);

    if (reactionIndex > -1) {
      // Reaction exists - toggle user
      const userIndex = message.reactions[reactionIndex].users.indexOf(req.user.id);
      
      if (userIndex > -1) {
        // Remove user's reaction
        message.reactions[reactionIndex].users.splice(userIndex, 1);
        // Remove reaction if no users left
        if (message.reactions[reactionIndex].users.length === 0) {
          message.reactions.splice(reactionIndex, 1);
        }
      } else {
        // Add user's reaction
        message.reactions[reactionIndex].users.push(req.user.id);
      }
    } else {
      // Create new reaction
      message.reactions.push({
        emoji,
        users: [req.user.id],
      });
    }

    await message.save();

    // Broadcast reaction update via Socket.io
    const io = req.app.get('io');
    io.to(message.room.toString()).emit('message_reacted', {
      messageId: message._id,
      reactions: message.reactions,
    });

    res.json({
      success: true,
      data: { reactions: message.reactions },
    });
  } catch (error) {
    console.error('React to message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to react to message',
    });
  }
});

// GET /api/messages/:messageId/replies - Get replies to a message
router.get('/:messageId/replies', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;

    const replies = await Message.find({
      parentMessage: messageId,
      isDeleted: false,
    })
      .sort({ createdAt: 1 })
      .populate('sender', '_id anonymousId reputation')
      .lean();

    res.json({
      success: true,
      data: { replies },
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch replies',
    });
  }
});

// POST /api/messages/:messageId/reply - Reply to a message
router.post('/:messageId/reply', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required',
      });
    }

    const parentMessage = await Message.findById(messageId);
    if (!parentMessage) {
      return res.status(404).json({
        success: false,
        message: 'Parent message not found',
      });
    }

    // Create reply
    const reply = await Message.create({
      content: sanitizeInput(content),
      sender: req.user.id,
      room: parentMessage.room,
      parentMessage: messageId,
    });

    await reply.populate('sender', '_id anonymousId reputation');

    // Broadcast new reply via Socket.io
    const io = req.app.get('io');
    io.to(parentMessage.room.toString()).emit('new_reply', {
      parentMessageId: messageId,
      reply: reply.toObject(),
    });

    res.status(201).json({
      success: true,
      data: { reply },
    });
  } catch (error) {
    console.error('Reply to message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reply to message',
    });
  }
});

export default router;
