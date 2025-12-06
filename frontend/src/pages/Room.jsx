import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../services/api';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import Message from '../components/Message';
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
  const messagesEndRef = useRef(null);

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
    if (!user) return;

    connectSocket();

    // Join room
    socket.emit('join_room', roomId);

    // Listen for new messages
    socket.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.emit('leave_room', roomId);
      socket.off('new_message');
    };
  }, [roomId, user]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      // Save to database - backend will broadcast via Socket.io
      await api.post(`/messages/${roomId}`, { content: newMessage });

      // Refresh user data to get updated reputation points
      try {
        const userResponse = await api.get(`/users/${user._id}`);
        console.log('✅ Updated user reputation:', userResponse.data.data.user.reputation);
        dispatch(updateUser(userResponse.data.data.user));
      } catch (repError) {
        console.error('Failed to update reputation display:', repError);
        // Don't block message sending if reputation update fails
      }

      setNewMessage('');
    } catch (error) {
      console.error('Send message error:', error);
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
      {/* Room Header */}
      <div className="room-header">
        <button
          onClick={() => navigate('/')}
          className="back-button"
        >
          ← Back
        </button>
        <div className="room-info">
          <h1>{room?.name}</h1>
          <p>
            {room?.memberCount} members • {room?.topic}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="room-messages">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p className="text-lg">No messages yet</p>
              <p className="text-sm" style={{ marginTop: '8px' }}>Be the first to start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <Message key={message._id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="room-input">
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

export default Room;
