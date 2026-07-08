import crypto from 'crypto';
import config from '../config';

/**
 * AES-256-GCM encryption utility for storing sensitive secrets
 * (e.g. FBR bearer tokens) at rest in the database.
 *
 * Output format: <iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 *
 * - Key: process.env.ENCRYPTION_KEY (must be exactly 32 bytes / 256 bits)
 * - IV : 12 random bytes (GCM recommended)
 * - Tag: 16 bytes (default GCM tag)
 *
 * SECURITY NOTES:
 * - Rotating the key is a breaking change; add a key-version prefix if you need rotation.
 * - Do NOT log ciphertext or plaintext. Do NOT expose in responses.
 */
const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY = Buffer.from(config.encryptionKey, 'utf8');

if (KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 bytes for AES-256-GCM');
}

export const encrypt = (plaintext: string): string => {
  if (typeof plaintext !== 'string') {
    throw new TypeError('encrypt() expects a string');
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decrypt = (payload: string): string => {
  if (typeof payload !== 'string') {
    throw new TypeError('decrypt() expects a string');
  }
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }
  const [ivHex, tagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
};

/** Mask a secret for logs / audit trails: keeps first 4 and last 4 chars. */
export const maskSecret = (secret: string | null | undefined): string => {
  if (!secret) return '***';
  if (secret.length <= 8) return '****';
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
};
