import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { HiArrowLeft, HiPaperAirplane } from 'react-icons/hi2';
import api from '../services/api';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import Message from '../components/Message';
import VoiceChannel from '../components/VoiceChannel';
import { updateUser } from '../store/slices/authSlice';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connectionSlow, setConnectionSlow] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const slowConnectionTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load room and messages
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const [roomRes, messagesRes] = await Promise.all([
          api.get(`/rooms/${roomId}`),
          api.get(`/messages/${roomId}`),
        ]);

        if (!roomRes.data.data.isMember) {
          navigate('/');
          return;
        }

        setRoom(roomRes.data.data.room);
        setMessages(messagesRes.data.data.messages);
      } catch (error) {
        console.error('Load room error:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [roomId, navigate]);

  // Socket.io setup
  useEffect(() => {
    if (!user || !roomId) return;

    const handleNewMessage = (message) => {
      setMessages((prev) => {
        // Check if message already exists (avoid duplicates)
        const exists = prev.some(msg => msg._id === message._id);
        if (exists) {
          // Replace pending message with confirmed one
          return prev.map(msg => 
            msg._id.startsWith('temp-') && msg.content === message.content && msg.sender._id === message.sender._id
              ? message 
              : msg
          );
        }
        return [...prev, message];
      });
    };

    const handleUserTyping = ({ userId, nickname }) => {
      if (userId === user._id) return; // Don't show own typing
      setTypingUsers(prev => {
        if (!prev.find(u => u.userId === userId)) {
          return [...prev, { userId, nickname: nickname || 'Anonymous' }];
        }
        return prev;
      });
    };

    const handleUserStoppedTyping = ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    };

    // Connect socket if not already connected
    if (!socket.connected) {
      connectSocket();
    }

    // Join room
    socket.emit('join_room', roomId);

    // Listen for events
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      // Leave room and remove listeners
      socket.emit('leave_room', roomId);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [roomId, user?._id]); // Only depend on roomId and user ID, not entire user object

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !user) return;
    
    // Emit typing event
    socket.emit('typing', { roomId, userId: user._id, nickname: user.nickname });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopped_typing', { roomId, userId: user._id });
    }, 2000);
  };

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (socket) {
      socket.emit('stopped_typing', { roomId, userId: user._id });
    }
    
    // Optimistic update - show message immediately
    const optimisticMessage = {
      _id: tempId,
      content: messageContent,
      sender: {
        _id: user._id,
        anonymousId: user.anonymousId,
        nickname: user.nickname,
        reputation: user.reputation,
      },
      room: roomId,
      createdAt: new Date().toISOString(),
      reactions: [],
      isPending: true, // Mark as pending
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    setSending(true);

    // Start slow connection timer (3 seconds)
    slowConnectionTimerRef.current = setTimeout(() => {
      setConnectionSlow(true);
    }, 3000);

    try {
      // Save to database - backend will broadcast via Socket.io
      const response = await api.post(`/messages/${roomId}`, { content: messageContent });
      
      // Clear slow connection warning
      if (slowConnectionTimerRef.current) {
        clearTimeout(slowConnectionTimerRef.current);
      }
      setConnectionSlow(false);

      // Replace optimistic message with real one (if not already replaced by socket)
      setMessages((prev) => {
        const hasRealMessage = prev.some(msg => msg._id === response.data.data.message._id);
        if (hasRealMessage) {
          // Socket already added it, just remove temp
          return prev.filter(msg => msg._id !== tempId);
        }
        // Replace temp with real
        return prev.map(msg => msg._id === tempId ? response.data.data.message : msg);
      });

      // Update reputation in background (non-blocking)
      api.get(`/users/${user._id}`)
        .then(userResponse => {
          dispatch(updateUser(userResponse.data.data.user));
        })
        .catch(err => console.error('Failed to update reputation:', err));

    } catch (error) {
      console.error('Send message error:', error);
      
      // Clear slow connection warning
      if (slowConnectionTimerRef.current) {
        clearTimeout(slowConnectionTimerRef.current);
      }
      setConnectionSlow(false);

      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));

      if (error.response?.status === 403) {
        alert('You do not have permission to send messages in this room.');
      } else {
        alert('Failed to send message. Please check your connection and try again.');
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="room-page">
      {/* Room Header */}
      <div className="room-header">
        <button
          onClick={() => navigate('/')}
          className="back-button"
        >
          <HiArrowLeft className="back-icon" />
          <span>Back</span>
        </button>
        <div className="room-info">
          <h1>
            {room?.name}
            {room?.roomType === 'voice' && ' 🎤'}
            {room?.roomType === 'both' && ' 🎧'}
          </h1>
          <p>
            {room?.memberCount} members • {room?.topic}
            {room?.roomType && room.roomType !== 'text' && (
              <span className="ml-2 text-[var(--accent)]">
                • {room.roomType === 'voice' ? 'Voice Only' : 'Voice + Text'}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Voice Channel Component */}
      {room && (room.roomType === 'voice' || room.roomType === 'both') && (
        <div style={{ padding: '16px' }}>
          <VoiceChannel 
            roomId={roomId} 
            roomName={room.name}
            roomType={room.roomType}
          />
        </div>
      )}

      {/* Messages Area - Hide for voice-only rooms */}
      {room?.roomType !== 'voice' && (
        <>
          <div className="room-messages">
            <div className="messages-list">
              {messages.map((message) => (
                <Message
                  key={message._id}
                  message={message}
                  currentUserId={user._id}
                  roomId={roomId}
                />
              ))}
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
            
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
                <span>
                  {typingUsers.length === 1
                    ? `${typingUsers[0].nickname} is typing...`
                    : typingUsers.length === 2
                    ? `${typingUsers[0].nickname} and ${typingUsers[1].nickname} are typing...`
                    : `${typingUsers.length} people are typing...`}
                </span>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder={`Message #${room?.name || 'room'}`}
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
        </>
      )}
    </div>
  );
};

export default Room;
