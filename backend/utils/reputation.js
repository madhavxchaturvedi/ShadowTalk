import ReputationLog from '../models/ReputationLog.js';
import User from '../models/User.js';

// Point values for different actions
const POINT_VALUES = {
  message_posted: 1,
  reaction_given: 0.5,
  reaction_received: 1,
  dm_sent: 0.5,
  helpful_report: 5,
};

// Badge thresholds (points required)
const BADGES = [
  { name: 'Newcomer', points: 0, description: 'Welcome to ShadowTalk!' },
  { name: 'Contributor', points: 50, description: 'Posted 50 messages' },
  { name: 'Active Member', points: 100, description: 'Earned 100 points' },
  { name: 'Veteran', points: 250, description: 'Earned 250 points' },
  { name: 'Elite', points: 500, description: 'Earned 500 points' },
  { name: 'Legend', points: 1000, description: 'Earned 1000 points' },
];

/**
 * Award reputation points to a user
 * @param {String} userId - User's MongoDB ID
 * @param {String} action - Action type (message_posted, reaction_given, etc.)
 * @param {String} relatedId - Optional ID of related entity (message, reaction, etc.)
 */
export const awardPoints = async (userId, action, relatedId = null) => {
  try {
    const points = POINT_VALUES[action];
    
    if (!points) {
      console.error(`Unknown action: ${action}`);
      return;
    }

    // Create reputation log entry
    await ReputationLog.create({
      userId,
      action,
      points,
      relatedId,
    });

    // Calculate total points
    const totalPoints = await ReputationLog.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: null, total: { $sum: '$points' } } },
    ]);

    const userPoints = totalPoints[0]?.total || 0;
    
    // Calculate level (every 50 points = 1 level)
    const level = Math.floor(userPoints / 50) + 1;

    // Determine badges earned
    const earnedBadges = BADGES.filter(badge => userPoints >= badge.points).map(badge => ({
      name: badge.name,
      earnedAt: new Date(),
    }));

    // Update user
    await User.findByIdAndUpdate(userId, {
      'reputation.points': userPoints,
      'reputation.level': level,
      'reputation.badges': earnedBadges,
    });

    console.log(`✅ Awarded ${points} points to user ${userId} for ${action}. Total: ${userPoints}`);
    
    return { points: userPoints, level, badges: earnedBadges };
  } catch (error) {
    console.error('Error awarding points:', error);
  }
};

/**
 * Get user reputation summary
 */
export const getReputationSummary = async (userId) => {
  try {
    const user = await User.findById(userId).select('reputation anonymousId');
    
    if (!user) {
      return null;
    }

    // Get recent activity
    const recentActivity = await ReputationLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      anonymousId: user.anonymousId,
      points: user.reputation.points,
      level: user.reputation.level,
      badges: user.reputation.badges,
      recentActivity,
    };
  } catch (error) {
    console.error('Error getting reputation summary:', error);
    return null;
  }
};

/**
 * Get leaderboard (top users by points)
 */
export const getLeaderboard = async (limit = 10) => {
  try {
    const topUsers = await User.find()
      .sort({ 'reputation.points': -1 })
      .limit(limit)
      .select('anonymousId reputation')
      .lean();

    return topUsers;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
};

export { BADGES };
