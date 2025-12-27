import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { HiArrowLeft, HiPaperAirplane, HiShieldExclamation, HiNoSymbol, HiCheckCircle } from 'react-icons/hi2';
import api from '../services/api';
import { socket } from '../services/socket';
import Message from '../components/Message';
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
      // Only add if it's for this conversation
      if (
        (msg.sender._id === userId && msg.receiver._id === user._id) ||
        (msg.sender._id === user._id && msg.receiver._id === userId)
      ) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some((m) => m._id === msg._id);
          if (exists) {
            return prev;
          }
          
          // Replace pending message with confirmed one if it matches
          const hasPending = prev.some(m => 
            m.isPending && m.content === msg.content && m.sender._id === msg.sender._id
          );
          if (hasPending) {
            return prev.map(m => 
              m.isPending && m.content === msg.content && m.sender._id === msg.sender._id 
                ? msg 
                : m
            );
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
      
      // Replace temp message with real one (if not already replaced by socket)
      setMessages((prev) => {
        const hasRealMessage = prev.some(msg => msg._id === res.data.data.message._id);
        if (hasRealMessage) {
          // Socket already added it, just remove temp
          return prev.filter(msg => msg._id !== tempId);
        }
        // Replace temp with real
        return prev.map((msg) => msg._id === tempId ? res.data.data.message : msg);
      });

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
      {/* Header */}
      <div className="room-header">
        <button onClick={() => navigate('/dms')} className="back-button">
          <HiArrowLeft className="back-icon" />
          <span>Back</span>
        </button>
        
        <div className="room-info">
          <h1>{otherUser?.nickname || otherUser?.anonymousId || 'Direct Message'}</h1>
          {otherUser && (
            <p>Level {otherUser.reputation.level} • {otherUser.reputation.points} points</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowReportModal(true)}
            className="icon-btn"
            title="Report User"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <HiShieldExclamation />
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
            className="icon-btn"
            title={isBlocked ? 'Unblock User' : 'Block User'}
            style={{ 
              background: isBlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: isBlocked ? 'var(--accent)' : '#ef4444'
            }}
          >
            {isBlocked ? <HiCheckCircle /> : <HiNoSymbol />}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="room-messages">
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '80px 24px' }}>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>No messages yet</p>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <Message
                key={msg._id}
                message={msg}
                currentUserId={user._id}
                isDM={true}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="room-input">
        {connectionSlow && (
          <div className="connection-warning">
            ⚠️ Server is waking up... This may take 30-60 seconds on first request.
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${otherUser?.nickname || 'user'}...`}
            disabled={sending}
            className="message-input"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="send-button"
          >
            {sending ? (
              <div className="btn-spinner-small"></div>
            ) : (
              <HiPaperAirplane className="send-icon" />
            )}
          </button>
        </form>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={userId}
        reportedUserName={otherUser?.anonymousId}
      />
    </div>
  );
};

export default DirectMessage;
