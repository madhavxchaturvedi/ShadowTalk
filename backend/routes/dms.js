import express from 'express';
import PrivateMessage from '../models/PrivateMessage.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sanitizeInput } from '../utils/validators.js';
import { contentFilter } from '../middleware/contentFilter.js';
import { awardPoints } from '../utils/reputation.js';

const router = express.Router();

// GET /api/dms/conversations - Get list of DM conversations
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    // Get unique users the current user has messaged with
    const sentMessages = await PrivateMessage.find({
      sender: req.user.id,
      deletedBy: { $ne: req.user.id },
    }).distinct('receiver');

    const receivedMessages = await PrivateMessage.find({
      receiver: req.user.id,
      deletedBy: { $ne: req.user.id },
    }).distinct('sender');

    // Combine and get unique user IDs
    const userIds = [...new Set([...sentMessages, ...receivedMessages])];

    // Get user details and last message for each conversation
    const conversations = await Promise.all(
      userIds.map(async (userId) => {
        const user = await User.findById(userId).select('anonymousId reputation lastSeen');
        
        // Get last message
        const lastMessage = await PrivateMessage.findOne({
          $or: [
            { sender: req.user.id, receiver: userId },
            { sender: userId, receiver: req.user.id },
          ],
          deletedBy: { $ne: req.user.id },
        })
          .sort({ createdAt: -1 })
          .lean();

        // Count unread messages
        const unreadCount = await PrivateMessage.countDocuments({
          sender: userId,
          receiver: req.user.id,
          isRead: false,
          deletedBy: { $ne: req.user.id },
        });

        return {
          user,
          lastMessage,
          unreadCount,
        };
      })
    );

    // Sort by last message time
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || 0;
      const bTime = b.lastMessage?.createdAt || 0;
      return new Date(bTime) - new Date(aTime);
    });

    res.json({
      success: true,
      data: { conversations },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
    });
  }
});

// GET /api/dms/:userId - Get DM history with a user
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if blocked
    const currentUser = await User.findById(req.user.id);
    if (currentUser.blockedUsers.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You have blocked this user',
      });
    }

    const messages = await PrivateMessage.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
      deletedBy: { $ne: req.user.id },
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('sender', 'anonymousId reputation')
      .populate('receiver', 'anonymousId reputation')
      .lean();

    // Mark received messages as read
    await PrivateMessage.updateMany(
      {
        sender: userId,
        receiver: req.user.id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    messages.reverse();

    res.json({
      success: true,
      data: { messages },
    });
  } catch (error) {
    console.error('Get DM history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
    });
  }
});

// POST /api/dms/:userId - Send a DM
router.post('/:userId', authMiddleware, contentFilter, async (req, res) => {
  try {
    const { userId } = req.params;
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

    // Check if trying to message self
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself',
      });
    }

    // Check if blocked
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (currentUser.blockedUsers.includes(userId) || targetUser.blockedUsers.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send message to this user',
      });
    }

    // Create message
    const message = await PrivateMessage.create({
      content: sanitizeInput(content),
      sender: req.user.id,
      receiver: userId,
    });

    // Award reputation points for sending DM
    await awardPoints(req.user.id, 'dm_sent', message._id);

    await message.populate('sender', '_id anonymousId reputation');
    await message.populate('receiver', '_id anonymousId reputation');

    // Emit socket event to both sender and receiver
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    
    const messageData = { message: message.toObject() };
    
    // Send to receiver
    const receiverSocketId = userSockets.get(userId);
    if (receiverSocketId) {
      console.log(`📨 Sending DM to receiver ${userId} via socket ${receiverSocketId}`);
      io.to(receiverSocketId).emit('new_dm', messageData);
    } else {
      console.log(`⚠️  Receiver ${userId} not connected to socket`);
    }
    
    // Send to sender (for their own other tabs/devices)
    const senderSocketId = userSockets.get(req.user.id);
    if (senderSocketId) {
      console.log(`📨 Sending DM to sender ${req.user.id} via socket ${senderSocketId}`);
      io.to(senderSocketId).emit('new_dm', messageData);
    } else {
      console.log(`⚠️  Sender ${req.user.id} not connected to socket`);
    }

    res.status(201).json({
      success: true,
      data: { message },
    });
  } catch (error) {
    console.error('Send DM error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
    });
  }
});

// DELETE /api/dms/:messageId - Delete a DM (soft delete)
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await PrivateMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Only sender or receiver can delete
    if (
      message.sender.toString() !== req.user.id &&
      message.receiver.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message',
      });
    }

    // Add user to deletedBy array
    if (!message.deletedBy.includes(req.user.id)) {
      message.deletedBy.push(req.user.id);
    }

    // If both users deleted, mark as fully deleted
    if (message.deletedBy.length === 2) {
      message.isDeleted = true;
    }

    await message.save();

    res.json({
      success: true,
      message: 'Message deleted',
    });
  } catch (error) {
    console.error('Delete DM error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
    });
  }
});

export default router;
