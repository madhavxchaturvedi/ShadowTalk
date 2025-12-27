import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiCornerUpRight, FiMoreVertical } from 'react-icons/fi';
import { HiOutlineFaceSmile, HiOutlineChatBubbleLeftRight, HiOutlineFlag } from 'react-icons/hi2';
import api from '../services/api';
import { socket } from '../services/socket';
import ReactionPicker from './ReactionPicker';
import ReportModal from './ReportModal';
import { updateUser } from '../store/slices/authSlice';

const Message = ({ message, onReply, isReply = false, isDM = false }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [reactions, setReactions] = useState(message.reactions || []);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const isOwnMessage = message.sender._id === user._id;

  // Get display name - only show nickname or Anonymous (never expose IDs)
  const getDisplayName = () => {
    if (message.sender.nickname && message.sender.nickname.trim()) {
      return message.sender.nickname;
    }
    // Show Anonymous with last 4 chars of anonymousId to distinguish users
    const anonymousId = message.sender.anonymousId || message.sender._id;
    const idSuffix = anonymousId.slice(-4);
    return `Anonymous #${idSuffix}`;
  };

  // Get avatar initial
  const getAvatarInitial = () => {
    const displayName = getDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  // Format timestamp
  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return messageDate.toLocaleDateString();
  };

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
    // Toggle if replies already loaded
    if (replies.length > 0) {
      setShowReplies(!showReplies);
      return;
    }

    // If already showing (but no replies loaded yet), just close
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    // Load replies from server
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
    <>
      <div className={`message-wrapper ${isReply ? 'message-reply' : ''}`}>
        {/* Avatar */}
        <div className="message-avatar">
          <div className="avatar-circle">
            {getAvatarInitial()}
          </div>
          {message.sender.reputation?.level && (
            <div className="level-badge">{message.sender.reputation.level}</div>
          )}
        </div>

        {/* Content */}
        <div className="message-content-wrapper">
        {/* Reply Reference (if this is a reply) */}
        {isReply && message.parentMessage && (
          <div className="reply-reference">
            <FiCornerUpRight className="reply-icon" />
            <span className="reply-to-text">
              Reply to <span className="reply-to-name">{message.parentMessage.sender?.nickname || 'Anonymous'}</span>
            </span>
          </div>
        )}

        {/* Header */}
        <div className="message-header">
          <span 
            className="username"
            onClick={() => !isOwnMessage && message.sender?._id && navigate(`/dm/${message.sender._id}`)}
            style={{ cursor: !isOwnMessage && message.sender?._id ? 'pointer' : 'default' }}
          >
            {getDisplayName()}
          </span>
          {isOwnMessage && (
            <span className="you-badge">You</span>
          )}
          {message.sender.reputation?.level && (
            <span className="user-level">Level {message.sender.reputation.level}</span>
          )}
          <span className="timestamp">
            {formatTime(message.createdAt)}
          </span>
          {message.isPending && (
            <span className="pending-indicator">
              <FiClock className="w-3 h-3" /> Sending...
            </span>
          )}

          {/* Hover Actions */}
          <div className="message-actions">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="action-btn"
              title="Add Reaction"
            >
              <HiOutlineFaceSmile />
            </button>
            {!isReply && !isDM && (
              <button
                onClick={loadReplies}
                className="action-btn"
                title="Reply"
              >
                <HiOutlineChatBubbleLeftRight />
              </button>
            )}
            {!isOwnMessage && message.sender?._id && (
              <button
                onClick={() => setShowReportModal(true)}
                className="action-btn action-btn-danger"
                title="Report"
              >
                <HiOutlineFlag />
              </button>
            )}
          </div>
        </div>

        {/* Message Body */}
        <div className="message-body" style={{ opacity: message.isPending ? 0.6 : 1 }}>
          {message.content}
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="message-reactions">
            {reactions.map((reaction, idx) => (
              <button
                key={idx}
                onClick={() => handleReact(reaction.emoji)}
                className={`reaction-chip ${reaction.users.includes(user._id) ? 'active' : ''}`}
              >
                <span className="reaction-emoji">{reaction.emoji}</span>
                <span className="reaction-count">{reaction.users.length}</span>
              </button>
            ))}
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="reaction-chip reaction-add"
              title="Add Reaction"
            >
              +
            </button>
          </div>
        )}

        {/* Reply Thread Indicator - Always show if has replies */}
        {!isReply && (replies.length > 0 || message.replyCount > 0) && !showReplies && (
          <button onClick={loadReplies} className="reply-indicator">
            <FiCornerUpRight className="w-4 h-4" />
            {replies.length || message.replyCount || 0} {(replies.length || message.replyCount) === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {/* Reaction Picker */}
        {showReactionPicker && (
          <div style={{ position: 'relative', marginTop: '8px' }}>
            <ReactionPicker
              onReact={handleReact}
              onClose={() => setShowReactionPicker(false)}
            />
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
      </div>
    </div>

    {/* Replies Section - Outside message wrapper for proper layout */}
    {!isReply && showReplies && (
      <div className="replies-section">
        {loadingReplies ? (
          <div className="replies-loading">
            <div className="spinner-small"></div>
            <span>Loading replies...</span>
          </div>
        ) : (
          <>
            <div className="replies-list">
              {replies.map((reply) => (
                <Message key={reply._id} message={reply} isReply={true} />
              ))}
            </div>
            
            {/* Reply input - compact inline style */}
            <div className="reply-input-container">
              <div className="reply-input-avatar">
                {(user.nickname || 'A').charAt(0).toUpperCase()}
              </div>
              <form onSubmit={handleSendReply} className="reply-input-form">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Add a reply..."
                  disabled={sendingReply}
                  className="reply-text-input"
                  maxLength={2000}
                />
                {replyText.trim() && (
                  <button
                    type="submit"
                    disabled={sendingReply}
                    className="reply-send-btn"
                  >
                    {sendingReply ? (
                      <div className="spinner-tiny"></div>
                    ) : (
                      '→'
                    )}
                  </button>
                )}
              </form>
            </div>
          </>
        )}
      </div>
    )}
  </>
  );
};

export default Message;
