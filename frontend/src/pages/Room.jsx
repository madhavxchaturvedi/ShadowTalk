import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
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
      // Send via Socket.io for real-time
      socket.emit('send_message', {
        content: newMessage,
        roomId,
        userId: user._id,
        anonymousId: user.anonymousId,
      });

      // Also save to database
      await api.post(`/messages/${roomId}`, { content: newMessage });

      setNewMessage('');
    } catch (error) {
      console.error('Send message error:', error);
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
      {/* Room Header */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold">{room?.name}</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {room?.memberCount} members • {room?.topic}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)] px-4 py-6">
        <div className="container mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-[var(--text-secondary)] py-12">
              <p className="text-lg">No messages yet</p>
              <p className="text-sm mt-2">Be the first to start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${
                  message.sender._id === user._id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-lg ${
                    message.sender._id === user._id
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-secondary)] border border-[var(--border)]'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">
                    {message.sender.anonymousId}
                  </div>
                  <div className="break-words">{message.content}</div>
                  <div className="text-xs opacity-60 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString([], {
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

      {/* Message Input */}
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

export default Room;
