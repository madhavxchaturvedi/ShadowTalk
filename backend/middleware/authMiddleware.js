import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Authorization denied.' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in database
    const user = await User.findOne({ 
      anonymousId: decoded.anonymousId,
      sessionId: decoded.sessionId,
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid session. User not found.' 
      });
    }

    // Check if user is suspended
    if (user.suspended) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been suspended.',
        suspended: true,
        suspendedReason: user.suspendedReason,
        suspendedAt: user.suspendedAt
      });
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    // Attach user to request object
    req.user = {
      id: user._id,
      anonymousId: user.anonymousId,
      sessionId: user.sessionId,
      reputation: user.reputation,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired.' 
      });
    }
    
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication.' 
    });
  }
};

export { authMiddleware };
export default authMiddleware;
