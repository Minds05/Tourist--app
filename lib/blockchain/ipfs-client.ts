import { create, type IPFSHTTPClient } from "ipfs-http-client"
import { BLOCKCHAIN_CONFIG } from "./config"

export class IPFSClient {
  private static instance: IPFSClient
  private client: IPFSHTTPClient

  private constructor() {
    const auth = `${BLOCKCHAIN_CONFIG.IPFS.PROJECT_ID}:${BLOCKCHAIN_CONFIG.IPFS.PROJECT_SECRET}`
    const authHeader = `Basic ${Buffer.from(auth).toString("base64")}`

    this.client = create({
      host: BLOCKCHAIN_CONFIG.IPFS.HOST,
      port: BLOCKCHAIN_CONFIG.IPFS.PORT,
      protocol: BLOCKCHAIN_CONFIG.IPFS.PROTOCOL,
      headers: {
        authorization: authHeader,
      },
    })
  }

  static getInstance(): IPFSClient {
    if (!IPFSClient.instance) {
      IPFSClient.instance = new IPFSClient()
    }
    return IPFSClient.instance
  }

  async uploadJSON(data: any): Promise<string> {
    try {
      const jsonString = JSON.stringify(data)
      const result = await this.client.add(jsonString)
      return result.cid.toString()
    } catch (error) {
      console.error("Failed to upload to IPFS:", error)
      throw error
    }
  }

  async uploadFile(file: File): Promise<string> {
    try {
      const result = await this.client.add(file)
      return result.cid.toString()
    } catch (error) {
      console.error("Failed to upload file to IPFS:", error)
      throw error
    }
  }

  async uploadEncryptedData(encryptedData: Uint8Array): Promise<string> {
    try {
      const result = await this.client.add(encryptedData)
      return result.cid.toString()
    } catch (error) {
      console.error("Failed to upload encrypted data to IPFS:", error)
      throw error
    }
  }

  async retrieveJSON(cid: string): Promise<any> {
    try {
      const chunks = []
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk)
      }
      const data = Buffer.concat(chunks).toString()
      return JSON.parse(data)
    } catch (error) {
      console.error("Failed to retrieve from IPFS:", error)
      throw error
    }
  }

  async retrieveFile(cid: string): Promise<Uint8Array> {
    try {
      const chunks = []
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk)
      }
      return new Uint8Array(Buffer.concat(chunks))
    } catch (error) {
      console.error("Failed to retrieve file from IPFS:", error)
      throw error
    }
  }

  getGatewayUrl(cid: string): string {
    return `https://ipfs.io/ipfs/${cid}`
  }
}

export const ipfsClient = IPFSClient.getInstance()
