import { create } from "ipfs-http-client"
import { encrypt, decrypt } from "../utils/encryption"

export class IPFSService {
  private client: any

  constructor() {
    const projectId = process.env.IPFS_PROJECT_ID
    const projectSecret = process.env.IPFS_PROJECT_SECRET

    if (projectId && projectSecret) {
      const auth = "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64")
      this.client = create({
        host: "ipfs.infura.io",
        port: 5001,
        protocol: "https",
        headers: {
          authorization: auth,
        },
      })
    } else {
      // Fallback to local IPFS node
      this.client = create({
        host: "localhost",
        port: 5001,
        protocol: "http",
      })
    }
  }

  /**
   * Store encrypted data on IPFS
   */
  async storeEncrypted(data: any, encryptionKey?: string): Promise<string> {
    try {
      const dataString = JSON.stringify(data)
      const encryptedData = encryptionKey ? encrypt(dataString, encryptionKey) : dataString

      const result = await this.client.add(encryptedData)
      return result.cid.toString()
    } catch (error) {
      console.error("Failed to store data on IPFS:", error)
      throw new Error("Failed to store data on IPFS: " + error.message)
    }
  }

  /**
   * Retrieve and decrypt data from IPFS
   */
  async retrieveDecrypted(cid: string, encryptionKey?: string): Promise<any> {
    try {
      const chunks = []
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk)
      }

      const data = Buffer.concat(chunks).toString()
      const decryptedData = encryptionKey ? decrypt(data, encryptionKey) : data

      return JSON.parse(decryptedData)
    } catch (error) {
      console.error("Failed to retrieve data from IPFS:", error)
      throw new Error("Failed to retrieve data from IPFS: " + error.message)
    }
  }

  /**
   * Store credential on IPFS
   */
  async storeCredential(credential: any): Promise<string> {
    try {
      const result = await this.client.add(JSON.stringify(credential))
      return result.cid.toString()
    } catch (error) {
      console.error("Failed to store credential on IPFS:", error)
      throw new Error("Failed to store credential on IPFS: " + error.message)
    }
  }

  /**
   * Retrieve credential from IPFS
   */
  async retrieveCredential(cid: string): Promise<any> {
    try {
      const chunks = []
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk)
      }

      const data = Buffer.concat(chunks).toString()
      return JSON.parse(data)
    } catch (error) {
      console.error("Failed to retrieve credential from IPFS:", error)
      throw new Error("Failed to retrieve credential from IPFS: " + error.message)
    }
  }

  /**
   * Pin content to ensure persistence
   */
  async pinContent(cid: string): Promise<void> {
    try {
      await this.client.pin.add(cid)
      console.log(`Content pinned: ${cid}`)
    } catch (error) {
      console.error("Failed to pin content:", error)
      // Don't throw error as content is already stored
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService()
