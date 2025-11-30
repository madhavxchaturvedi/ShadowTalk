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

    const reports = await Report.find(query)
      .populate('reporter', '_id anonymousId reputation')
      .populate('reportedUser', '_id anonymousId reputation')
      .populate('reportedMessage')
      .populate('reviewedBy', '_id anonymousId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

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
    const { status, moderatorNotes } = req.body;

    if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
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

export default router;
