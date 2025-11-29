// Input validation utilities

export const validateRoomName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Room name is required and must be a string' };
  }
  
  if (name.length < 3 || name.length > 50) {
    return { valid: false, message: 'Room name must be between 3 and 50 characters' };
  }
  
  return { valid: true };
};

export const validateMessageContent = (content) => {
  if (!content || typeof content !== 'string') {
    return { valid: false, message: 'Message content is required and must be a string' };
  }
  
  if (content.trim().length === 0) {
    return { valid: false, message: 'Message cannot be empty' };
  }
  
  if (content.length > 2000) {
    return { valid: false, message: 'Message must be 2000 characters or less' };
  }
  
  return { valid: true };
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
};
