import express from 'express';
import Room from '../models/Room.js';
import User from '../models/User.js';
import migrateShadowIds from '../utils/migrateShadowIds.js';

const router = express.Router();

// POST /api/migrate/shadow-ids - Add shadowId to existing users
router.post('/shadow-ids', async (req, res) => {
  try {
    await migrateShadowIds();
    
    res.json({
      success: true,
      message: 'ShadowID migration completed successfully',
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to migrate ShadowIDs',
      error: error.message,
    });
  }
});

// POST /api/migrate/sync-room-members - Sync user joinedRooms from room members
router.post('/sync-room-members', async (req, res) => {
  try {
    // Get all rooms
    const rooms = await Room.find({});
    
    let usersUpdated = 0;
    
    // For each room, sync its members
    for (const room of rooms) {
      for (const userId of room.members) {
        // Add room to user's joinedRooms if not already there
        await User.findByIdAndUpdate(
          userId,
          { $addToSet: { joinedRooms: room._id } }
        );
        usersUpdated++;
      }
    }
    
    res.json({
      success: true,
      message: 'Room memberships synced successfully',
      data: {
        roomsProcessed: rooms.length,
        usersUpdated,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync room memberships',
      error: error.message,
    });
  }
});

export default router;
