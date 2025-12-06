/**
 * Keep-Alive utility to prevent Render free tier from spinning down
 * Pings the server periodically to keep it active
 */

const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (Render spins down after 15 mins of inactivity)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let pingIntervalId = null;
let lastActivityTime = Date.now();

/**
 * Ping the server to keep it alive
 */
const pingServer = async () => {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      console.log('🏓 Keep-alive ping successful');
    }
  } catch (error) {
    console.warn('⚠️ Keep-alive ping failed:', error.message);
  }
};

/**
 * Start the keep-alive pinger
 * Only pings when user is active (has interacted in last 30 mins)
 */
export const startKeepAlive = () => {
  if (pingIntervalId) {
    console.log('Keep-alive already running');
    return;
  }

  // Initial ping
  pingServer();

  // Set up interval
  pingIntervalId = setInterval(() => {
    const timeSinceLastActivity = Date.now() - lastActivityTime;
    const thirtyMinutes = 30 * 60 * 1000;

    // Only ping if user was active in last 30 minutes
    if (timeSinceLastActivity < thirtyMinutes) {
      pingServer();
    } else {
      console.log('⏸️ User inactive, skipping keep-alive ping');
    }
  }, PING_INTERVAL);

  // Track user activity
  const updateActivity = () => {
    lastActivityTime = Date.now();
  };

  // Listen for user interactions
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, updateActivity, { passive: true });
  });

  console.log('✅ Keep-alive service started (14-minute intervals)');
};

/**
 * Stop the keep-alive pinger
 */
export const stopKeepAlive = () => {
  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
    console.log('❌ Keep-alive service stopped');
  }
};

/**
 * Manually trigger a ping (useful before important actions)
 */
export const warmupServer = async () => {
  console.log('🔥 Warming up server...');
  await pingServer();
};
