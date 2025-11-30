import mongoose from 'mongoose';

const privateMessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Indexes for faster queries
privateMessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
privateMessageSchema.index({ receiver: 1, isRead: 1 });

const PrivateMessage = mongoose.model('PrivateMessage', privateMessageSchema);

export default PrivateMessage;
