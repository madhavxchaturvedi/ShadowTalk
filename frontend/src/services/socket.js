import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Configure socket with optimized settings for Render (handles cold starts)
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000, // 20 seconds for initial connection (handle cold starts)
  transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
});

socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
  console.log('🔗 Socket transport:', socket.io.engine.transport.name);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket disconnected:', reason);
  if (reason === 'io server disconnect') {
    // Server disconnected, reconnect manually
    socket.connect();
  }
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error.message);
  console.log('⏳ Will retry connection...');
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`🔄 Reconnection attempt #${attemptNumber}...`);
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`✅ Reconnected after ${attemptNumber} attempts`);
});

socket.on('reconnect_failed', () => {
  console.error('❌ Failed to reconnect after all attempts');
});

// Debug: Log all emitted events
const originalEmit = socket.emit;
socket.emit = function(...args) {
  console.log('📤 Emitting socket event:', args[0], 'Data:', args[1]);
  return originalEmit.apply(this, args);
};

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default socket;
