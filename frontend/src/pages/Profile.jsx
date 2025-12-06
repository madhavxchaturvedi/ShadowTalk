import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import api from '../services/api';
import { anonAuth } from '../services/auth';
import { updateUser } from '../store/slices/authSlice';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [savingNickname, setSavingNickname] = useState(false);

  // Manual refresh user data
  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Fetch user by ID to get updated reputation
      const response = await api.get(`/users/${user._id}`);
      console.log('Refreshed user data:', response.data);
      dispatch(updateUser(response.data.data.user));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!nickname.trim() || savingNickname) return;

    setSavingNickname(true);
    try {
      const result = await anonAuth(user.shadowId, nickname.trim());
      if (result.success) {
        dispatch(updateUser(result.user));
        setEditingNickname(false);
      }
    } catch (error) {
      console.error('Failed to update nickname:', error);
      alert('Failed to update nickname');
    } finally {
      setSavingNickname(false);
    }
  };

  if (!user) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ padding: '32px' }}>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div style={{ 
          background: 'linear-gradient(to right, var(--accent), var(--accent-hover))', 
          padding: '48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={refreshUserData}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <div className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
              Anonymous User
            </div>
          </div>
        </div>

        <div className="p-12">
          <div className="mb-8">
            <h2 className="text-xl mb-4 text-[var(--text-secondary)]">Identity</h2>
            <div className="space-y-3">
              {user.shadowId && (
                <div className="flex justify-between py-3 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Shadow ID:</span>
                  <span className="font-bold text-lg" style={{ color: 'var(--accent)', letterSpacing: '1px' }}>
                    {user.shadowId}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Nickname:</span>
                {editingNickname ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                      placeholder="Enter nickname..."
                      maxLength={20}
                      className="px-3 py-1 rounded border"
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      onClick={handleSaveNickname}
                      disabled={!nickname.trim() || savingNickname}
                      className="px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
                      style={{ background: 'var(--accent)', color: 'white' }}
                    >
                      {savingNickname ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingNickname(false);
                        setNickname(user.nickname || '');
                      }}
                      className="px-3 py-1 rounded text-sm"
                      style={{ background: 'var(--bg-tertiary)' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.nickname || 'Not set'}</span>
                    <button
                      onClick={() => setEditingNickname(true)}
                      className="text-sm px-2 py-1 rounded"
                      style={{ color: 'var(--accent)' }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-between py-3 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Anonymous ID:</span>
                <span className="font-medium">{user.anonymousId}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Member Since:</span>
                <span className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl mb-4 text-[var(--text-secondary)]">Reputation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <div className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg p-8 flex items-center gap-6">
                <div className="text-4xl">⭐</div>
                <div>
                  <div className="text-3xl font-bold">{user.reputation?.level || 1}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Level</div>
                </div>
              </div>
              <div className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg p-8 flex items-center gap-6">
                <div className="text-4xl">💎</div>
                <div>
                  <div className="text-3xl font-bold">{user.reputation?.points || 0}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Points</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl mb-4 text-[var(--text-secondary)]">Badges</h2>
            <div className="flex flex-wrap gap-2">
              {user.reputation?.badges && user.reputation.badges.length > 0 ? (
                user.reputation.badges.map((badge, index) => (
                  <div 
                    key={index} 
                    className="bg-[var(--accent)] text-white px-4 py-2 rounded-full text-sm font-medium"
                  >
                    🏆 {badge.name}
                  </div>
                ))
              ) : (
                <p className="text-[var(--text-secondary)] italic">
                  No badges yet. Start participating to earn badges!
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[var(--border)]">
            <h2 className="text-xl mb-4 text-[var(--text-secondary)]">How to Earn Points</h2>
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-xl">💬</span>
                <div>
                  <div className="font-medium mb-1">Send Messages (+1 point)</div>
                  <div className="text-[var(--text-secondary)]">
                    Post messages in rooms to earn 1 point each
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">👍</span>
                <div>
                  <div className="font-medium mb-1">React to Messages (+0.5 points)</div>
                  <div className="text-[var(--text-secondary)]">
                    Give reactions to earn 0.5 points each
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">❤️</span>
                <div>
                  <div className="font-medium mb-1">Receive Reactions (+1 point)</div>
                  <div className="text-[var(--text-secondary)]">
                    Get 1 point when someone reacts to your message
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">📨</span>
                <div>
                  <div className="font-medium mb-1">Send DMs (+0.5 points)</div>
                  <div className="text-[var(--text-secondary)]">
                    Send private messages to earn 0.5 points each
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">📈</span>
                <div>
                  <div className="font-medium mb-1">Level Up (Every 50 points)</div>
                  <div className="text-[var(--text-secondary)]">
                    Every 100 points = 1 level increase
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🏆</span>
                <div>
                  <div className="font-medium mb-1">Unlock Badges</div>
                  <div className="text-[var(--text-secondary)]">
                    Newcomer (10), Regular (50), Veteran (100), Legend (500), Master (1000)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
