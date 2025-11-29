import express from 'express';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateRoomName, sanitizeInput } from '../utils/validators.js';

const router = express.Router();

// GET /api/rooms - Get all rooms with optional filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { topic, search, sort = 'trending' } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (topic && topic !== 'all') {
      query.topic = topic;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'trending':
        sortOption = { lastActivity: -1, memberCount: -1 };
        break;
      case 'popular':
        sortOption = { memberCount: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'active':
        sortOption = { messageCount: -1 };
        break;
      default:
        sortOption = { lastActivity: -1 };
    }

    const rooms = await Room.find(query)
      .sort(sortOption)
      .limit(50)
      .select('-members'); // Don't send full member list

    res.json({
      success: true,
      data: {
        rooms,
        count: rooms.length,
      },
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
    });
  }
});

// GET /api/rooms/my/joined - Get user's joined rooms (MUST be before /:id routes)
router.get('/my/joined', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('joinedRooms');

    res.json({
      success: true,
      data: {
        rooms: user.joinedRooms || [],
      },
    });
  } catch (error) {
    console.error('Get joined rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch joined rooms',
    });
  }
});

// GET /api/rooms/:id - Get single room details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if user is a member
    const isMember = room.members.some(
      memberId => memberId.toString() === req.user.id.toString()
    );

    res.json({
      success: true,
      data: {
        room,
        isMember,
      },
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room',
    });
  }
});

// POST /api/rooms - Create new room
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, topic } = req.body;

    // Validate name
    const nameValidation = validateRoomName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: nameValidation.message,
      });
    }

    // Validate topic
    const validTopics = [
      'General', 'Technology', 'Gaming', 'Music', 'Movies', 
      'Sports', 'Art', 'Books', 'Food', 'Travel', 
      'Mental Health', 'Relationships', 'Career', 'Hobbies', 'Other'
    ];
    
    if (!topic || !validTopics.includes(topic)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid topic selected',
      });
    }

    // Create room
    const room = await Room.create({
      name: sanitizeInput(name),
      description: sanitizeInput(description || ''),
      topic,
      createdBy: req.user.id,
      members: [req.user.id], // Creator auto-joins
    });

    // Add room to user's joined rooms
    await User.findByIdAndUpdate(req.user.id, {
      $push: { joinedRooms: room._id },
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: { room },
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room',
    });
  }
});

// POST /api/rooms/:id/join - Join a room
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if already a member
    if (room.members.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this room',
      });
    }

    // Add user to room
    room.members.push(req.user.id);
    await room.save();

    // Add room to user's joined rooms
    await User.findByIdAndUpdate(req.user.id, {
      $push: { joinedRooms: room._id },
    });

    res.json({
      success: true,
      message: 'Joined room successfully',
      data: { room },
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room',
    });
  }
});

// POST /api/rooms/:id/leave - Leave a room
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if member
    if (!room.members.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Not a member of this room',
      });
    }

    // Remove user from room
    room.members = room.members.filter(
      memberId => memberId.toString() !== req.user.id.toString()
    );
    await room.save();

    // Remove room from user's joined rooms
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { joinedRooms: room._id },
    });

    res.json({
      success: true,
      message: 'Left room successfully',
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave room',
    });
  }
});

export default router;
