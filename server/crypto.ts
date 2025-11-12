import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get or generate encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
  const keyEnv = process.env.SETTINGS_ENCRYPTION_KEY;
  
  if (!keyEnv) {
    throw new Error(
      'SETTINGS_ENCRYPTION_KEY environment variable is required for encrypting sensitive settings. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }
  
  // Convert hex string to buffer
  const keyBuffer = Buffer.from(keyEnv, 'hex');
  
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `SETTINGS_ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes). ` +
      `Current length: ${keyBuffer.length} bytes. Generate with: openssl rand -hex 32`
    );
  }
  
  return keyBuffer;
}

/**
 * Encrypt a value using AES-256-GCM
 * Returns a JSON string containing the ciphertext, IV, and auth tag
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return as JSON string containing all components
    return JSON.stringify({
      ciphertext,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    });
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt value');
  }
}

/**
 * Decrypt a value encrypted with AES-256-GCM
 * Expects a JSON string containing ciphertext, IV, and auth tag
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const { ciphertext, iv, authTag } = JSON.parse(encryptedData);
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt value - data may be corrupted or encryption key changed');
  }
}

/**
 * Mask a sensitive value for display purposes
 * Shows only first and last few characters
 */
export function maskValue(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars * 2) {
    return '••••••••';
  }
  
  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  return `${start}••••${end}`;
}
