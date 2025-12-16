import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
  },
  slug: {
    type: String,
    unique: true,
    index: true,
  },
  description: {
    type: String,
    maxlength: 200,
    default: '',
  },
  topic: {
    type: String,
    required: true,
    enum: [
      'General',
      'Technology',
      'Gaming',
      'Music',
      'Movies',
      'Sports',
      'Art',
      'Books',
      'Food',
      'Travel',
      'Mental Health',
      'Relationships',
      'Career',
      'Hobbies',
      'Other'
    ],
  },
  roomType: {
    type: String,
    enum: ['text', 'voice', 'both'],
    default: 'text',
  },
  voiceSettings: {
    maxParticipants: {
      type: Number,
      default: 50,
      min: 2,
      max: 100,
    },
    bitrate: {
      type: Number,
      default: 64000, // 64 kbps
      enum: [32000, 64000, 96000, 128000],
    },
    echoCancellation: {
      type: Boolean,
      default: true,
    },
    noiseSuppression: {
      type: Boolean,
      default: true,
    },
  },
  activeVoiceUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    anonymousId: String,
    socketId: String,
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    isDeafened: {
      type: Boolean,
      default: false,
    },
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  memberCount: {
    type: Number,
    default: 0,
  },
  messageCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate slug from name before validation
roomSchema.pre('validate', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + 
      '-' + 
      Math.random().toString(36).substring(2, 7);
  }
  next();
});

// Update member count before save
roomSchema.pre('save', function(next) {
  this.memberCount = this.members.length;
  next();
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
