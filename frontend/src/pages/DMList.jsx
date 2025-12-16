import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px' }}>
        <div className="w-12 h-12 border-4 border-[var(--bg-tertiary)] border-t-[var(--accent)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="main-header">
        <div>
          <h1>Direct Messages</h1>
          <p>Private conversations</p>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{ 
            padding: '12px 24px', 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border)', 
            borderRadius: '12px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.borderColor = 'var(--accent)'}
          onMouseLeave={(e) => e.target.style.borderColor = 'var(--border)'}
        >
          Back to Rooms
        </button>
      </div>

      <div className="main-body">{conversations.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-12 text-center">
          <h3 className="text-xl font-bold mb-2">No conversations yet</h3>
          <p className="text-[var(--text-secondary)]">
            Start a conversation by clicking on a user's profile in a room
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <div
              key={conv.user._id}
              onClick={() => navigate(`/dm/${conv.user._id}`)}
              className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--accent)] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold">
                      {conv.user.nickname || `User ${conv.user._id.slice(-6)}`}
                    </h3>
                    <span className="text-xs text-[var(--text-secondary)]">
                      Level {conv.user.reputation?.level || 1}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="bg-[var(--accent)] text-white text-xs px-2 py-1 rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
                {conv.lastMessage && (
                  <div className="text-xs text-[var(--text-secondary)]">
                    {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default DMList;
