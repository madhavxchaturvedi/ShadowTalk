import mongoose from 'mongoose';

const reputationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: ['message_posted', 'reaction_given', 'reaction_received', 'dm_sent', 'helpful_report'],
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    // Reference to message, reaction, or report
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index for efficient queries
reputationLogSchema.index({ userId: 1, createdAt: -1 });

const ReputationLog = mongoose.model('ReputationLog', reputationLogSchema);

export default ReputationLog;
