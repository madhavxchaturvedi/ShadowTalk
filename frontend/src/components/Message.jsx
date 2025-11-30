import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { socket } from '../services/socket';
import ReactionPicker from './ReactionPicker';

const Message = ({ message, onReply, isReply = false }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
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

    const handleReactionUpdate = (data) => {
      if (data.messageId === message._id) {
        setReactions(data.reactions);
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
          className={`max-w-md px-4 py-3 rounded-lg relative ${
            isOwnMessage
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-secondary)] border border-[var(--border)]'
          }`}
        >
          <div className="text-xs opacity-75 mb-1">
            {message.sender.anonymousId}
          </div>
          <div className="break-words whitespace-pre-wrap">{message.content}</div>
          <div className="text-xs opacity-60 mt-1">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  onClick={() => handleReact(reaction.emoji)}
                  className={`text-sm px-2 py-1 rounded-full ${
                    reaction.users.includes(user._id)
                      ? 'bg-[var(--accent)]/30 border border-[var(--accent)]'
                      : 'bg-[var(--bg-tertiary)] border border-[var(--border)]'
                  }`}
                >
                  {reaction.emoji} {reaction.users.length}
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {!isReply && (
            <div className="flex gap-2 mt-2 text-xs opacity-60">
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className="hover:opacity-100 transition-opacity"
              >
                😊 React
              </button>
              <button
                onClick={loadReplies}
                className="hover:opacity-100 transition-opacity"
              >
                💬 Reply
              </button>
              {!isOwnMessage && message.sender?._id && (
                <button
                  onClick={() => navigate(`/dm/${message.sender._id}`)}
                  className="hover:opacity-100 transition-opacity"
                >
                  📨 DM
                </button>
              )}
            </div>
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
