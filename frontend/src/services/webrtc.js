import socket from './socket';

// ICE servers configuration (STUN servers for NAT traversal)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

class WebRTCManager {
  constructor() {
    this.peerConnections = new Map(); // socketId -> RTCPeerConnection
    this.localStream = null;
    this.remoteStreams = new Map(); // socketId -> MediaStream
    this.roomId = null;
    this.userId = null;
    this.anonymousId = null;
    this.peerId = null;
    this.isMuted = false;
    this.isDeafened = false;
    this.voiceActivityCallback = null;
    this.participantsChangeCallback = null;
  }

  // Initialize local audio stream
  async initializeLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      console.log('✅ Local audio stream initialized');
      this.startVoiceActivityDetection();
      return this.localStream;
    } catch (error) {
      console.error('❌ Failed to get local stream:', error);
      throw new Error('Microphone access denied. Please enable microphone permissions.');
    }
  }

  // Join voice channel
  async joinVoiceChannel(roomId, userId, anonymousId) {
    this.roomId = roomId;
    this.userId = userId;
    this.anonymousId = anonymousId;
    this.peerId = `${userId}_${Date.now()}`;

    // Initialize local stream
    await this.initializeLocalStream();

    // Setup socket listeners
    this.setupSocketListeners();

    // Emit join event
    socket.emit('voice:join', {
      roomId,
      userId,
      anonymousId,
      peerId: this.peerId,
    });

    console.log(`🎤 Joining voice channel in room ${roomId}`);
  }

  // Leave voice channel
  leaveVoiceChannel() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((pc, socketId) => {
      pc.close();
    });
    this.peerConnections.clear();
    this.remoteStreams.clear();

    // Emit leave event
    if (this.roomId) {
      socket.emit('voice:leave', {
        roomId: this.roomId,
        userId: this.userId,
        anonymousId: this.anonymousId,
      });
    }

    // Remove socket listeners
    socket.off('voice:participants');
    socket.off('voice:user_joined');
    socket.off('voice:user_left');
    socket.off('webrtc:offer');
    socket.off('webrtc:answer');
    socket.off('ice:candidate');

    console.log('🎤 Left voice channel');
  }

  // Setup socket event listeners
  setupSocketListeners() {
    // Receive list of existing participants
    socket.on('voice:participants', (participants) => {
      console.log('👥 Received participants:', participants);
      participants.forEach(participant => {
        this.createPeerConnection(participant.socketId, participant.anonymousId, true);
      });
    });

    // New user joined voice channel
    socket.on('voice:user_joined', (data) => {
      console.log('👤 User joined voice:', data.anonymousId);
      this.createPeerConnection(data.socketId, data.anonymousId, false);
      
      if (this.participantsChangeCallback) {
        this.participantsChangeCallback();
      }
    });

    // User left voice channel
    socket.on('voice:user_left', (data) => {
      console.log('👋 User left voice:', data.anonymousId);
      this.closePeerConnection(data.socketId);
      
      if (this.participantsChangeCallback) {
        this.participantsChangeCallback();
      }
    });

    // Receive WebRTC offer
    socket.on('webrtc:offer', async (data) => {
      console.log('📞 Received offer from:', data.from);
      await this.handleOffer(data.fromSocketId, data.offer, data.from);
    });

    // Receive WebRTC answer
    socket.on('webrtc:answer', async (data) => {
      console.log('📞 Received answer from:', data.from);
      await this.handleAnswer(data.fromSocketId, data.answer);
    });

    // Receive ICE candidate
    socket.on('ice:candidate', async (data) => {
      await this.handleIceCandidate(data.fromSocketId, data.candidate);
    });

    // User status changed
    socket.on('voice:user_status_changed', (data) => {
      console.log('🔇 User status changed:', data);
      // You can emit this to UI to show mute/deafen status
    });

    // User speaking
    socket.on('voice:user_speaking', (data) => {
      console.log('🎤 User speaking:', data.anonymousId);
      // Emit to UI to show speaking indicator
    });

    socket.on('voice:user_stopped_speaking', (data) => {
      // Emit to UI to hide speaking indicator
    });
  }

  // Create peer connection
  async createPeerConnection(socketId, anonymousId, initiator) {
    if (this.peerConnections.has(socketId)) {
      console.log('⚠️ Peer connection already exists for:', socketId);
      return;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(socketId, pc);

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('🎵 Received remote track from:', anonymousId);
      const remoteStream = event.streams[0];
      this.remoteStreams.set(socketId, remoteStream);
      
      // Play remote audio (unless deafened)
      if (!this.isDeafened) {
        this.playRemoteStream(socketId, remoteStream);
      }
      
      if (this.participantsChangeCallback) {
        this.participantsChangeCallback();
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice:candidate', {
          targetSocketId: socketId,
          candidate: event.candidate,
          from: this.anonymousId,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`📡 Connection state with ${anonymousId}:`, pc.connectionState);
      
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Attempt reconnection
        console.log('⚠️ Connection failed, cleaning up...');
        this.closePeerConnection(socketId);
      }
    };

    // If initiator, create and send offer
    if (initiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socket.emit('webrtc:offer', {
          roomId: this.roomId,
          targetSocketId: socketId,
          offer,
          from: this.anonymousId,
        });
        
        console.log('📤 Sent offer to:', socketId);
      } catch (error) {
        console.error('❌ Error creating offer:', error);
      }
    }
  }

  // Handle incoming offer
  async handleOffer(socketId, offer, fromAnonymousId) {
    let pc = this.peerConnections.get(socketId);
    
    if (!pc) {
      await this.createPeerConnection(socketId, fromAnonymousId, false);
      pc = this.peerConnections.get(socketId);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('webrtc:answer', {
        targetSocketId: socketId,
        answer,
        from: this.anonymousId,
      });
      
      console.log('📤 Sent answer to:', socketId);
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  }

  // Handle incoming answer
  async handleAnswer(socketId, answer) {
    const pc = this.peerConnections.get(socketId);
    
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('✅ Set remote description (answer) for:', socketId);
      } catch (error) {
        console.error('❌ Error handling answer:', error);
      }
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(socketId, candidate) {
    const pc = this.peerConnections.get(socketId);
    
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    }
  }

  // Close peer connection
  closePeerConnection(socketId) {
    const pc = this.peerConnections.get(socketId);
    
    if (pc) {
      pc.close();
      this.peerConnections.delete(socketId);
    }

    // Stop remote stream
    const remoteStream = this.remoteStreams.get(socketId);
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStreams.delete(socketId);
    }

    // Remove audio element
    const audioElement = document.getElementById(`audio-${socketId}`);
    if (audioElement) {
      audioElement.remove();
    }
  }

  // Play remote audio stream
  playRemoteStream(socketId, stream) {
    // Create audio element
    let audioElement = document.getElementById(`audio-${socketId}`);
    
    if (!audioElement) {
      audioElement = document.createElement('audio');
      audioElement.id = `audio-${socketId}`;
      audioElement.autoplay = true;
      document.body.appendChild(audioElement);
    }

    audioElement.srcObject = stream;
  }

  // Toggle mute
  toggleMute() {
    if (this.localStream) {
      this.isMuted = !this.isMuted;
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isMuted;
      });

      // Notify server
      socket.emit('voice:update_status', {
        roomId: this.roomId,
        userId: this.userId,
        isMuted: this.isMuted,
        isDeafened: this.isDeafened,
      });

      console.log(`🔇 Muted: ${this.isMuted}`);
    }
    return this.isMuted;
  }

  // Toggle deafen
  toggleDeafen() {
    this.isDeafened = !this.isDeafened;

    // Mute all remote audio elements
    this.remoteStreams.forEach((stream, socketId) => {
      const audioElement = document.getElementById(`audio-${socketId}`);
      if (audioElement) {
        audioElement.volume = this.isDeafened ? 0 : 1;
      }
    });

    // If deafened, also mute self
    if (this.isDeafened && !this.isMuted) {
      this.toggleMute();
    }

    // Notify server
    socket.emit('voice:update_status', {
      roomId: this.roomId,
      userId: this.userId,
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
    });

    console.log(`🔇 Deafened: ${this.isDeafened}`);
    return this.isDeafened;
  }

  // Voice activity detection
  startVoiceActivityDetection() {
    if (!this.localStream) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(this.localStream);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    microphone.connect(analyser);
    analyser.fftSize = 512;

    let isSpeaking = false;
    const SPEAKING_THRESHOLD = 20; // Adjust based on testing

    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

      if (average > SPEAKING_THRESHOLD && !isSpeaking) {
        isSpeaking = true;
        socket.emit('voice:speaking', {
          roomId: this.roomId,
          userId: this.userId,
          anonymousId: this.anonymousId,
        });
        
        if (this.voiceActivityCallback) {
          this.voiceActivityCallback(true);
        }
      } else if (average <= SPEAKING_THRESHOLD && isSpeaking) {
        isSpeaking = false;
        socket.emit('voice:stopped_speaking', {
          roomId: this.roomId,
          userId: this.userId,
        });
        
        if (this.voiceActivityCallback) {
          this.voiceActivityCallback(false);
        }
      }

      if (this.localStream) {
        requestAnimationFrame(checkAudioLevel);
      }
    };

    checkAudioLevel();
  }

  // Get participants
  getParticipants() {
    return Array.from(this.peerConnections.keys());
  }

  // Set voice activity callback
  onVoiceActivity(callback) {
    this.voiceActivityCallback = callback;
  }

  // Set participants change callback
  onParticipantsChange(callback) {
    this.participantsChangeCallback = callback;
  }
}

// Export singleton instance
export const webRTCManager = new WebRTCManager();
export default webRTCManager;
