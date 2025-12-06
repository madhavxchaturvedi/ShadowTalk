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
  const [connectionSlow, setConnectionSlow] = useState(false);
  const messagesEndRef = useRef(null);
  const slowConnectionTimerRef = useRef(null);

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
    const tempId = `temp-${Date.now()}`;
    
    // Optimistically add message to UI
    const tempMessage = {
      _id: tempId,
      content: messageContent,
      sender: { _id: user._id, anonymousId: user.anonymousId },
      receiver: { _id: userId, anonymousId: otherUser?.anonymousId },
      createdAt: new Date().toISOString(),
      isRead: false,
      isPending: true, // Mark as pending
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    setSending(true);

    // Start slow connection timer (3 seconds)
    slowConnectionTimerRef.current = setTimeout(() => {
      setConnectionSlow(true);
    }, 3000);

    try {
      const res = await api.post(`/dms/${userId}`, { content: messageContent });
      
      // Clear slow connection warning
      if (slowConnectionTimerRef.current) {
        clearTimeout(slowConnectionTimerRef.current);
      }
      setConnectionSlow(false);
      
      // Replace temp message with real one
      setMessages((prev) => 
        prev.map((msg) => msg._id === tempId ? res.data.data.message : msg)
      );

      // Update reputation in background (non-blocking)
      api.get(`/users/${user._id}`)
        .then(userResponse => {
          dispatch(updateUser(userResponse.data.data.user));
        })
        .catch(err => console.error('Failed to update reputation:', err));

    } catch (error) {
      console.error('Send DM error:', error);
      
      // Clear slow connection warning
      if (slowConnectionTimerRef.current) {
        clearTimeout(slowConnectionTimerRef.current);
      }
      setConnectionSlow(false);
      
      // Remove failed message
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      
      // Restore message text so user can retry
      setNewMessage(messageContent);
      
      const errorMsg = error.response?.data?.message || 'Failed to send message';
      alert(errorMsg);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px' }}>
        <div className="w-12 h-12 border-4 border-[var(--bg-tertiary)] border-t-[var(--accent)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="room-page">
      <div className="room-header">
        <button
          onClick={() => navigate('/dms')}
          className="back-button"
        >
          ← Back
        </button>
        <div className="room-info" style={{ flex: 1 }}>
          <h1>
            {otherUser?.anonymousId || 'Direct Message'}
          </h1>
          {otherUser && (
            <p>
              Level {otherUser.reputation.level} • {otherUser.reputation.points} points
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowReportModal(true)}
            style={{ 
              padding: '8px 16px', 
              background: 'var(--bg-tertiary)', 
              border: 'none', 
              borderRadius: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
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
            style={{ 
              padding: '8px 16px', 
              background: isBlocked ? '#10b981' : '#ef4444', 
              border: 'none', 
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            {isBlocked ? '✓ Unblock' : '🚫 Block'}
          </button>
        </div>
      </div>

      <div className="room-messages">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p className="text-lg">No messages yet</p>
              <p className="text-sm" style={{ marginTop: '8px' }}>Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                style={{ 
                  display: 'flex',
                  justifyContent: msg.sender._id === user._id ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '60%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: msg.sender._id === user._id ? 'var(--accent)' : 'var(--bg-secondary)',
                    border: msg.sender._id === user._id ? 'none' : '1px solid var(--border)',
                    color: msg.sender._id === user._id ? 'white' : 'var(--text-primary)',
                    opacity: msg.isPending ? 0.6 : 1,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <div style={{ fontSize: '12px', opacity: 0.75, marginBottom: '4px' }}>
                    {msg.sender.anonymousId}
                    {msg.isPending && <span style={{ marginLeft: '6px', fontSize: '10px' }}>⏳ Sending...</span>}
                  </div>
                  <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={userId}
        reportedUserName={otherUser?.anonymousId}
      />

      <div className="room-input">
        {connectionSlow && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            borderLeft: '3px solid #fbbf24',
            marginBottom: '8px',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#fbbf24',
          }}>
            ⚠️ Server is waking up... This may take 30-60 seconds on first request.
          </div>
        )}
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="message-input"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="send-button"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DirectMessage;
