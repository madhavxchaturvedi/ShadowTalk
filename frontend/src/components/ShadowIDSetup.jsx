import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  HiShieldCheck, 
  HiLockClosed, 
  HiCheck, 
  HiArrowLeft, 
  HiUserPlus, 
  HiArrowRightOnRectangle 
} from 'react-icons/hi2';
import { anonAuth } from '../services/auth';
import { updateUser } from '../store/slices/authSlice';

const ShadowIDSetup = ({ onComplete }) => {
  const user = useSelector(state => state.auth.user);
  const [mode, setMode] = useState('choice'); // 'choice', 'setup', 'login', 'success'
  const [nickname, setNickname] = useState('');
  const [shadowIdInput, setShadowIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdShadowId, setCreatedShadowId] = useState('');
  const dispatch = useDispatch();

  const handleCreateNew = () => {
    // Just switch to setup mode - user will be created when they click Continue
    setMode('setup');
    setError('');
  };

  const handleLoginExisting = () => {
    setMode('login');
    setError('');
  };

  const handleStart = async () => {
    // Validate password if provided
    if (password) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    setError('');
    
    try {
      // Create new account with optional nickname and password
      // Don't pass shadowId - let backend generate it
      const result = await anonAuth(null, nickname.trim() || null, password || null);
      if (result.success) {
        dispatch(updateUser(result.user));
        setCreatedShadowId(result.user.shadowId);
        setMode('success');
      } else {
        setError(result.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithShadowId = async () => {
    console.log('🔐 handleLoginWithShadowId called');
    if (!shadowIdInput.trim()) {
      setError('Please enter your ShadowID');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('🔑 Calling anonAuth with shadowId:', shadowIdInput, 'password:', password ? '***' : 'none');
      const result = await anonAuth(shadowIdInput.trim(), null, password || null);
      console.log('📥 anonAuth result:', result);
      
      if (result.success) {
        console.log('✅ Login successful, calling onComplete');
        dispatch(updateUser(result.user));
        onComplete();
      } else if (result.requiresPassword && !password) {
        console.log('🔒 Password required');
        setError('This ShadowID is password protected. Please enter your password.');
      } else {
        console.log('❌ Login failed:', result.message);
        setError(result.message || 'ShadowID not found. Please check and try again.');
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      setError('Failed to login. Please try again.');
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  // Choice screen - Create new or login existing
  if (mode === 'choice') {
    return (
      <div className="shadowid-setup">
        <div className="shadowid-container">
          {/* Logo */}
          <div className="shadowid-logo">
            <div className="shadowid-logo-icon">
              <HiShieldCheck />
            </div>
            <h1 className="shadowid-title">ShadowTalk</h1>
            <p className="shadowid-subtitle">Anonymous. Secure. Persistent.</p>
          </div>

          {/* Choice Card */}
          <div className="shadowid-card">
            <h2 className="shadowid-card-title">Get Started</h2>

            <div className="shadowid-buttons">
              <button
                onClick={handleCreateNew}
                disabled={loading}
                className="shadowid-btn primary"
              >
                <HiUserPlus />
                {loading ? 'Creating...' : 'Create New Shadow Identity'}
              </button>

              <button
                onClick={handleLoginExisting}
                disabled={loading}
                className="shadowid-btn secondary"
              >
                <HiArrowRightOnRectangle />
                I Have a ShadowID
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="shadowid-info success">
            <HiLockClosed />
            <span>Your ShadowID is permanent and works across all devices</span>
          </div>
        </div>
      </div>
    );
  }

  // Login with existing ShadowID
  if (mode === 'login') {
    return (
      <div className="shadowid-setup">
        <div className="shadowid-container">
          {/* Logo */}
          <div className="shadowid-logo">
            <div className="shadowid-logo-icon">
              <HiShieldCheck />
            </div>
            <h1 className="shadowid-title">ShadowTalk</h1>
            <p className="shadowid-subtitle">Welcome Back</p>
          </div>

          {/* Login Card */}
          <div className="shadowid-card">
            <div className="shadowid-card-header">
              <HiArrowRightOnRectangle className="shadowid-header-icon" />
              <h2 className="shadowid-card-title">Enter Your ShadowID</h2>
            </div>

            {error && (
              <div className="shadowid-error">
                {error}
              </div>
            )}

            <div className="shadowid-form">
              <div className="shadowid-form-group">
                <label htmlFor="shadowIdInput" className="shadowid-label">
                  ShadowID
                </label>
                <input
                  id="shadowIdInput"
                  type="text"
                  value={shadowIdInput}
                  onChange={(e) => setShadowIdInput(e.target.value)}
                  placeholder="e.g., ShadowABC123"
                  className="shadowid-input shadowid-code"
                />
              </div>

              <div className="shadowid-form-group">
                <label htmlFor="loginPassword" className="shadowid-label">
                  Password (if protected)
                </label>
                <input
                  id="loginPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (optional)"
                  className="shadowid-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLoginWithShadowId();
                    }
                  }}
                />
              </div>

              <button
                onClick={handleLoginWithShadowId}
                disabled={!shadowIdInput.trim() || loading}
                className="shadowid-btn primary"
              >
                <HiArrowRightOnRectangle />
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <button
                onClick={() => setMode('choice')}
                className="shadowid-btn back"
              >
                <HiArrowLeft />
                Back
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="shadowid-info info">
            <span>Your ShadowID is usually in format: Shadow + 6 characters (e.g., ShadowABC123)</span>
          </div>
        </div>
      </div>
    );
  }

  // Success screen - Show created ShadowID
  if (mode === 'success') {
    return (
      <div className="shadowid-setup">
        <div className="shadowid-container">
          {/* Logo */}
          <div className="shadowid-logo">
            <div className="shadowid-logo-icon success">
              <HiCheck />
            </div>
            <h1 className="shadowid-title">Success!</h1>
            <p className="shadowid-subtitle">Your Shadow Identity is Ready</p>
          </div>

          {/* Success Card */}
          <div className="shadowid-card">
            <div className="shadowid-success-content">
              <div className="shadowid-success-label">
                <HiLockClosed />
                <span>Your Shadow Identity</span>
              </div>
              <div className="shadowid-code-display">
                {createdShadowId}
              </div>
              <div className="shadowid-success-hint">
                Click to select and copy
              </div>
            </div>

            <div className="shadowid-warning">
              <div className="shadowid-warning-title">⚠️ Important: Save This ShadowID!</div>
              <ul className="shadowid-warning-list">
                <li>• This is your only way to access your account</li>
                <li>• There is NO password recovery</li>
                <li>• Save it in a safe place (password manager, notes, etc.)</li>
              </ul>
            </div>

            <button
              onClick={onComplete}
              className="shadowid-btn primary"
            >
              <HiCheck />
              I've Saved My ShadowID - Let's Go!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup screen (existing code for new users or nickname setup)
  return (
    <div className="shadowid-setup">
      <div className="shadowid-container">
        {/* Logo */}
        <div className="shadowid-logo">
          <div className="shadowid-logo-icon">
            <HiShieldCheck />
          </div>
          <h1 className="shadowid-title">ShadowTalk</h1>
          <p className="shadowid-subtitle">Your Shadow Identity</p>
        </div>

        {/* Setup Card */}
        <div className="shadowid-card">
          <div className="shadowid-card-intro">
            <h2 className="shadowid-card-title">Create Your Identity</h2>
            <p className="shadowid-card-desc">Your ShadowID will be generated automatically</p>
          </div>

          <div className="shadowid-form">
            {error && (
              <div className="shadowid-error">
                {error}
              </div>
            )}

            <div className="shadowid-form-group">
              <label htmlFor="nickname" className="shadowid-label">
                Choose a Nickname (optional)
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                placeholder="e.g., CoolDude, MysticOwl..."
                maxLength={20}
                className="shadowid-input"
              />
              <div className="shadowid-char-count">
                {nickname.length}/20 characters
              </div>
            </div>

            <div className="shadowid-form-group">
              <label htmlFor="setupPassword" className="shadowid-label with-icon">
                <HiLockClosed />
                Protect with Password (optional)
              </label>
              <input
                id="setupPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                className="shadowid-input"
              />
              <div className="shadowid-hint">
                Secure your ShadowID with a password
              </div>
            </div>

            {password && (
              <div className="shadowid-form-group">
                <label htmlFor="confirmPassword" className="shadowid-label">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="shadowid-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleStart();
                    }
                  }}
                />
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={loading}
              className="shadowid-btn primary"
            >
              <HiUserPlus />
              {loading ? 'Creating Account...' : 'Create My ShadowID'}
            </button>

            <button
              onClick={() => setMode('choice')}
              className="shadowid-btn back"
            >
              <HiArrowLeft />
              Back
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="shadowid-info success">
          <div className="shadowid-info-title">
            <HiShieldCheck />
            Your identity is persistent!
          </div>
          <ul className="shadowid-info-list">
            <li>• Your ShadowID stays the same across devices</li>
            <li>• Change your nickname anytime</li>
            <li>• Points and reputation are saved</li>
            <li>• Refresh = instant restore</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShadowIDSetup;
