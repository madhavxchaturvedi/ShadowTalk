import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Shadow Identity System
  shadowId: {
    type: String,
    required: false, // Optional for backward compatibility with existing users
    unique: true,
    sparse: true, // Allows multiple null values
    index: true,
  },
  shadowPassword: {
    type: String, // Hashed password to protect ShadowID
    required: false,
    select: false, // Don't include in queries by default
  },
  nickname: {
    type: String,
    default: null,
    maxlength: 20,
    trim: true,
  },
  anonymousId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  // End-to-End Encryption
  publicKey: {
    type: String,
    default: null,
    // Base64 encoded RSA public key for E2E encryption
  },
  reputation: {
    points: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    badges: [{
      name: String,
      earnedAt: Date,
    }],
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark',
    },
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  joinedRooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  }],
  suspended: {
    type: Boolean,
    default: false,
  },
  suspendedAt: {
    type: Date,
  },
  suspendedReason: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for faster queries
userSchema.index({ anonymousId: 1 });
userSchema.index({ sessionId: 1 });

const User = mongoose.model('User', userSchema);

export default User;
