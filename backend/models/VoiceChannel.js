import mongoose from 'mongoose';

const voiceChannelSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    anonymousId: {
      type: String,
      required: true,
    },
    socketId: {
      type: String,
      required: true,
    },
    peerId: {
      type: String,
      required: true,
    },
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
    isSpeaking: {
      type: Boolean,
      default: false,
    },
  }],
  sessionStartedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  recordingEnabled: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for fast lookups
voiceChannelSchema.index({ roomId: 1, isActive: 1 });
voiceChannelSchema.index({ 'participants.userId': 1 });

// Method to add participant
voiceChannelSchema.methods.addParticipant = function(participantData) {
  // Check if user already in channel
  const existing = this.participants.find(
    p => p.userId.toString() === participantData.userId.toString()
  );
  
  if (!existing) {
    this.participants.push(participantData);
  }
  return this.save();
};

// Method to remove participant
voiceChannelSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(
    p => p.userId.toString() !== userId.toString()
  );
  
  // Mark session as inactive if no participants
  if (this.participants.length === 0) {
    this.isActive = false;
  }
  
  return this.save();
};

// Method to update participant status
voiceChannelSchema.methods.updateParticipantStatus = function(userId, updates) {
  const participant = this.participants.find(
    p => p.userId.toString() === userId.toString()
  );
  
  if (participant) {
    Object.assign(participant, updates);
    return this.save();
  }
  return Promise.resolve(this);
};

const VoiceChannel = mongoose.model('VoiceChannel', voiceChannelSchema);

export default VoiceChannel;
