import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Auto-connect socket on import
export const socket = io(SOCKET_URL, {
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
  console.log('🔗 Socket transport:', socket.io.engine.transport.name);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error);
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
