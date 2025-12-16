import crypto from 'crypto';

// Use a secret key from environment variable (must be set in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

/**
 * Hash a ShadowID before storing in database (for searchable storage)
 * Using HMAC-SHA256 which produces the same output for the same input
 */
export const hashShadowId = (shadowId) => {
  if (!shadowId) return null;
  return crypto.createHmac('sha256', ENCRYPTION_KEY).update(shadowId).digest('hex');
};

/**
 * We don't need to decrypt hashes - they're one-way
 * But keep this function for backward compatibility
 */
export const decryptShadowId = (hashedShadowId) => {
  // Hashes can't be decrypted - this is intentional for security
  return null;
};
