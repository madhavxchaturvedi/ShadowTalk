import { useState, useEffect } from 'react';
import { Mic, MicOff, Headphones, Phone, PhoneOff, Volume2, VolumeX, Settings } from 'lucide-react';
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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <Volume2 size={20} style={{ color: '#23a55a' }} />
          <span style={styles.titleText}>Voice Channel</span>
        </div>
        {roomType === 'both' && (
          <span style={styles.badge}>Hybrid</span>
        )}
      </div>

      {error && (
        <div style={styles.errorBox}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {!inVoice ? (
        <button
          onClick={handleJoinVoice}
          disabled={loading}
          style={{
            ...styles.joinButton,
            ...(loading ? styles.joinButtonDisabled : {}),
          }}
          onMouseEnter={(e) => !loading && (e.target.style.background = '#1f8348')}
          onMouseLeave={(e) => !loading && (e.target.style.background = '#23a55a')}
        >
          {loading ? (
            <>
              <div style={styles.spinner}></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Phone size={20} />
              <span>Join Voice</span>
            </>
          )}
        </button>
      ) : (
        <div style={styles.activeVoiceContainer}>
          {/* Connected Status */}
          <div style={styles.connectedBanner}>
            <div style={styles.voiceDot}></div>
            <span style={styles.connectedText}>Voice Connected</span>
          </div>

          {/* Participants */}
          <div style={styles.participantsSection}>
            <div style={styles.participantsHeader}>
              <span style={styles.participantsTitle}>IN CHANNEL</span>
              <span style={styles.participantsCount}>{participants.length + 1}</span>
            </div>
            
            <div style={styles.participantsList}>
              {/* Current user */}
              <div style={styles.participant}>
                <div style={styles.avatarContainer}>
                  <div style={{
                    ...styles.avatar,
                    ...(isSpeaking ? styles.avatarSpeaking : {}),
                  }}>
                    <span style={styles.avatarText}>
                      {user.anonymousId.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  {isSpeaking && <div style={styles.speakingRing}></div>}
                </div>
                
                <div style={styles.participantInfo}>
                  <span style={styles.participantName}>{user.anonymousId}</span>
                  <span style={styles.participantYou}>You</span>
                </div>

                <div style={styles.statusIcons}>
                  {isMuted && (
                    <div style={styles.statusIcon}>
                      <MicOff size={14} />
                    </div>
                  )}
                  {isDeafened && (
                    <div style={styles.statusIcon}>
                      <VolumeX size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* Other participants */}
              {participants.map((socketId, index) => (
                <div key={socketId} style={styles.participant}>
                  <div style={styles.avatarContainer}>
                    <div style={styles.avatarOther}>
                      <span style={styles.avatarText}>U{index + 1}</span>
                    </div>
                  </div>
                  <div style={styles.participantInfo}>
                    <span style={styles.participantNameOther}>Participant {index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Controls Panel */}
          <div style={styles.controlsPanel}>
            <div style={styles.controlsContainer}>
              <button
                onClick={handleToggleMute}
                style={{
                  ...styles.controlButton,
                  ...(isMuted ? styles.controlButtonActive : {}),
                }}
                title={isMuted ? 'Unmute' : 'Mute'}
                onMouseEnter={(e) => {
                  if (!isMuted) e.target.style.background = '#3f4248';
                }}
                onMouseLeave={(e) => {
                  if (!isMuted) e.target.style.background = '#2e3136';
                }}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                onClick={handleToggleDeafen}
                style={{
                  ...styles.controlButton,
                  ...(isDeafened ? styles.controlButtonActive : {}),
                }}
                title={isDeafened ? 'Undeafen' : 'Deafen'}
                onMouseEnter={(e) => {
                  if (!isDeafened) e.target.style.background = '#3f4248';
                }}
                onMouseLeave={(e) => {
                  if (!isDeafened) e.target.style.background = '#2e3136';
                }}
              >
                {isDeafened ? <VolumeX size={20} /> : <Headphones size={20} />}
              </button>

              <button
                style={styles.controlButton}
                title="Settings"
                onMouseEnter={(e) => e.target.style.background = '#3f4248'}
                onMouseLeave={(e) => e.target.style.background = '#2e3136'}
              >
                <Settings size={20} />
              </button>

              <div style={styles.divider}></div>

              <button
                onClick={handleLeaveVoice}
                style={styles.leaveButton}
                title="Leave Voice"
                onMouseEnter={(e) => e.target.style.background = '#a12d2d'}
                onMouseLeave={(e) => e.target.style.background = '#d84040'}
              >
                <PhoneOff size={20} />
              </button>
            </div>

            <div style={styles.privacyNote}>
              <span style={styles.privacyIcon}>🔒</span>
              <span style={styles.privacyText}>Anonymous • Encrypted</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    background: '#2b2d31',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  titleText: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#f2f3f5',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#b5bac1',
    background: '#1e1f22',
    padding: '4px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  errorBox: {
    background: 'rgba(242, 63, 67, 0.1)',
    border: '1px solid #f23f43',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '12px',
    color: '#f23f43',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  joinButton: {
    width: '100%',
    background: '#23a55a',
    border: 'none',
    borderRadius: '6px',
    padding: '12px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  joinButtonDisabled: {
    background: '#4e5058',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #ffffff',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  activeVoiceContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  connectedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(35, 165, 90, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(35, 165, 90, 0.3)',
  },
  voiceDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#23a55a',
    animation: 'pulse 2s ease-in-out infinite',
  },
  connectedText: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#23a55a',
  },
  participantsSection: {
    background: '#1e1f22',
    borderRadius: '6px',
    padding: '12px',
  },
  participantsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #2e3136',
  },
  participantsTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#949ba4',
    letterSpacing: '0.5px',
  },
  participantsCount: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#b5bac1',
    background: '#2e3136',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  participantsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  participant: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    borderRadius: '6px',
    transition: 'background 0.15s ease',
    cursor: 'pointer',
  },
  avatarContainer: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  avatarSpeaking: {
    boxShadow: '0 0 0 2px #1e1f22, 0 0 0 4px #23a55a',
  },
  speakingRing: {
    position: 'absolute',
    inset: '-4px',
    borderRadius: '50%',
    border: '2px solid #23a55a',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  avatarOther: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f2709c 0%, #ff9472 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#ffffff',
  },
  participantInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  participantName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#f2f3f5',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  participantYou: {
    fontSize: '12px',
    color: '#949ba4',
  },
  participantNameOther: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#b5bac1',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusIcons: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  statusIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#2e3136',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f23f43',
  },
  controlsPanel: {
    background: '#1e1f22',
    borderRadius: '6px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  controlsContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  controlButton: {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    background: '#2e3136',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#b5bac1',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  controlButtonActive: {
    background: '#f23f43',
    color: '#ffffff',
  },
  divider: {
    width: '1px',
    height: '24px',
    background: '#2e3136',
    margin: '0 4px',
  },
  leaveButton: {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    background: '#d84040',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  privacyNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px',
    background: '#2b2d31',
    borderRadius: '4px',
  },
  privacyIcon: {
    fontSize: '12px',
  },
  privacyText: {
    fontSize: '12px',
    color: '#949ba4',
    fontWeight: 500,
  },
};

// Add keyframes for animations in global CSS or styled components
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(styleSheet);

export default VoiceChannel;
