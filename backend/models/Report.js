import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'messageType',
  },
  messageType: {
    type: String,
    enum: ['Message', 'PrivateMessage'],
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'harassment',
      'hate_speech',
      'inappropriate_content',
      'impersonation',
      'other',
    ],
  },
  description: {
    type: String,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  moderatorNotes: {
    type: String,
    maxlength: 1000,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1 });
reportSchema.index({ reporter: 1 });

export default mongoose.model('Report', reportSchema);
