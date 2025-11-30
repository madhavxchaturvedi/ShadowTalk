import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import connectDB from './config/mongodb.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import messageRoutes from './routes/messages.js';
import dmRoutes from './routes/dms.js';
import userRoutes from './routes/users.js';
import reportRoutes from './routes/reports.js';
import migrateRoutes from './routes/migrate.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Make io and userSockets accessible to routes
app.set('io', io);
app.set('userSockets', new Map());

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Socket.io compatibility
  crossOriginEmbedderPolicy: false,
}));
app.use(mongoSanitize()); // Prevent MongoDB injection
app.use(compression()); // Compress responses

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Body Parser Middleware
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'ShadowTalk API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dms', dmRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/migrate', migrateRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);
  console.log('🔗 Transport:', socket.conn.transport.name);

  // Debug: Log all received events
  socket.onAny((eventName, ...args) => {
    console.log(`📥 Received event: ${eventName}`, args);
  });

  // Join DM session (map user ID to socket ID)
  socket.on('join_dm_session', (userId) => {
    const userSockets = app.get('userSockets');
    userSockets.set(userId, socket.id);
    console.log(`📧 User ${userId} registered for DMs with socket ${socket.id}`);
    console.log(`📊 Total registered users: ${userSockets.size}`);
  });

  // Join room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`📥 User ${socket.id} joined room ${roomId}`);
  });

  // Leave room
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`📤 User ${socket.id} left room ${roomId}`);
  });

  // Send message - handled by REST API, no need for socket handler
  // The POST /messages/:roomId endpoint will broadcast via io.to(roomId).emit('new_message')

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', {
      userId: data.userId,
      anonymousId: data.anonymousId,
    });
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.roomId).emit('user_stopped_typing', {
      userId: data.userId,
    });
  });

  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
    // Clean up user-socket mapping
    const userSockets = app.get('userSockets');
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`🗑️  Removed DM session for user ${userId}`);
        break;
      }
    }
  });
});

// Start server
httpServer.listen(PORT, () => {
  logger.success(`ShadowTalk server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY not set - AI moderation disabled, using basic keyword filter only');
  } else {
    logger.success('AI moderation enabled with OpenAI');
  }
});
