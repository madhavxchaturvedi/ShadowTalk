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
