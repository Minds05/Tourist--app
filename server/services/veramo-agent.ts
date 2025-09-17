import {
  createAgent,
  type ICredentialPlugin,
  type IDataStore,
  type IDataStoreORM,
  type IDIDManager,
  type IKeyManager,
  type IResolver,
} from "@veramo/core"
import { CredentialPlugin } from "@veramo/credential-w3c"
import { DIDManager } from "@veramo/did-manager"
import { EthrDIDProvider } from "@veramo/did-provider-ethr"
import { DIDResolverPlugin } from "@veramo/did-resolver"
import { KeyManager } from "@veramo/key-manager"
import { KeyManagementSystem, SecretBox } from "@veramo/kms-local"
import { Entities, KeyStore, DIDStore, PrivateKeyStore, migrations } from "@veramo/data-store"
import { DataSource } from "typeorm"
import { Resolver } from "did-resolver"
import { getResolver as ethrDidResolver } from "ethr-did-resolver"
import { getResolver as webDidResolver } from "web-did-resolver"

// Database configuration for Veramo
const dbConnection = new DataSource({
  type: "sqlite",
  database: process.env.VERAMO_DB_PATH || "./server/data/veramo.sqlite",
  synchronize: false,
  migrationsRun: true,
  migrations,
  entities: Entities,
  logging: ["error", "info", "warn"],
})

// Key Management System
const secretKey = process.env.VERAMO_SECRET_KEY || "29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c"

const kms = new KeyManagementSystem(new PrivateKeyStore(dbConnection, new SecretBox(secretKey)))

// DID Resolver
const resolver = new Resolver({
  ...ethrDidResolver({
    infuraProjectId: process.env.INFURA_PROJECT_ID,
    networks: [
      {
        name: "sepolia",
        chainId: 11155111,
        rpcUrl: process.env.SEPOLIA_RPC_URL || `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        registry: "0x03d5003bf0e79C5F5223588F347ebA39AfbC3818", // Sepolia DID Registry
      },
      {
        name: "mainnet",
        chainId: 1,
        rpcUrl: process.env.MAINNET_RPC_URL || `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        registry: "0xdCa7EF03e98e0DC2B855bE647C39ABe984fcF21B", // Mainnet DID Registry
      },
    ],
  }),
  ...webDidResolver(),
})

// Create Veramo agent
export const agent = createAgent<
  IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver & ICredentialPlugin
>({
  plugins: [
    new KeyManager({
      store: new KeyStore(dbConnection),
      kms: {
        local: kms,
      },
    }),
    new DIDManager({
      store: new DIDStore(dbConnection),
      defaultProvider: "did:ethr:sepolia",
      providers: {
        "did:ethr:sepolia": new EthrDIDProvider({
          defaultKms: "local",
          network: "sepolia",
          rpcUrl: process.env.SEPOLIA_RPC_URL || `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
          gas: 1000001,
          ttl: 60 * 60 * 24 * 30 * 12, // 1 year
        }),
        "did:ethr": new EthrDIDProvider({
          defaultKms: "local",
          network: "mainnet",
          rpcUrl: process.env.MAINNET_RPC_URL || `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
          gas: 1000001,
          ttl: 60 * 60 * 24 * 30 * 12, // 1 year
        }),
      },
    }),
    new DIDResolverPlugin({
      resolver,
    }),
    new CredentialPlugin(),
  ],
})

// Initialize database connection
export const initializeVeramoDatabase = async (): Promise<void> => {
  try {
    await dbConnection.initialize()
    console.log("✅ Veramo database initialized")
  } catch (error) {
    console.error("❌ Failed to initialize Veramo database:", error)
    throw error
  }
}

// Get or create issuer DID
export const getIssuerDID = async (): Promise<string> => {
  try {
    // Check if issuer DID already exists
    const existingDID = process.env.ISSUER_DID
    if (existingDID) {
      // Verify the DID exists in our store
      try {
        const did = await agent.didManagerGet({ did: existingDID })
        return did.did
      } catch (error) {
        console.warn("Configured ISSUER_DID not found in store, creating new one")
      }
    }

    // Create new issuer DID
    const identifier = await agent.didManagerCreate({
      provider: "did:ethr:sepolia",
      alias: "tourist-protection-issuer",
    })

    console.log("🆔 Created new issuer DID:", identifier.did)
    console.log("⚠️  Please update your .env file with ISSUER_DID=" + identifier.did)

    return identifier.did
  } catch (error) {
    console.error("❌ Failed to get or create issuer DID:", error)
    throw error
  }
}

// Credential schemas
export const KYC_CREDENTIAL_TYPE = "KYCCredential"
export const MEMBERSHIP_CREDENTIAL_TYPE = "GroupMembershipCredential"
export const EMERGENCY_CREDENTIAL_TYPE = "EmergencyContactCredential"

export interface KYCCredentialSubject {
  id: string // DID of the subject
  firstName?: string
  lastName?: string
  nationality?: string
  dateOfBirth?: string
  documentNumber?: string
  verificationLevel: number
  kycProvider: string
  verifiedAt: string
}

export interface GroupMembershipCredentialSubject {
  id: string // DID of the subject
  groupId: string
  groupName: string
  role: "member" | "admin"
  joinedAt: string
  nftTokenId?: string
}

export interface EmergencyCredentialSubject {
  id: string // DID of the subject
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
}
