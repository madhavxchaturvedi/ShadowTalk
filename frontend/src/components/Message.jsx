import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { socket } from '../services/socket';
import ReactionPicker from './ReactionPicker';
import ReportModal from './ReportModal';
import { updateUser } from '../store/slices/authSlice';

const Message = ({ message, onReply, isReply = false }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reactions, setReactions] = useState(message.reactions || []);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const isOwnMessage = message.sender._id === user._id;

  // Listen for real-time reaction updates
  useEffect(() => {
    if (!socket) return;

    const handleReactionUpdate = async (data) => {
      if (data.messageId === message._id) {
        setReactions(data.reactions);
        
        // If this is user's own message, refresh reputation (received reaction: +1 point)
        if (message.sender._id === user._id) {
          try {
            const userResponse = await api.get(`/users/${user._id}`);
            console.log('✅ Updated user reputation (received reaction):', userResponse.data.data.user.reputation);
            dispatch(updateUser(userResponse.data.data.user));
          } catch (repError) {
            console.error('Failed to update reputation display:', repError);
          }
        }
      }
    };

    const handleNewReply = (data) => {
      if (data.parentMessageId === message._id) {
        setReplies((prev) => [...prev, data.reply]);
        setShowReplies(true);
      }
    };

    socket.on('message_reacted', handleReactionUpdate);
    socket.on('new_reply', handleNewReply);

    return () => {
      socket.off('message_reacted', handleReactionUpdate);
      socket.off('new_reply', handleNewReply);
    };
  }, [message._id]);

  const handleReact = async (emoji) => {
    try {
      const res = await api.post(`/messages/${message._id}/react`, { emoji });
      setReactions(res.data.data.reactions);
      
      // Refresh user data to get updated reputation points (gave reaction: +0.5 points)
      try {
        const userResponse = await api.get(`/users/${user._id}`);
        console.log('✅ Updated user reputation (gave reaction):', userResponse.data.data.user.reputation);
        dispatch(updateUser(userResponse.data.data.user));
      } catch (repError) {
        console.error('Failed to update reputation display:', repError);
      }
    } catch (error) {
      console.error('React error:', error);
    }
  };

  const loadReplies = async () => {
    if (replies.length > 0) {
      setShowReplies(!showReplies);
      return;
    }

    setLoadingReplies(true);
    try {
      const res = await api.get(`/messages/${message._id}/replies`);
      setReplies(res.data.data.replies);
      setShowReplies(true);
    } catch (error) {
      console.error('Load replies error:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await api.post(`/messages/${message._id}/reply`, {
        content: replyText,
      });
      setReplies([...replies, res.data.data.reply]);
      setReplyText('');
      setShowReplies(true);
    } catch (error) {
      console.error('Send reply error:', error);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className={`${isReply ? 'ml-8 mt-2' : ''}`}>
      <div
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      >
        <div
          style={{
            maxWidth: '65%',
            padding: '12px 16px',
            borderRadius: '12px',
            background: isOwnMessage ? 'var(--accent)' : '#1f1f1f',
            color: 'white',
            position: 'relative',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
            border: isOwnMessage ? 'none' : '1px solid #2a2a2a',
            opacity: message.isPending ? 0.6 : 1,
            transition: 'opacity 0.3s ease'
          }}
        >
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '6px', fontWeight: '500' }}>
            {message.sender.anonymousId}
            {message.isPending && <span style={{ marginLeft: '6px', fontSize: '10px' }}>⏳ Sending...</span>}
          </div>
          <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
            {message.content}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.65, marginTop: '6px', textAlign: 'right' }}>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          {/* Reactions */}
          {reactions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
              {reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  onClick={() => handleReact(reaction.emoji)}
                  style={{
                    fontSize: '13px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: reaction.users.includes(user._id) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    border: reaction.users.includes(user._id) ? '1px solid var(--accent)' : '1px solid #2a2a2a',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = reaction.users.includes(user._id) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)'}
                >
                  {reaction.emoji} {reaction.users.length}
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {!isReply && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '12px', opacity: 0.65 }}>
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.65'}
              >
                😊 React
              </button>
              <button
                onClick={loadReplies}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.65'}
              >
                💬 Reply
              </button>
              {!isOwnMessage && message.sender?._id && (
                <>
                  <button
                    onClick={() => navigate(`/dm/${message.sender._id}`)}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.65'}
                  >
                    📨 DM
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.65'}
                  >
                    🚨 Report
                  </button>
                </>
              )}
            </div>
          )}

          {/* Report Modal */}
          {showReportModal && (
            <ReportModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              reportedMessageId={message._id}
              messageType="Message"
              reportedUserId={message.sender._id}
              reportedUserName={message.sender.anonymousId}
            />
          )}

          {/* Reaction Picker */}
          {showReactionPicker && (
            <ReactionPicker
              onReact={handleReact}
              onClose={() => setShowReactionPicker(false)}
            />
          )}
        </div>
      </div>

      {/* Replies */}
      {!isReply && showReplies && (
        <div className="mt-2 ml-8 space-y-2">
          {loadingReplies ? (
            <div className="text-sm text-[var(--text-secondary)]">Loading replies...</div>
          ) : (
            <>
              {replies.map((reply) => (
                <Message key={reply._id} message={reply} isReply={true} />
              ))}
              
              {/* Reply input */}
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  disabled={sendingReply}
                  className="flex-1 px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendingReply}
                  className="px-4 py-2 text-sm bg-[var(--accent)] rounded-lg hover:bg-[var(--accent-hover)] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReply ? 'Sending...' : 'Reply'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Message;
