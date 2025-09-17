import { blockchainClient } from "../api/blockchain-client"

export interface TouristDID {
  did: string
  controllerKeyId: string
  keys: Array<{
    kid: string
    kms: string
    type: string
    publicKeyHex: string
  }>
  services: Array<{
    id: string
    type: string
    serviceEndpoint: string
  }>
}

export interface VerifiableCredential {
  "@context": string[]
  id: string
  type: string[]
  issuer: string
  issuanceDate: string
  credentialSubject: any
  proof: any
}

export class DIDManager {
  private static instance: DIDManager

  private constructor() {}

  static getInstance(): DIDManager {
    if (!DIDManager.instance) {
      DIDManager.instance = new DIDManager()
    }
    return DIDManager.instance
  }

  async createTouristDID(alias: string): Promise<TouristDID> {
    return blockchainClient.createDID(alias)
  }

  async resolveDID(did: string): Promise<any> {
    return blockchainClient.resolveDID(did)
  }

  async createVerifiableCredential(
    issuerDID: string,
    subjectDID: string,
    credentialData: any,
    credentialType: string,
  ): Promise<VerifiableCredential> {
    return blockchainClient.createCredential(issuerDID, subjectDID, credentialData, credentialType)
  }

  async verifyCredential(credential: VerifiableCredential): Promise<boolean> {
    const result = await blockchainClient.verifyCredential(credential)
    return result.verified
  }

  async createKYCCredential(
    issuerDID: string,
    touristDID: string,
    kycData: {
      name: string
      email: string
      phone: string
      nationality: string
      verificationLevel: "basic" | "enhanced" | "premium"
      verificationDate: string
    },
  ): Promise<VerifiableCredential> {
    return this.createVerifiableCredential(issuerDID, touristDID, kycData, "KYCCredential")
  }

  async createTravelCredential(
    issuerDID: string,
    touristDID: string,
    travelData: {
      destination: string
      startDate: string
      endDate: string
      purpose: string
      safetyScore: number
    },
  ): Promise<VerifiableCredential> {
    return this.createVerifiableCredential(issuerDID, touristDID, travelData, "TravelCredential")
  }

  async createEmergencyCredential(
    issuerDID: string,
    touristDID: string,
    emergencyData: {
      bloodGroup: string
      allergies: string[]
      medicalConditions: string[]
      emergencyContact: {
        name: string
        phone: string
        relationship: string
      }
    },
  ): Promise<VerifiableCredential> {
    return this.createVerifiableCredential(issuerDID, touristDID, emergencyData, "EmergencyCredential")
  }

  async listDIDs(): Promise<TouristDID[]> {
    return blockchainClient.listDIDs()
  }

  async getDIDByAlias(alias: string): Promise<TouristDID | null> {
    try {
      const dids = await this.listDIDs()
      return dids.find((did) => did.did.includes(alias)) || null
    } catch (error) {
      console.error("Failed to get DID by alias:", error)
      return null
    }
  }

  async signMessage(did: string, message: string): Promise<string> {
    // Note: Message signing requires wallet interaction, not server-side operation
    throw new Error("Message signing must be done through wallet provider")
  }
}

export const didManager = DIDManager.getInstance()
