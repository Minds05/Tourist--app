import {
  agent,
  getIssuerDID,
  KYC_CREDENTIAL_TYPE,
  MEMBERSHIP_CREDENTIAL_TYPE,
  EMERGENCY_CREDENTIAL_TYPE,
} from "./veramo-agent"
import type { KYCCredentialSubject, GroupMembershipCredentialSubject, EmergencyCredentialSubject } from "./veramo-agent"
import { v4 as uuidv4 } from "uuid"
import { User } from "../models/User"

export class CredentialService {
  private issuerDID: string | null = null

  async initialize(): Promise<void> {
    this.issuerDID = await getIssuerDID()
  }

  private async getIssuerDID(): Promise<string> {
    if (!this.issuerDID) {
      this.issuerDID = await getIssuerDID()
    }
    return this.issuerDID
  }

  /**
   * Issue KYC Credential
   */
  async issueKYCCredential(
    subjectDID: string,
    kycData: {
      firstName?: string
      lastName?: string
      nationality?: string
      dateOfBirth?: string
      documentNumber?: string
      verificationLevel: number
    },
  ): Promise<any> {
    try {
      const issuerDID = await this.getIssuerDID()
      const credentialId = `urn:uuid:${uuidv4()}`

      const credentialSubject: KYCCredentialSubject = {
        id: subjectDID,
        ...kycData,
        kycProvider: "Tourist Protection System",
        verifiedAt: new Date().toISOString(),
      }

      const credential = await agent.createVerifiableCredential({
        credential: {
          "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://schema.org",
            {
              KYCCredential: "https://tourist-protection.com/schemas/KYCCredential",
              verificationLevel: "https://tourist-protection.com/schemas/verificationLevel",
              kycProvider: "https://tourist-protection.com/schemas/kycProvider",
            },
          ],
          id: credentialId,
          type: ["VerifiableCredential", KYC_CREDENTIAL_TYPE],
          issuer: { id: issuerDID },
          issuanceDate: new Date().toISOString(),
          credentialSubject,
        },
        proofFormat: "jwt",
      })

      // Store credential reference in user record
      await this.storeCredentialReference(subjectDID, {
        credentialId,
        type: KYC_CREDENTIAL_TYPE,
        credential: credential.proof.jwt,
      })

      return {
        credentialId,
        credential: credential.proof.jwt,
        type: KYC_CREDENTIAL_TYPE,
      }
    } catch (error) {
      console.error("Failed to issue KYC credential:", error)
      throw new Error("Failed to issue KYC credential: " + error.message)
    }
  }

  /**
   * Issue Group Membership Credential
   */
  async issueGroupMembershipCredential(
    subjectDID: string,
    groupData: {
      groupId: string
      groupName: string
      role: "member" | "admin"
      nftTokenId?: string
    },
  ): Promise<any> {
    try {
      const issuerDID = await this.getIssuerDID()
      const credentialId = `urn:uuid:${uuidv4()}`

      const credentialSubject: GroupMembershipCredentialSubject = {
        id: subjectDID,
        ...groupData,
        joinedAt: new Date().toISOString(),
      }

      const credential = await agent.createVerifiableCredential({
        credential: {
          "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://schema.org",
            {
              GroupMembershipCredential: "https://tourist-protection.com/schemas/GroupMembershipCredential",
              groupId: "https://tourist-protection.com/schemas/groupId",
              role: "https://tourist-protection.com/schemas/role",
            },
          ],
          id: credentialId,
          type: ["VerifiableCredential", MEMBERSHIP_CREDENTIAL_TYPE],
          issuer: { id: issuerDID },
          issuanceDate: new Date().toISOString(),
          credentialSubject,
        },
        proofFormat: "jwt",
      })

      // Store credential reference
      await this.storeCredentialReference(subjectDID, {
        credentialId,
        type: MEMBERSHIP_CREDENTIAL_TYPE,
        credential: credential.proof.jwt,
      })

      return {
        credentialId,
        credential: credential.proof.jwt,
        type: MEMBERSHIP_CREDENTIAL_TYPE,
      }
    } catch (error) {
      console.error("Failed to issue group membership credential:", error)
      throw new Error("Failed to issue group membership credential: " + error.message)
    }
  }

  /**
   * Issue Emergency Contact Credential
   */
  async issueEmergencyCredential(
    subjectDID: string,
    emergencyData: {
      emergencyContacts: Array<{
        name: string
        phoneNumber: string
        relationship: string
      }>
      medicalInfo?: {
        allergies?: string[]
        medications?: string[]
        bloodType?: string
        medicalConditions?: string[]
      }
    },
  ): Promise<any> {
    try {
      const issuerDID = await this.getIssuerDID()
      const credentialId = `urn:uuid:${uuidv4()}`

      const credentialSubject: EmergencyCredentialSubject = {
        id: subjectDID,
        ...emergencyData,
      }

      const credential = await agent.createVerifiableCredential({
        credential: {
          "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://schema.org",
            {
              EmergencyContactCredential: "https://tourist-protection.com/schemas/EmergencyContactCredential",
              emergencyContacts: "https://tourist-protection.com/schemas/emergencyContacts",
              medicalInfo: "https://tourist-protection.com/schemas/medicalInfo",
            },
          ],
          id: credentialId,
          type: ["VerifiableCredential", EMERGENCY_CREDENTIAL_TYPE],
          issuer: { id: issuerDID },
          issuanceDate: new Date().toISOString(),
          credentialSubject,
        },
        proofFormat: "jwt",
      })

      // Store credential reference
      await this.storeCredentialReference(subjectDID, {
        credentialId,
        type: EMERGENCY_CREDENTIAL_TYPE,
        credential: credential.proof.jwt,
      })

      return {
        credentialId,
        credential: credential.proof.jwt,
        type: EMERGENCY_CREDENTIAL_TYPE,
      }
    } catch (error) {
      console.error("Failed to issue emergency credential:", error)
      throw new Error("Failed to issue emergency credential: " + error.message)
    }
  }

  /**
   * Verify Verifiable Presentation
   */
  async verifyPresentation(presentation: any): Promise<{ verified: boolean; errors: string[] }> {
    try {
      const result = await agent.verifyPresentation({
        presentation,
      })

      return {
        verified: result.verified,
        errors: result.error ? [result.error.message] : [],
      }
    } catch (error) {
      return {
        verified: false,
        errors: [error.message],
      }
    }
  }

  /**
   * Verify Verifiable Credential
   */
  async verifyCredential(credential: any): Promise<{ verified: boolean; errors: string[] }> {
    try {
      const result = await agent.verifyCredential({
        credential,
      })

      return {
        verified: result.verified,
        errors: result.error ? [result.error.message] : [],
      }
    } catch (error) {
      return {
        verified: false,
        errors: [error.message],
      }
    }
  }

  /**
   * Revoke Credential
   */
  async revokeCredential(credentialId: string, reason?: string): Promise<void> {
    try {
      // Update credential status in database
      const user = await User.findOne({ "credentials.credentialId": credentialId })
      if (user) {
        const credential = user.credentials.find((c) => c.credentialId === credentialId)
        if (credential) {
          credential.status = "revoked"
          await user.save()
        }
      }

      // TODO: Update on-chain revocation list
      console.log(`Credential ${credentialId} revoked. Reason: ${reason || "No reason provided"}`)
    } catch (error) {
      console.error("Failed to revoke credential:", error)
      throw new Error("Failed to revoke credential: " + error.message)
    }
  }

  /**
   * Store credential reference in user record
   */
  private async storeCredentialReference(
    subjectDID: string,
    credentialData: {
      credentialId: string
      type: string
      credential: string
    },
  ): Promise<void> {
    try {
      const user = await User.findOne({ did: subjectDID })
      if (user) {
        user.credentials.push({
          credentialId: credentialData.credentialId,
          type: credentialData.type,
          ipfsCid: "", // Will be updated when stored on IPFS
          issuedAt: new Date(),
          status: "active",
        })
        await user.save()
      }
    } catch (error) {
      console.error("Failed to store credential reference:", error)
      // Don't throw error as credential was successfully created
    }
  }

  /**
   * Get user credentials
   */
  async getUserCredentials(userDID: string): Promise<any[]> {
    try {
      const user = await User.findOne({ did: userDID })
      if (!user) {
        return []
      }

      return user.credentials.filter((c) => c.status === "active")
    } catch (error) {
      console.error("Failed to get user credentials:", error)
      return []
    }
  }
}

// Export singleton instance
export const credentialService = new CredentialService()
