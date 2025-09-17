import { didManager } from "./did-manager"
import { walletService } from "./wallet-service"
import { encryptionService } from "./encryption"
import { ipfsClient } from "./ipfs-client"
import { ethers } from "ethers"
import { web3Provider } from "./web3-provider"
import { BLOCKCHAIN_CONFIG } from "./config"

export interface KYCData {
  fullName: string
  email: string
  phone: string
  bloodGroup: string
  emergencyContact: string
  nationality: string
  address: string
  documents?: {
    idDocument?: File
    addressProof?: File
    photo?: File
  }
}

export interface KYCSubmission {
  touristDID: string
  encryptedDataHash: string
  documentHashes: string[]
  submissionTimestamp: number
  verificationStatus: "pending" | "verified" | "rejected"
  verificationLevel: "basic" | "enhanced" | "premium"
}

export interface KYCVerificationResult {
  isVerified: boolean
  verificationLevel: "basic" | "enhanced" | "premium"
  verificationDate: string
  credentialId: string
  ipfsHash: string
}

export class KYCService {
  private static instance: KYCService
  private contract: ethers.Contract | null = null

  private constructor() {}

  static getInstance(): KYCService {
    if (!KYCService.instance) {
      KYCService.instance = new KYCService()
    }
    return KYCService.instance
  }

  private async getContract(): Promise<ethers.Contract> {
    if (!this.contract) {
      const provider = web3Provider.getProvider()
      const signer = web3Provider.getSigner()

      if (!provider || !signer) {
        throw new Error("Wallet not connected")
      }

      // Tourist Identity Contract ABI (simplified)
      const contractABI = [
        "function registerTourist(string memory _did, string memory _ipfsHash) external",
        "function submitKYC(string memory _ipfsHash) external",
        "function getTouristProfile(address _tourist) external view returns (tuple(string did, string ipfsHash, uint256 registrationTimestamp, bool isVerified, bool isActive, string emergencyContactDID, uint256 safetyScore))",
        "function verifyTourist(uint256 _requestId, bool _isApproved) external",
        "event TouristRegistered(address indexed tourist, string did, uint256 touristId)",
        "event KYCSubmitted(address indexed tourist, string ipfsHash, uint256 requestId)",
        "event TouristVerified(address indexed tourist, bool isVerified)",
      ]

      this.contract = new ethers.Contract(BLOCKCHAIN_CONFIG.CONTRACTS.TOURIST_IDENTITY, contractABI, signer)
    }

    return this.contract
  }

  async submitKYC(kycData: KYCData, password: string): Promise<KYCSubmission> {
    try {
      const wallet = walletService.getCurrentWallet()
      if (!wallet) {
        throw new Error("Wallet not connected")
      }

      await encryptionService.waitForReady()

      // Encrypt KYC data
      const { encryptedData, salt, nonce } = encryptionService.encryptKYCData(kycData, password)

      // Upload encrypted data to IPFS
      const encryptedDataHash = await ipfsClient.uploadEncryptedData(encryptedData)

      // Upload documents to IPFS if provided
      const documentHashes: string[] = []
      if (kycData.documents) {
        for (const [key, file] of Object.entries(kycData.documents)) {
          if (file) {
            // Encrypt document before upload
            const fileBuffer = await file.arrayBuffer()
            const fileData = new Uint8Array(fileBuffer)
            const encryptedFile = encryptionService.encryptSymmetric(
              Buffer.from(fileData).toString("base64"),
              encryptionService.generateSymmetricKey(),
            )
            const docHash = await ipfsClient.uploadEncryptedData(encryptedFile.ciphertext)
            documentHashes.push(docHash)
          }
        }
      }

      // Create metadata object
      const metadata = {
        encryptedDataHash,
        documentHashes,
        salt: Array.from(salt),
        nonce: Array.from(nonce),
        submissionTimestamp: Date.now(),
        touristDID: wallet.did.did,
      }

      // Upload metadata to IPFS
      const metadataHash = await ipfsClient.uploadJSON(metadata)

      // Submit to blockchain
      const contract = await this.getContract()
      const tx = await contract.submitKYC(metadataHash)
      await tx.wait()

      // Create KYC submission record
      const submission: KYCSubmission = {
        touristDID: wallet.did.did,
        encryptedDataHash: metadataHash,
        documentHashes,
        submissionTimestamp: Date.now(),
        verificationStatus: "pending",
        verificationLevel: "basic",
      }

      // Store submission locally for tracking
      this.storeKYCSubmission(submission)

      return submission
    } catch (error) {
      console.error("Failed to submit KYC:", error)
      throw error
    }
  }

  async registerTouristWithKYC(kycData: KYCData, password: string): Promise<KYCSubmission> {
    try {
      const wallet = walletService.getCurrentWallet()
      if (!wallet) {
        throw new Error("Wallet not connected")
      }

      // First submit KYC data
      const submission = await this.submitKYC(kycData, password)

      // Register tourist on blockchain
      const contract = await this.getContract()
      const tx = await contract.registerTourist(wallet.did.did, submission.encryptedDataHash)
      await tx.wait()

      return submission
    } catch (error) {
      console.error("Failed to register tourist with KYC:", error)
      throw error
    }
  }

  async getKYCStatus(touristAddress?: string): Promise<{
    isRegistered: boolean
    isVerified: boolean
    submissionHash?: string
    safetyScore?: number
  }> {
    try {
      const address = touristAddress || (await web3Provider.getAddress())
      const contract = await this.getContract()

      const profile = await contract.getTouristProfile(address)

      return {
        isRegistered: profile.did !== "",
        isVerified: profile.isVerified,
        submissionHash: profile.ipfsHash || undefined,
        safetyScore: Number(profile.safetyScore) || undefined,
      }
    } catch (error) {
      console.error("Failed to get KYC status:", error)
      return {
        isRegistered: false,
        isVerified: false,
      }
    }
  }

  async retrieveKYCData(ipfsHash: string, password: string): Promise<KYCData> {
    try {
      await encryptionService.waitForReady()

      // Retrieve metadata from IPFS
      const metadata = await ipfsClient.retrieveJSON(ipfsHash)

      // Retrieve encrypted data
      const encryptedData = await ipfsClient.retrieveFile(metadata.encryptedDataHash)

      // Decrypt KYC data
      const decryptedData = encryptionService.decryptKYCData(
        encryptedData,
        new Uint8Array(metadata.salt),
        new Uint8Array(metadata.nonce),
        password,
      )

      return decryptedData
    } catch (error) {
      console.error("Failed to retrieve KYC data:", error)
      throw error
    }
  }

  async createKYCCredential(kycData: KYCData, verificationLevel: "basic" | "enhanced" | "premium"): Promise<any> {
    try {
      const wallet = walletService.getCurrentWallet()
      if (!wallet) {
        throw new Error("Wallet not connected")
      }

      // Create verifiable credential for KYC
      const credential = await didManager.createKYCCredential(
        wallet.did.did, // Self-issued for now, in production this would be an authority
        wallet.did.did,
        {
          name: kycData.fullName,
          email: kycData.email,
          phone: kycData.phone,
          nationality: kycData.nationality,
          verificationLevel,
          verificationDate: new Date().toISOString(),
        },
      )

      // Add credential to wallet
      await walletService.addCredential(credential)

      return credential
    } catch (error) {
      console.error("Failed to create KYC credential:", error)
      throw error
    }
  }

  async verifyKYCCredential(credential: any): Promise<boolean> {
    try {
      return await didManager.verifyCredential(credential)
    } catch (error) {
      console.error("Failed to verify KYC credential:", error)
      return false
    }
  }

  private storeKYCSubmission(submission: KYCSubmission): void {
    try {
      const submissions = this.getStoredSubmissions()
      submissions.push(submission)
      localStorage.setItem("kyc_submissions", JSON.stringify(submissions))
    } catch (error) {
      console.error("Failed to store KYC submission:", error)
    }
  }

  private getStoredSubmissions(): KYCSubmission[] {
    try {
      const stored = localStorage.getItem("kyc_submissions")
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to get stored submissions:", error)
      return []
    }
  }

  async getSubmissionHistory(): Promise<KYCSubmission[]> {
    return this.getStoredSubmissions()
  }

  async calculateVerificationLevel(kycData: KYCData): Promise<"basic" | "enhanced" | "premium"> {
    // Basic verification: name, email, phone
    let score = 0

    if (kycData.fullName && kycData.email && kycData.phone) {
      score += 30
    }

    // Enhanced verification: + address, nationality, emergency contact
    if (kycData.address && kycData.nationality && kycData.emergencyContact) {
      score += 30
    }

    // Premium verification: + documents
    if (kycData.documents) {
      const docCount = Object.values(kycData.documents).filter(Boolean).length
      score += docCount * 15
    }

    if (score >= 75) return "premium"
    if (score >= 45) return "enhanced"
    return "basic"
  }
}

export const kycService = KYCService.getInstance()
