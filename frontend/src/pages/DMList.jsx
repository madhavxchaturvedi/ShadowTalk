import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HiChatBubbleLeftRight, HiArrowLeft, HiSparkles } from 'react-icons/hi2';
import api from '../services/api';

const DMList = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await api.get('/dms/conversations');
        
        // Deduplicate conversations by user ID
        const uniqueConversations = res.data.data.conversations.reduce((acc, conv) => {
          const existingIndex = acc.findIndex(c => c.user._id === conv.user._id);
          if (existingIndex === -1) {
            acc.push(conv);
          } else {
            // Keep the one with the most recent message
            const existingTime = acc[existingIndex].lastMessage?.createdAt || 0;
            const currentTime = conv.lastMessage?.createdAt || 0;
            if (new Date(currentTime) > new Date(existingTime)) {
              acc[existingIndex] = conv;
            }
          }
          return acc;
        }, []);
        
        setConversations(uniqueConversations);
      } catch (error) {
        console.error('Load conversations error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  if (loading) {
    return (
      <div className="dm-list-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dm-list-page">
      {/* Header */}
      <div className="dm-header">
        <div className="dm-header-content">
          <div className="dm-header-text">
            <div className="dm-title-row">
              <HiChatBubbleLeftRight className="dm-title-icon" />
              <h1 className="dm-title">Direct Messages</h1>
            </div>
            <p className="dm-subtitle">Private conversations</p>
          </div>
          <button onClick={() => navigate('/')} className="btn-back">
            <HiArrowLeft />
            Back to Rooms
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="dm-main">
        {conversations.length === 0 ? (
          <div className="dm-empty-state">
            <div className="dm-empty-icon">
              <HiChatBubbleLeftRight />
            </div>
            <h3 className="dm-empty-title">No conversations yet</h3>
            <p className="dm-empty-text">
              Start a conversation by clicking on a user's profile in a room
            </p>
          </div>
        ) : (
          <div className="dm-conversations">
            {conversations.map((conv) => (
              <div
                key={conv.user._id}
                onClick={() => navigate(`/dm/${conv.user._id}`)}
                className="dm-conversation-card"
              >
                <div className="dm-conv-avatar">
                  {(conv.user.nickname || conv.user.anonymousId || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="dm-conv-content">
                  <div className="dm-conv-header">
                    <div className="dm-conv-user">
                      <span className="dm-conv-name">
                        {conv.user.nickname || `User ${conv.user._id.slice(-6)}`}
                      </span>
                      <span className="dm-conv-level">
                        <HiSparkles />
                        Level {conv.user.reputation?.level || 1}
                      </span>
                    </div>
                    {conv.lastMessage && (
                      <span className="dm-conv-time">
                        {new Date(conv.lastMessage.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="dm-conv-preview">
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <div className="dm-conv-badge">{conv.unreadCount}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DMList;
