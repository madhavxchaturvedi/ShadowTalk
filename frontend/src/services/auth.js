import api from './api';

// Persistent ShadowID authentication - find or create user
export const anonAuth = async (shadowId = null, nickname = null, password = null) => {
  try {
    const response = await api.post('/auth/anon', { shadowId, nickname, password });
    const { token, user } = response.data.data;

    // Store token and user in localStorage
    localStorage.setItem('shadowtalk_token', token);
    localStorage.setItem('shadowtalk_user', JSON.stringify(user));
    if (user.shadowId) {
      localStorage.setItem('shadowtalk_shadowId', user.shadowId);
    }

    return { 
      success: true, 
      token, 
      user, 
      isNew: response.status === 201,
      requiresPassword: false,
    };
  } catch (error) {
    console.error('Anon auth error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to authenticate',
      requiresPassword: error.response?.data?.requiresPassword || false,
    };
  }
};

// Create new anonymous session
export const createSession = async () => {
  try {
    const response = await api.post('/auth/create-session');
    const { token, user } = response.data.data;

    // Store token and user in localStorage
    localStorage.setItem('shadowtalk_token', token);
    localStorage.setItem('shadowtalk_user', JSON.stringify(user));

    return { success: true, token, user };
  } catch (error) {
    console.error('Create session error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create session',
    };
  }
};

// Validate existing session
export const joinSession = async (token) => {
  try {
    const response = await api.post('/auth/join-session', { token });
    const { user } = response.data.data;

    // Update user in localStorage
    localStorage.setItem('shadowtalk_user', JSON.stringify(user));

    return { success: true, user };
  } catch (error) {
    console.error('Join session error:', error);
    
    // Clear invalid token
    localStorage.removeItem('shadowtalk_token');
    localStorage.removeItem('shadowtalk_user');
    
    return {
      success: false,
      message: error.response?.data?.message || 'Session validation failed',
    };
  }
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('shadowtalk_user');
  return userStr ? JSON.parse(userStr) : null;
};

// Get current token
export const getToken = () => {
  return localStorage.getItem('shadowtalk_token');
};

// Get stored shadowId
export const getShadowId = () => {
  return localStorage.getItem('shadowtalk_shadowId');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Logout - clear session
export const logout = () => {
  localStorage.removeItem('shadowtalk_token');
  localStorage.removeItem('shadowtalk_user');
  localStorage.removeItem('shadowtalk_shadowId');
  localStorage.removeItem('shadowtalk_setup_seen'); // Clear setup flag to show choice screen
  window.location.href = '/';
};
