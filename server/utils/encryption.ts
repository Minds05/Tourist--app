import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Derive key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256")
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(text: string, password: string): string {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    const key = deriveKey(password, salt)

    const cipher = crypto.createCipherGCM(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    const tag = cipher.getAuthTag()

    // Combine salt + iv + tag + encrypted data
    const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, "hex")])
    return result.toString("base64")
  } catch (error) {
    throw new Error("Encryption failed: " + error.message)
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encryptedData: string, password: string): string {
  try {
    const data = Buffer.from(encryptedData, "base64")

    const salt = data.subarray(0, SALT_LENGTH)
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

    const key = deriveKey(password, salt)

    const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, undefined, "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    throw new Error("Decryption failed: " + error.message)
  }
}

/**
 * Generate random encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Hash data using SHA-256
 */
export function hashData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex")
}
