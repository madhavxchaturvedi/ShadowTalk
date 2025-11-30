import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../services/api';
import { socket } from '../services/socket';
import ReportModal from '../components/ReportModal';
import { updateUser } from '../store/slices/authSlice';

const DirectMessage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!userId || userId === 'undefined') {
      navigate('/dms');
      return;
    }

    const loadMessages = async () => {
      try {
        const res = await api.get(`/dms/${userId}`);
        setMessages(res.data.data.messages);
        
        // Fetch other user info
        try {
          const userRes = await api.get(`/users/${userId}`);
          setOtherUser(userRes.data.data.user);
        } catch (err) {
          console.error('Failed to load other user:', err);
          // Fallback: try to get from messages
          if (res.data.data.messages.length > 0) {
            const firstMsg = res.data.data.messages[0];
            const other = firstMsg.sender._id === user._id ? firstMsg.receiver : firstMsg.sender;
            setOtherUser(other);
          }
        }
      } catch (error) {
        console.error('Load messages error:', error);
        if (error.response?.status === 404) {
          alert('User not found');
          navigate('/dms');
        } else if (error.response?.status === 403) {
          alert(error.response.data.message || 'Cannot message this user');
          navigate('/dms');
        }
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [userId, user._id, navigate]);

  useEffect(() => {
    if (!socket || !user?._id) return;

    const handleNewDM = (data) => {
      const msg = data.message;
      // Only add if it's for this conversation and not already in the list
      if (
        (msg.sender._id === userId && msg.receiver._id === user._id) ||
        (msg.sender._id === user._id && msg.receiver._id === userId)
      ) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          if (prev.some((m) => m._id === msg._id)) {
            return prev;
          }
          return [...prev, msg];
        });
      }
    };

    socket.on('new_dm', handleNewDM);

    return () => {
      socket.off('new_dm', handleNewDM);
    };
  }, [userId, user._id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistically add message to UI
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      content: messageContent,
      sender: { _id: user._id, anonymousId: user.anonymousId },
      receiver: { _id: userId, anonymousId: otherUser?.anonymousId },
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await api.post(`/dms/${userId}`, { content: messageContent });
      // Replace temp message with real one
      setMessages((prev) => 
        prev.map((msg) => msg._id === tempMessage._id ? res.data.data.message : msg)
      );

      // Refresh user data to get updated reputation points
      try {
        const userResponse = await api.get(`/users/${user._id}`);
        console.log('✅ Updated user reputation (DM):', userResponse.data.data.user.reputation);
        dispatch(updateUser(userResponse.data.data.user));
      } catch (repError) {
        console.error('Failed to update reputation display:', repError);
      }
    } catch (error) {
      console.error('Send DM error:', error);
      // Remove failed message
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      
      const errorMsg = error.response?.data?.message || 'Failed to send message';
      alert(errorMsg);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-[var(--bg-tertiary)] border-t-[var(--accent)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4">
        <div className="container mx-auto max-w-7xl flex items-center gap-4">
          <button
            onClick={() => navigate('/dms')}
            className="text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {otherUser?.anonymousId || 'Direct Message'}
            </h1>
            {otherUser && (
              <p className="text-sm text-[var(--text-secondary)]">
                Level {otherUser.reputation.level} • {otherUser.reputation.points} points
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2 bg-[var(--bg-tertiary)] rounded-lg hover:bg-opacity-80 transition-colors text-sm"
            >
              🚨 Report
            </button>
            <button
              onClick={async () => {
                if (isBlocked) {
                  if (confirm('Unblock this user?')) {
                    try {
                      await api.post(`/users/${userId}/unblock`);
                      setIsBlocked(false);
                      alert('User unblocked');
                    } catch (error) {
                      alert(error.response?.data?.message || 'Failed to unblock');
                    }
                  }
                } else {
                  if (confirm('Block this user? You will not receive messages from them.')) {
                    try {
                      await api.post(`/users/${userId}/block`);
                      setIsBlocked(true);
                      alert('User blocked');
                    } catch (error) {
                      alert(error.response?.data?.message || 'Failed to block');
                    }
                  }
                }
              }}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                isBlocked
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isBlocked ? '✓ Unblock' : '🚫 Block'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)] px-4 py-6">
        <div className="container mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-[var(--text-secondary)] py-12">
              <p className="text-lg">No messages yet</p>
              <p className="text-sm mt-2">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${
                  msg.sender._id === user._id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-lg ${
                    msg.sender._id === user._id
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-secondary)] border border-[var(--border)]'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">
                    {msg.sender.anonymousId}
                  </div>
                  <div className="break-words whitespace-pre-wrap">{msg.content}</div>
                  <div className="text-xs opacity-60 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={userId}
        reportedUserName={otherUser?.anonymousId}
      />

      <div className="bg-[var(--bg-secondary)] border-t border-[var(--border)] px-4 py-4">
        <div className="container mx-auto max-w-4xl">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-[var(--accent)] rounded-lg hover:bg-[var(--accent-hover)] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectMessage;
