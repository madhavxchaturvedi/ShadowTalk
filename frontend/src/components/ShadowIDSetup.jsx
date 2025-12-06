import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiUserPlus, FiLogIn, FiShield, FiLock, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { anonAuth } from '../services/auth';
import { updateUser } from '../store/slices/authSlice';

const ShadowIDSetup = ({ onComplete }) => {
  const user = useSelector(state => state.auth.user);
  const [mode, setMode] = useState(user ? 'setup' : 'choice'); // 'choice', 'setup', 'login'
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [shadowIdInput, setShadowIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const handleCreateNew = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Create a new anonymous session with auto-generated ShadowID
      const result = await anonAuth();
      if (result.success) {
        dispatch(updateUser(result.user));
        // Switch to setup mode to let user optionally add nickname
        setMode('setup');
      } else {
        setError(result.message || 'Failed to create identity');
      }
    } catch (error) {
      console.error('Create new error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginExisting = () => {
    setMode('login');
    setError('');
  };

  const handleStart = async () => {
    if (mode === 'setup' && !nickname.trim() && !user) {
      // Allow skip for new users
      onComplete();
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await anonAuth(user?.shadowId, nickname.trim() || null);
      if (result.success) {
        dispatch(updateUser(result.user));
        onComplete();
      } else {
        setError(result.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithShadowId = async () => {
    if (!shadowIdInput.trim()) {
      setError('Please enter your ShadowID');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await anonAuth(shadowIdInput.trim());
      if (result.success) {
        dispatch(updateUser(result.user));
        onComplete();
      } else {
        setError('ShadowID not found. Please check and try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to login. Please try again.');
    } finally {
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
                  onChange={(e) => setShadowIdInput(e.target.value.toUpperCase())}
                  placeholder="e.g., ShadowABC123"
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    letterSpacing: '1px'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleLoginWithShadowId()}
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
            <div className="text-sm mb-3 flex items-center justify-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <FiLock className="w-4 h-4" />
              Your Shadow Identity
            </div>
            <div 
              className="text-3xl font-bold px-6 py-4 rounded-lg inline-block"
              style={{ 
                background: 'var(--accent)',
                color: 'white',
                letterSpacing: '2px',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
              }}
            >
              {user?.shadowId || 'Shadow...'}
            </div>
            <div className="text-xs mt-3 flex items-center justify-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <FiCheck className="w-4 h-4 text-green-500" />
              This ID is yours forever. Save it!
            </div>
          </div>

          <div className="space-y-4">
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
                onKeyPress={(e) => e.key === 'Enter' && handleStart()}
              />
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {nickname.length}/20 characters
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!nickname.trim() || loading}
              className="w-full py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: 'var(--accent)',
                color: 'white',
                fontSize: '16px'
              }}
            >
              <FiCheck className="w-5 h-5" />
              {loading ? 'Saving...' : nickname.trim() ? `Start as ${nickname}` : 'Enter Nickname'}
            </button>

            <button
              onClick={onComplete}
              className="w-full py-3 rounded-lg font-semibold transition-all"
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                fontSize: '14px'
              }}
            >
              Skip for now
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
