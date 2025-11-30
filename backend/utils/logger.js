// Simple logging utility for production
const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  log(message, ...args) {
    console.log(`[${new Date().toISOString()}] INFO:`, message, ...args);
  }

  info(message, ...args) {
    console.log(`[${new Date().toISOString()}] ℹ️  INFO:`, message, ...args);
  }

  warn(message, ...args) {
    console.warn(`[${new Date().toISOString()}] ⚠️  WARN:`, message, ...args);
  }

  error(message, error, ...args) {
    console.error(`[${new Date().toISOString()}] ❌ ERROR:`, message, ...args);
    if (error) {
      console.error('Error details:', error);
      if (error.stack && isDevelopment) {
        console.error('Stack trace:', error.stack);
      }
    }
  }

  success(message, ...args) {
    console.log(`[${new Date().toISOString()}] ✅ SUCCESS:`, message, ...args);
  }
}

const logger = new Logger();

export default logger;
