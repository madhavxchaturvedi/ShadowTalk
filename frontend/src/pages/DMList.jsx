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
        setConversations(res.data.data.conversations);
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
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-[var(--bg-tertiary)] border-t-[var(--accent)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 mt-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Direct Messages</h1>
          <p className="text-[var(--text-secondary)]">Private conversations</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors font-medium"
        >
          Back to Rooms
        </button>
      </div>

      {conversations.length === 0 ? (
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
                    <h3 className="text-lg font-bold">{conv.user.anonymousId}</h3>
                    <span className="text-xs text-[var(--text-secondary)]">
                      Level {conv.user.reputation.level}
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
  );
};

export default DMList;
