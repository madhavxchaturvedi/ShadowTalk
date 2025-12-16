import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiUserPlus, FiLogIn, FiShield, FiLock, FiCheck, FiArrowLeft } from 'react-icons/fi';
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-md w-full">
          {/* Shadow Logo/Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: 'var(--accent)', boxShadow: '0 0 30px var(--accent)' }}>
              <FiShield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              ShadowTalk
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Anonymous. Secure. Persistent.
            </p>
          </div>

          {/* Choice Card */}
          <div 
            className="p-8 rounded-xl mb-6"
            style={{ 
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              boxShadow: '0 10px 40px var(--shadow)'
            }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
              Get Started
            </h2>

            <div className="space-y-3">
              <button
                onClick={handleCreateNew}
                disabled={loading}
                className="w-full py-4 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  fontSize: '16px'
                }}
              >
                <FiUserPlus className="w-5 h-5" />
                {loading ? 'Creating...' : 'Create New Shadow Identity'}
              </button>

              <button
                onClick={handleLoginExisting}
                disabled={loading}
                className="w-full py-4 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  fontSize: '16px'
                }}
              >
                <FiLogIn className="w-5 h-5" />
                I Have a ShadowID
              </button>
            </div>
          </div>

          {/* Info */}
          <div 
            className="p-4 rounded-lg text-sm text-center flex items-center justify-center gap-2"
            style={{ 
              background: 'var(--success-light)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--success)'
            }}
          >
            <FiLock className="w-4 h-4" />
            Your ShadowID is permanent and works across all devices
          </div>
        </div>
      </div>
    );
  }

  // Login with existing ShadowID
  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-md w-full">
          {/* Shadow Logo/Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: 'var(--accent)', boxShadow: '0 0 30px var(--accent)' }}>
              <FiShield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              ShadowTalk
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Welcome Back
            </p>
          </div>

          {/* Login Card */}
          <div 
            className="p-8 rounded-xl mb-6"
            style={{ 
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              boxShadow: '0 10px 40px var(--shadow)'
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <FiLogIn className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Enter Your ShadowID
              </h2>
            </div>

            {error && (
              <div 
                className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2"
                style={{ 
                  background: 'var(--danger-light)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--danger)'
                }}
              >
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label 
                  htmlFor="shadowIdInput" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  ShadowID
                </label>
                <input
                  id="shadowIdInput"
                  type="text"
                  value={shadowIdInput}
                  onChange={(e) => setShadowIdInput(e.target.value)}
                  placeholder="e.g., ShadowABC123"
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    letterSpacing: '1px'
                  }}
                />
              </div>

              <div>
                <label 
                  htmlFor="loginPassword" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Password (if protected)
                </label>
                <input
                  id="loginPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (optional)"
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '16px'
                  }}
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
                className="w-full py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  fontSize: '16px'
                }}
              >
                <FiLogIn className="w-5 h-5" />
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <button
                onClick={() => setMode('choice')}
                className="w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  fontSize: '14px'
                }}
              >
                <FiArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>

          {/* Info */}
          <div 
            className="p-4 rounded-lg text-sm"
            style={{ 
              background: 'var(--info-light)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'var(--info)'
            }}
          >
            Your ShadowID is usually in format: Shadow + 6 characters (e.g., ShadowABC123)
          </div>
        </div>
      </div>
    );
  }

  // Success screen - Show created ShadowID
  if (mode === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-md w-full">
          {/* Shadow Logo/Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: 'var(--accent)', boxShadow: '0 0 30px var(--accent)' }}>
              <FiCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Success!
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Your Shadow Identity is Ready
            </p>
          </div>

          {/* Success Card */}
          <div 
            className="p-8 rounded-xl mb-6"
            style={{ 
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              boxShadow: '0 10px 40px var(--shadow)'
            }}
          >
            <div className="text-center mb-6">
              <div className="text-sm mb-3 flex items-center justify-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <FiLock className="w-4 h-4" />
                Your Shadow Identity
              </div>
              <div 
                className="text-3xl font-bold px-6 py-4 rounded-lg inline-block select-all"
                style={{ 
                  background: 'var(--accent)',
                  color: 'white',
                  letterSpacing: '2px',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                }}
              >
                {createdShadowId}
              </div>
              <div className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
                Click to select and copy
              </div>
            </div>

            <div 
              className="p-4 rounded-lg text-sm mb-6"
              style={{ 
                background: 'var(--warning-light)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: 'var(--warning)'
              }}
            >
              <div className="font-semibold mb-2">⚠️ Important: Save This ShadowID!</div>
              <ul className="space-y-1 text-xs">
                <li>• This is your only way to access your account</li>
                <li>• There is NO password recovery</li>
                <li>• Save it in a safe place (password manager, notes, etc.)</li>
              </ul>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: 'var(--accent)',
                color: 'white',
                fontSize: '16px'
              }}
            >
              <FiCheck className="w-5 h-5" />
              I've Saved My ShadowID - Let's Go!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup screen (existing code for new users or nickname setup)
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full">
        {/* Shadow Logo/Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: 'var(--accent)', boxShadow: '0 0 30px var(--accent)' }}>
            <FiShield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            ShadowTalk
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Your Shadow Identity
          </p>
        </div>

        {/* ShadowID Card */}
        <div 
          className="p-8 rounded-xl mb-6"
          style={{ 
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 40px var(--shadow)'
          }}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Create Your Identity
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Your ShadowID will be generated automatically
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div 
                className="p-3 rounded-lg text-sm flex items-center gap-2"
                style={{ 
                  background: 'var(--danger-light)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--danger)'
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label 
                htmlFor="nickname" 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Choose a Nickname (optional)
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                placeholder="e.g., CoolDude, MysticOwl..."
                maxLength={20}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '16px'
                }}
              />
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {nickname.length}/20 characters
              </div>
            </div>

            <div>
              <label 
                htmlFor="setupPassword" 
                className="text-sm font-medium mb-2 flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <FiLock className="w-4 h-4" />
                Protect with Password (optional)
              </label>
              <input
                id="setupPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '16px'
                }}
              />
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Secure your ShadowID with a password
              </div>
            </div>

            {password && (
              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '16px'
                  }}
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
              className="w-full py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: 'var(--accent)',
                color: 'white',
                fontSize: '16px'
              }}
            >
              <FiUserPlus className="w-5 h-5" />
              {loading ? 'Creating Account...' : 'Create My ShadowID'}
            </button>

            <button
              onClick={() => setMode('choice')}
              className="w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                fontSize: '14px'
              }}
            >
              <FiArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>

        {/* Info */}
        <div 
          className="p-4 rounded-lg text-sm"
          style={{ 
            background: 'var(--success-light)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--success)'
          }}
        >
          <div className="font-semibold mb-2 flex items-center gap-2">
            <FiShield className="w-4 h-4" />
            Your identity is persistent!
          </div>
          <ul className="space-y-1 text-xs">
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
