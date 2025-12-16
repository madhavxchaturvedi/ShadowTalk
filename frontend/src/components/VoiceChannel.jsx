import { useState, useEffect } from 'react';
import { Mic, MicOff, Headphones, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
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
    <div className="voice-channel-container bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Volume2 size={20} className="text-green-500" />
          Voice Channel
        </h3>
        {roomType === 'both' && (
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
            Text + Voice
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      {!inVoice ? (
        <button
          onClick={handleJoinVoice}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Connecting...
            </>
          ) : (
            <>
              <Phone size={18} />
              Join Voice
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          {/* Participants */}
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2 uppercase">
              In Voice — {participants.length + 1} {participants.length === 0 ? 'participant' : 'participants'}
            </p>
            <div className="space-y-2">
              {/* Current user */}
              <div className="flex items-center gap-2 text-white">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ${isSpeaking ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-gray-900' : ''}`}>
                  <span className="text-xs font-bold">
                    {user.anonymousId.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm flex-1">{user.anonymousId} (You)</span>
                <div className="flex gap-1">
                  {isMuted && <MicOff size={14} className="text-red-400" />}
                  {isDeafened && <VolumeX size={14} className="text-red-400" />}
                </div>
              </div>

              {/* Other participants */}
              {participants.map((socketId, index) => (
                <div key={socketId} className="flex items-center gap-2 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-xs font-bold">U{index + 1}</span>
                  </div>
                  <span className="text-sm">Participant {index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={handleToggleMute}
              className={`flex-1 ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'} text-white font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              <span className="text-sm">{isMuted ? 'Muted' : 'Mute'}</span>
            </button>

            <button
              onClick={handleToggleDeafen}
              className={`flex-1 ${isDeafened ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'} text-white font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors`}
              title={isDeafened ? 'Undeafen' : 'Deafen'}
            >
              {isDeafened ? <VolumeX size={18} /> : <Headphones size={18} />}
              <span className="text-sm">{isDeafened ? 'Deafened' : 'Deafen'}</span>
            </button>

            <button
              onClick={handleLeaveVoice}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg flex items-center justify-center transition-colors"
              title="Leave Voice"
            >
              <PhoneOff size={18} />
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            🔒 Your voice is anonymous • No recording
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceChannel;
