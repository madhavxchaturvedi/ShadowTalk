import express from 'express';
import Report from '../models/Report.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Submit a report
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { reportedUser, reportedMessage, messageType, reason, description } = req.body;

    // Validation
    if (!reportedUser) {
      return res.status(400).json({ error: 'Reported user is required' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    // Prevent self-reporting
    if (reportedUser === req.user.id) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    // Create report
    const report = new Report({
      reporter: req.user.id,
      reportedUser,
      reportedMessage: reportedMessage || undefined,
      messageType: messageType || undefined,
      reason,
      description: description || '',
    });

    await report.save();

    res.status(201).json({
      message: 'Report submitted successfully',
      reportId: report._id,
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Get all reports (for moderators)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;

    const query = status ? { status } : {};

    let reports = await Report.find(query)
      .populate('reporter', '_id anonymousId reputation')
      .populate('reportedUser', '_id anonymousId reputation suspended suspendedAt suspendedReason')
      .populate('reviewedBy', '_id anonymousId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean(); // Convert to plain JS objects

    // Manually populate reportedMessage with sender based on messageType
    for (let report of reports) {
      if (report.reportedMessage && report.messageType) {
        const Model = report.messageType === 'Message' 
          ? (await import('../models/Message.js')).default
          : (await import('../models/PrivateMessage.js')).default;
        
        report.reportedMessage = await Model.findById(report.reportedMessage)
          .populate('sender', '_id anonymousId nickname')
          .lean();
      }
    }

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      total,
      hasMore: total > parseInt(skip) + reports.length,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get user's submitted reports
router.get('/my-reports', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user.id })
      .populate('reportedUser', '_id anonymousId')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Failed to fetch your reports' });
  }
});

// Update report status (for moderators)
router.patch('/:reportId', authMiddleware, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, action, moderatorNotes } = req.body;

    if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // If action is 'delete', handle based on report type
    if (action === 'delete') {
      if (report.reportedMessage && report.messageType) {
        // Delete the reported message
        const Model = report.messageType === 'Message' 
          ? (await import('../models/Message.js')).default
          : (await import('../models/PrivateMessage.js')).default;
        
        await Model.findByIdAndDelete(report.reportedMessage);
      } else {
        // User-only report: suspend the user
        const User = (await import('../models/User.js')).default;
        await User.findByIdAndUpdate(report.reportedUser._id || report.reportedUser, {
          suspended: true,
          suspendedAt: new Date(),
          suspendedReason: report.reason
        });
      }
    }

    report.status = status;
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();
    if (moderatorNotes) {
      report.moderatorNotes = moderatorNotes;
    }

    await report.save();

    res.json({
      message: 'Report updated successfully',
      report,
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Unsuspend user (for moderators)
router.post('/unsuspend/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const User = (await import('../models/User.js')).default;
    const user = await User.findByIdAndUpdate(
      userId,
      {
        suspended: false,
        $unset: { suspendedAt: '', suspendedReason: '' }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User unsuspended successfully',
      user: {
        _id: user._id,
        anonymousId: user.anonymousId,
        suspended: user.suspended
      }
    });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    res.status(500).json({ error: 'Failed to unsuspend user' });
  }
});

export default router;
