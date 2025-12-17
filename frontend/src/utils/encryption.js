/**
 * End-to-End Encryption Utilities
 * Uses Web Crypto API for RSA-OAEP encryption
 */

const ENCRYPTION_ALGORITHM = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
};

/**
 * Generate RSA key pair for encryption
 * @returns {Promise<{publicKey: string, privateKey: CryptoKey}>}
 */
export const generateKeyPair = async () => {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      ENCRYPTION_ALGORITHM,
      true, // extractable
      ['encrypt', 'decrypt']
    );

    // Export public key to store on server
    const exportedPublicKey = await window.crypto.subtle.exportKey(
      'spki',
      keyPair.publicKey
    );
    const publicKeyString = arrayBufferToBase64(exportedPublicKey);

    // Store private key in IndexedDB (never send to server!)
    await storePrivateKey(keyPair.privateKey);

    return {
      publicKey: publicKeyString,
      privateKey: keyPair.privateKey,
    };
  } catch (error) {
    console.error('Key generation failed:', error);
    throw new Error('Failed to generate encryption keys');
  }
};

/**
 * Import public key from base64 string
 * @param {string} publicKeyString - Base64 encoded public key
 * @returns {Promise<CryptoKey>}
 */
export const importPublicKey = async (publicKeyString) => {
  try {
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyString);
    return await window.crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      ENCRYPTION_ALGORITHM,
      true,
      ['encrypt']
    );
  } catch (error) {
    console.error('Public key import failed:', error);
    throw new Error('Failed to import public key');
  }
};

/**
 * Encrypt message with recipient's public key
 * @param {string} message - Plain text message
 * @param {string} recipientPublicKey - Base64 encoded public key
 * @returns {Promise<string>} - Base64 encoded encrypted message
 */
export const encryptMessage = async (message, recipientPublicKey) => {
  try {
    const publicKey = await importPublicKey(recipientPublicKey);
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      data
    );

    return arrayBufferToBase64(encrypted);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt message');
  }
};

/**
 * Decrypt message with user's private key
 * @param {string} encryptedMessage - Base64 encoded encrypted message
 * @returns {Promise<string>} - Decrypted plain text
 */
export const decryptMessage = async (encryptedMessage) => {
  try {
    const privateKey = await getPrivateKey();
    if (!privateKey) {
      throw new Error('Private key not found');
    }

    const encryptedBuffer = base64ToArrayBuffer(encryptedMessage);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt message');
  }
};

/**
 * Store private key in IndexedDB
 * @param {CryptoKey} privateKey
 */
const storePrivateKey = async (privateKey) => {
  try {
    const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
    const privateKeyString = arrayBufferToBase64(exported);
    localStorage.setItem('shadowtalk_private_key', privateKeyString);
  } catch (error) {
    console.error('Failed to store private key:', error);
  }
};

/**
 * Retrieve private key from IndexedDB
 * @returns {Promise<CryptoKey|null>}
 */
const getPrivateKey = async () => {
  try {
    const privateKeyString = localStorage.getItem('shadowtalk_private_key');
    if (!privateKeyString) return null;

    const privateKeyBuffer = base64ToArrayBuffer(privateKeyString);
    return await window.crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      ENCRYPTION_ALGORITHM,
      true,
      ['decrypt']
    );
  } catch (error) {
    console.error('Failed to retrieve private key:', error);
    return null;
  }
};

/**
 * Check if user has encryption keys
 * @returns {Promise<boolean>}
 */
export const hasEncryptionKeys = async () => {
  const privateKey = await getPrivateKey();
  return privateKey !== null;
};

/**
 * Convert ArrayBuffer to Base64 string
 */
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Convert Base64 string to ArrayBuffer
 */
const base64ToArrayBuffer = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Initialize encryption for new user
 * Generates key pair and returns public key to send to server
 */
export const initializeEncryption = async () => {
  const hasKeys = await hasEncryptionKeys();
  if (hasKeys) {
    // User already has keys, just get public key
    const privateKey = await getPrivateKey();
    const publicKey = await window.crypto.subtle.exportKey('spki', privateKey);
    return arrayBufferToBase64(publicKey);
  }

  // Generate new keys
  const { publicKey } = await generateKeyPair();
  return publicKey;
};
