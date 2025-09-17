import sodium from "libsodium-wrappers"

export class EncryptionService {
  private static instance: EncryptionService
  private isReady = false

  private constructor() {
    this.initialize()
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  private async initialize() {
    await sodium.ready
    this.isReady = true
  }

  async waitForReady(): Promise<void> {
    while (!this.isReady) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  generateKeyPair(): { publicKey: Uint8Array; privateKey: Uint8Array } {
    return sodium.crypto_box_keypair()
  }

  generateSymmetricKey(): Uint8Array {
    return sodium.crypto_secretbox_keygen()
  }

  encryptSymmetric(
    message: string,
    key: Uint8Array,
  ): {
    ciphertext: Uint8Array
    nonce: Uint8Array
  } {
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key)
    return { ciphertext, nonce }
  }

  decryptSymmetric(ciphertext: Uint8Array, nonce: Uint8Array, key: Uint8Array): string {
    const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key)
    return sodium.to_string(decrypted)
  }

  encryptAsymmetric(
    message: string,
    recipientPublicKey: Uint8Array,
    senderPrivateKey: Uint8Array,
  ): {
    ciphertext: Uint8Array
    nonce: Uint8Array
  } {
    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
    const ciphertext = sodium.crypto_box_easy(message, nonce, recipientPublicKey, senderPrivateKey)
    return { ciphertext, nonce }
  }

  decryptAsymmetric(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    senderPublicKey: Uint8Array,
    recipientPrivateKey: Uint8Array,
  ): string {
    const decrypted = sodium.crypto_box_open_easy(ciphertext, nonce, senderPublicKey, recipientPrivateKey)
    return sodium.to_string(decrypted)
  }

  hash(data: string): Uint8Array {
    return sodium.crypto_generichash(32, data)
  }

  generateSalt(): Uint8Array {
    return sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES)
  }

  deriveKey(password: string, salt: Uint8Array): Uint8Array {
    return sodium.crypto_pwhash(
      32,
      password,
      salt,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_DEFAULT,
    )
  }

  encryptKYCData(
    kycData: any,
    userPassword: string,
  ): {
    encryptedData: Uint8Array
    salt: Uint8Array
    nonce: Uint8Array
  } {
    const salt = this.generateSalt()
    const key = this.deriveKey(userPassword, salt)
    const { ciphertext, nonce } = this.encryptSymmetric(JSON.stringify(kycData), key)

    return {
      encryptedData: ciphertext,
      salt,
      nonce,
    }
  }

  decryptKYCData(encryptedData: Uint8Array, salt: Uint8Array, nonce: Uint8Array, userPassword: string): any {
    const key = this.deriveKey(userPassword, salt)
    const decryptedString = this.decryptSymmetric(encryptedData, nonce, key)
    return JSON.parse(decryptedString)
  }
}

export const encryptionService = EncryptionService.getInstance()
