// Client-side IPFS API wrapper
const API_BASE = process.env.NODE_ENV === "production" ? "https://your-api-domain.com/api" : "http://localhost:3001/api"

export class IPFSClient {
  private getAuthHeaders() {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    }
  }

  async storeData(data: any, encryptionKey?: string): Promise<string> {
    const response = await fetch(`${API_BASE}/ipfs/store`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ data, encryptionKey }),
    })

    if (!response.ok) {
      throw new Error("Failed to store data on IPFS")
    }

    const result = await response.json()
    return result.cid
  }

  async retrieveData(cid: string, encryptionKey?: string): Promise<any> {
    const url = new URL(`${API_BASE}/ipfs/retrieve/${cid}`)
    if (encryptionKey) {
      url.searchParams.set("encryptionKey", encryptionKey)
    }

    const response = await fetch(url.toString(), {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Failed to retrieve data from IPFS")
    }

    const result = await response.json()
    return result.data
  }

  async storeCredential(credential: any): Promise<string> {
    const response = await fetch(`${API_BASE}/ipfs/store-credential`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ credential }),
    })

    if (!response.ok) {
      throw new Error("Failed to store credential on IPFS")
    }

    const result = await response.json()
    return result.cid
  }

  async retrieveCredential(cid: string): Promise<any> {
    const response = await fetch(`${API_BASE}/ipfs/retrieve-credential/${cid}`, {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Failed to retrieve credential from IPFS")
    }

    const result = await response.json()
    return result.credential
  }
}

export const ipfsClient = new IPFSClient()
