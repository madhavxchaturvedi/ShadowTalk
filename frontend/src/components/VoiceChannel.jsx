import { useState, useEffect } from 'react';
import { 
  HiMicrophone, 
  HiPhone, 
  HiPhoneXMark,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiCog6Tooth
} from 'react-icons/hi2';
import webRTCManager from '../services/webrtc';
import { useSelector } from 'react-redux';

const VoiceChannel = ({ roomId, roomName, roomType }) => {
  const { user } = useSelector((state) => state.auth);
  const [inVoice, setInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Setup callbacks
    webRTCManager.onVoiceActivity((speaking) => {
      setIsSpeaking(speaking);
    });

    webRTCManager.onParticipantsChange(() => {
      const participantsList = webRTCManager.getParticipants();
      setParticipants(participantsList);
    });

    // Cleanup on unmount
    return () => {
      if (inVoice) {
        handleLeaveVoice();
      }
    };
  }, [inVoice]);

  const handleJoinVoice = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      await webRTCManager.joinVoiceChannel(
        roomId,
        user._id,
        user.anonymousId
      );
      setInVoice(true);
      console.log('✅ Joined voice channel');
    } catch (err) {
      console.error('❌ Failed to join voice:', err);
      setError(err.message || 'Failed to join voice channel');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveVoice = () => {
    webRTCManager.leaveVoiceChannel();
    setInVoice(false);
    setIsMuted(false);
    setIsDeafened(false);
    setParticipants([]);
    setIsSpeaking(false);
    console.log('✅ Left voice channel');
  };

  const handleToggleMute = () => {
    const muted = webRTCManager.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleDeafen = () => {
    const deafened = webRTCManager.toggleDeafen();
    setIsDeafened(deafened);
    if (deafened) {
      setIsMuted(true); // Deafening also mutes
    }
  };

  // Don't show voice controls for text-only rooms
  if (roomType === 'text') {
    return null;
  }

  return (
    <div className="voice-channel">
      {/* Header */}
      <div className="voice-header">
        <div className="voice-header-left">
          <HiSpeakerWave className="voice-icon" />
          <span className="voice-title">Voice Channel</span>
        </div>
        {roomType === 'both' && (
          <span className="voice-badge">Hybrid</span>
        )}
      </div>

      {error && (
        <div className="voice-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {!inVoice ? (
        <button
          onClick={handleJoinVoice}
          disabled={loading}
          className={`voice-join-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <HiPhone />
              <span>Join Voice</span>
            </>
          )}
        </button>
      ) : (
        <div className="voice-active">
          {/* Connected Status */}
          <div className="voice-connected">
            <div className="voice-pulse"></div>
            <span>Voice Connected</span>
          </div>

          {/* Participants */}
          <div className="voice-participants">
            <div className="voice-participants-header">
              <span className="voice-participants-label">IN CHANNEL</span>
              <span className="voice-participants-count">{participants.length + 1}</span>
            </div>
            
            <div className="voice-participants-list">
              {/* Current user */}
              <div className="voice-participant">
                <div className="voice-avatar-container">
                  <div className={`voice-avatar ${isSpeaking ? 'speaking' : ''}`}>
                    <span>{user.anonymousId.substring(0, 2).toUpperCase()}</span>
                  </div>
                  {isSpeaking && <div className="voice-speaking-ring"></div>}
                </div>
                
                <div className="voice-participant-info">
                  <span className="voice-participant-name">{user.anonymousId}</span>
                  <span className="voice-participant-tag">You</span>
                </div>

                <div className="voice-status-icons">
                  {isMuted && (
                    <div className="voice-status-icon muted">
                      <HiMicrophone />
                    </div>
                  )}
                  {isDeafened && (
                    <div className="voice-status-icon deafened">
                      <HiSpeakerXMark />
                    </div>
                  )}
                </div>
              </div>

              {/* Other participants */}
              {participants.map((socketId, index) => (
                <div key={socketId} className="voice-participant">
                  <div className="voice-avatar-container">
                    <div className="voice-avatar other">
                      <span>U{index + 1}</span>
                    </div>
                  </div>
                  <div className="voice-participant-info">
                    <span className="voice-participant-name other">Participant {index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Controls Panel */}
          <div className="voice-controls">
            <div className="voice-controls-row">
              <button
                onClick={handleToggleMute}
                className={`voice-control-btn ${isMuted ? 'active' : ''}`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <HiMicrophone />
              </button>

              <button
                onClick={handleToggleDeafen}
                className={`voice-control-btn ${isDeafened ? 'active' : ''}`}
                title={isDeafened ? 'Undeafen' : 'Deafen'}
              >
                {isDeafened ? <HiSpeakerXMark /> : <HiSpeakerWave />}
              </button>

              <button
                className="voice-control-btn"
                title="Settings"
              >
                <HiCog6Tooth />
              </button>

              <div className="voice-divider"></div>

              <button
                onClick={handleLeaveVoice}
                className="voice-leave-btn"
                title="Leave Voice"
              >
                <HiPhoneXMark />
              </button>
            </div>

            <div className="voice-privacy">
              <span className="voice-privacy-icon">🔒</span>
              <span className="voice-privacy-text">Anonymous • Encrypted</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceChannel;
