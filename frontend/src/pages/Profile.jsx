import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { HiPencil, HiCheck, HiXMark, HiArrowPath, HiSparkles, HiTrophy, HiChatBubbleLeft, HiHeart, HiEnvelope } from 'react-icons/hi2';
import api from '../services/api';
import { anonAuth } from '../services/auth';
import { updateUser } from '../store/slices/authSlice';
import Toast from '../components/Toast';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [savingNickname, setSavingNickname] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Manual refresh user data
  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Fetch user by ID to get updated reputation
      const response = await api.get(`/users/${user._id}`);
      console.log('Refreshed user data:', response.data);
      dispatch(updateUser(response.data.data.user));
      setToastMessage('Profile refreshed successfully!');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      setToastMessage('Failed to refresh profile');
      setToastType('error');
      setShowToast(true);
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
        setToastMessage('Nickname updated successfully!');
        setToastType('success');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Failed to update nickname:', error);
      setToastMessage('Failed to update nickname');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSavingNickname(false);
    }
  };

  if (!user) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const currentLevel = user.reputation?.level || 1;
  const currentPoints = user.reputation?.points || 0;
  const pointsForNextLevel = currentLevel * 100;
  const progressPercentage = (currentPoints % 100) / 100 * 100;

  return (
    <>
      {showToast && (
        <Toast 
          message={toastMessage}
          type={toastType}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />
      )}
      
      <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-banner">
            <div className="profile-banner-gradient"></div>
          </div>
          <div className="profile-header-content">
            <div className="profile-avatar">
              <div className="profile-avatar-inner">
                <HiSparkles className="profile-avatar-icon" />
              </div>
              <div className="profile-level-badge">
                {currentLevel}
              </div>
            </div>
            <div className="profile-header-info">
              <h1 className="profile-name">{user.nickname || 'Anonymous User'}</h1>
              <div className="profile-meta">
                <span className="profile-id">#{user.anonymousId?.slice(-4)}</span>
                <span className="profile-separator">•</span>
                <span>Level {currentLevel}</span>
              </div>
            </div>
            <button
              onClick={refreshUserData}
              disabled={loading}
              className="profile-refresh-btn"
            >
              <HiArrowPath className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          {/* Identity Section */}
          <div className="profile-section">
            <h2 className="section-title">Identity</h2>
            <div className="info-grid">
              {user.shadowId && (
                <div className="info-item">
                  <span className="info-label">Shadow ID</span>
                  <span className="info-value shadow-id">{user.shadowId}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Nickname</span>
                {editingNickname ? (
                  <div className="nickname-edit">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                      placeholder="Enter nickname..."
                      maxLength={20}
                      className="nickname-input"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveNickname}
                      disabled={!nickname.trim() || savingNickname}
                      className="icon-btn icon-btn-success"
                    >
                      <HiCheck />
                    </button>
                    <button
                      onClick={() => {
                        setEditingNickname(false);
                        setNickname(user.nickname || '');
                      }}
                      className="icon-btn icon-btn-danger"
                    >
                      <HiXMark />
                    </button>
                  </div>
                ) : (
                  <div className="nickname-display">
                    <span className="info-value">{user.nickname || 'Not set'}</span>
                    <button
                      onClick={() => setEditingNickname(true)}
                      className="edit-btn"
                    >
                      <HiPencil />
                    </button>
                  </div>
                )}
              </div>
              <div className="info-item">
                <span className="info-label">Anonymous ID</span>
                <span className="info-value">{user.anonymousId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Member Since</span>
                <span className="info-value">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Reputation Section */}
          <div className="profile-section">
            <h2 className="section-title">Reputation</h2>
            
            {/* Level Progress */}
            <div className="level-progress-card">
              <div className="level-progress-header">
                <span className="level-progress-label">Level {currentLevel} Progress</span>
                <span className="level-progress-value">{currentPoints % 100} / 100 XP</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card stat-card-accent">
                <div className="stat-icon">
                  <HiSparkles />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{currentLevel}</div>
                  <div className="stat-label">Level</div>
                </div>
              </div>
              <div className="stat-card stat-card-primary">
                <div className="stat-icon">
                  <HiTrophy />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{currentPoints}</div>
                  <div className="stat-label">Total Points</div>
                </div>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="profile-section">
            <h2 className="section-title">Badges</h2>
            <div className="badges-container">
              {user.reputation?.badges && user.reputation.badges.length > 0 ? (
                user.reputation.badges.map((badge, index) => (
                  <div key={index} className="badge">
                    <HiTrophy className="badge-icon" />
                    {badge.name}
                  </div>
                ))
              ) : (
                <p className="empty-state">
                  No badges yet. Start participating to earn badges!
                </p>
              )}
            </div>
          </div>

          {/* How to Earn Points */}
          <div className="profile-section">
            <h2 className="section-title">How to Earn Points</h2>
            <div className="earn-points-grid">
              <div className="earn-point-item">
                <div className="earn-point-icon"><HiChatBubbleLeft /></div>
                <div className="earn-point-info">
                  <div className="earn-point-title">Send Messages</div>
                  <div className="earn-point-desc">Post messages in rooms to earn 1 point each</div>
                  <div className="earn-point-value">+1 point</div>
                </div>
              </div>
              <div className="earn-point-item">
                <div className="earn-point-icon"><HiHeart /></div>
                <div className="earn-point-info">
                  <div className="earn-point-title">React to Messages</div>
                  <div className="earn-point-desc">Give reactions to earn 0.5 points each</div>
                  <div className="earn-point-value">+0.5 points</div>
                </div>
              </div>
              <div className="earn-point-item">
                <div className="earn-point-icon"><HiHeart /></div>
                <div className="earn-point-info">
                  <div className="earn-point-title">Receive Reactions</div>
                  <div className="earn-point-desc">Get 1 point when someone reacts to your message</div>
                  <div className="earn-point-value">+1 point</div>
                </div>
              </div>
              <div className="earn-point-item">
                <div className="earn-point-icon"><HiEnvelope /></div>
                <div className="earn-point-info">
                  <div className="earn-point-title">Send DMs</div>
                  <div className="earn-point-desc">Send private messages to earn 0.5 points each</div>
                  <div className="earn-point-value">+0.5 points</div>
                </div>
              </div>
              <div className="earn-point-item">
                <div className="earn-point-icon"><HiSparkles /></div>
                <div className="earn-point-info">
                  <div className="earn-point-title">Level Up</div>
                  <div className="earn-point-desc">Every 100 points = 1 level increase</div>
                  <div className="earn-point-value">Keep going!</div>
                </div>
              </div>
              <div className="earn-point-item">
                <div className="earn-point-icon"><HiTrophy /></div>
                <div className="earn-point-info">
                  <div className="earn-point-title">Unlock Badges</div>
                  <div className="earn-point-desc">Newcomer (10), Regular (50), Veteran (100), Legend (500)</div>
                  <div className="earn-point-value">Achievements</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Profile;
