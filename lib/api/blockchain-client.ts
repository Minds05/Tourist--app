export class BlockchainClient {
  private baseUrl = "/api/blockchain"

  async getNetworkInfo() {
    const response = await fetch(`${this.baseUrl}/network`)
    if (!response.ok) {
      throw new Error("Failed to get network info")
    }
    return response.json()
  }

  async getBalance(address: string) {
    const response = await fetch(`${this.baseUrl}/balance/${address}`)
    if (!response.ok) {
      throw new Error("Failed to get balance")
    }
    return response.json()
  }

  async getTransactionReceipt(hash: string) {
    const response = await fetch(`${this.baseUrl}/transaction/${hash}`)
    if (!response.ok) {
      throw new Error("Failed to get transaction receipt")
    }
    return response.json()
  }

  async createDID(alias: string) {
    const response = await fetch(`${this.baseUrl}/did/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ alias }),
    })
    if (!response.ok) {
      throw new Error("Failed to create DID")
    }
    return response.json()
  }

  async resolveDID(did: string) {
    const response = await fetch(`${this.baseUrl}/did/resolve/${encodeURIComponent(did)}`)
    if (!response.ok) {
      throw new Error("Failed to resolve DID")
    }
    return response.json()
  }

  async createCredential(issuerDID: string, subjectDID: string, credentialData: any, credentialType: string) {
    const response = await fetch(`${this.baseUrl}/credential/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        issuerDID,
        subjectDID,
        credentialData,
        credentialType,
      }),
    })
    if (!response.ok) {
      throw new Error("Failed to create credential")
    }
    return response.json()
  }

  async verifyCredential(credential: any) {
    const response = await fetch(`${this.baseUrl}/credential/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credential }),
    })
    if (!response.ok) {
      throw new Error("Failed to verify credential")
    }
    return response.json()
  }

  async listDIDs() {
    const response = await fetch(`${this.baseUrl}/did/list`)
    if (!response.ok) {
      throw new Error("Failed to list DIDs")
    }
    return response.json()
  }
}

export const blockchainClient = new BlockchainClient()
