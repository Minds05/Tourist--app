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
import { DataStore, DataStoreORM } from "@veramo/data-store"
import { DIDManager as VeramoDIDManager } from "@veramo/did-manager"
import { EthrDIDProvider } from "@veramo/did-provider-ethr"
import { DIDResolverPlugin } from "@veramo/did-resolver"
import { KeyManager } from "@veramo/key-manager"
import { KeyManagementSystem } from "@veramo/kms-local"
import { Resolver } from "did-resolver"
import { getResolver as ethrDidResolver } from "ethr-did-resolver"
import { BLOCKCHAIN_CONFIG } from "../../lib/blockchain/config"

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

export class DIDService {
  private static instance: DIDService
  private agent: any
  private isInitialized = false

  private constructor() {}

  static getInstance(): DIDService {
    if (!DIDService.instance) {
      DIDService.instance = new DIDService()
    }
    return DIDService.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Create database store (in-memory for server)
      const dbConnection = {
        type: "sqlite" as const,
        database: ":memory:",
        synchronize: true,
        logging: false,
        entities: [],
      }

      const didResolver = new Resolver({
        ...ethrDidResolver({
          infuraProjectId: process.env.INFURA_KEY,
          networks: [
            {
              name: "sepolia",
              chainId: BLOCKCHAIN_CONFIG.CHAIN_ID,
              rpcUrl: BLOCKCHAIN_CONFIG.RPC_URL,
              registry: BLOCKCHAIN_CONFIG.DID.REGISTRY_ADDRESS,
            },
          ],
        }),
      })

      // Create Veramo agent
      this.agent = createAgent<IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver & ICredentialPlugin>({
        plugins: [
          new KeyManager({
            store: new DataStore(dbConnection),
            kms: {
              local: new KeyManagementSystem(new DataStore(dbConnection)),
            },
          }),
          new VeramoDIDManager({
            store: new DataStore(dbConnection),
            defaultProvider: "did:ethr:sepolia",
            providers: {
              "did:ethr:sepolia": new EthrDIDProvider({
                defaultKms: "local",
                network: "sepolia",
                rpcUrl: BLOCKCHAIN_CONFIG.RPC_URL,
                registry: BLOCKCHAIN_CONFIG.DID.REGISTRY_ADDRESS,
              }),
            },
          }),
          new DIDResolverPlugin({
            resolver: didResolver,
          }),
          new CredentialPlugin(),
          new DataStore(dbConnection),
          new DataStoreORM(dbConnection),
        ],
      })

      this.isInitialized = true
      console.log("DID Service initialized successfully")
    } catch (error) {
      console.error("Failed to initialize DID Service:", error)
      throw error
    }
  }

  async createTouristDID(alias: string): Promise<TouristDID> {
    await this.initialize()

    try {
      const identifier = await this.agent.didManagerCreate({
        alias,
        provider: "did:ethr:sepolia",
        kms: "local",
      })

      return {
        did: identifier.did,
        controllerKeyId: identifier.controllerKeyId,
        keys: identifier.keys,
        services: identifier.services || [],
      }
    } catch (error) {
      console.error("Failed to create tourist DID:", error)
      throw error
    }
  }

  async resolveDID(did: string): Promise<any> {
    await this.initialize()

    try {
      const resolution = await this.agent.resolveDid({ didUrl: did })
      return resolution
    } catch (error) {
      console.error("Failed to resolve DID:", error)
      throw error
    }
  }

  async createVerifiableCredential(
    issuerDID: string,
    subjectDID: string,
    credentialData: any,
    credentialType: string,
  ): Promise<VerifiableCredential> {
    await this.initialize()

    try {
      const credential = await this.agent.createVerifiableCredential({
        credential: {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential", credentialType],
          issuer: { id: issuerDID },
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: subjectDID,
            ...credentialData,
          },
        },
        proofFormat: "jwt",
      })

      return credential
    } catch (error) {
      console.error("Failed to create verifiable credential:", error)
      throw error
    }
  }

  async verifyCredential(credential: VerifiableCredential): Promise<boolean> {
    await this.initialize()

    try {
      const result = await this.agent.verifyCredential({
        credential,
      })
      return result.verified
    } catch (error) {
      console.error("Failed to verify credential:", error)
      return false
    }
  }

  async listDIDs(): Promise<TouristDID[]> {
    await this.initialize()

    try {
      const identifiers = await this.agent.didManagerFind()
      return identifiers.map((id: any) => ({
        did: id.did,
        controllerKeyId: id.controllerKeyId,
        keys: id.keys,
        services: id.services || [],
      }))
    } catch (error) {
      console.error("Failed to list DIDs:", error)
      return []
    }
  }

  async signMessage(did: string, message: string): Promise<string> {
    await this.initialize()

    try {
      const identifier = await this.agent.didManagerGet({ did })
      const keyId = identifier.controllerKeyId

      const signature = await this.agent.keyManagerSign({
        keyRef: keyId,
        data: message,
      })

      return signature
    } catch (error) {
      console.error("Failed to sign message with DID:", error)
      throw error
    }
  }
}

export const didService = DIDService.getInstance()
