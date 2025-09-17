import { web3Provider } from "./web3-provider"
import { didManager, type TouristDID } from "./did-manager"
import { encryptionService } from "./encryption"

export interface WalletConnection {
  address: string
  chainId: number
  did?: TouristDID
  isConnected: boolean
}

export interface TouristWallet {
  address: string
  did: TouristDID
  encryptionKeys: {
    publicKey: Uint8Array
    privateKey: Uint8Array
  }
  credentials: any[]
}

export class WalletService {
  private static instance: WalletService
  private currentWallet: TouristWallet | null = null
  private connectionListeners: ((wallet: WalletConnection | null) => void)[] = []

  private constructor() {}

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService()
    }
    return WalletService.instance
  }

  async connectWallet(): Promise<WalletConnection> {
    try {
      // Connect to Web3 wallet (MetaMask)
      const { address, chainId } = await web3Provider.connectWallet()

      // Check if DID exists for this address
      const existingDID = await this.loadDIDForAddress(address)

      const connection: WalletConnection = {
        address,
        chainId,
        did: existingDID || undefined,
        isConnected: true,
      }

      // Notify listeners
      this.notifyConnectionChange(connection)

      return connection
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      throw error
    }
  }

  async createTouristWallet(alias: string, password: string): Promise<TouristWallet> {
    try {
      // Ensure wallet is connected
      if (!web3Provider.getIsConnected()) {
        throw new Error("Wallet not connected")
      }

      const address = await web3Provider.getAddress()

      // Initialize encryption service
      await encryptionService.waitForReady()

      // Generate encryption keys for the user
      const encryptionKeys = encryptionService.generateKeyPair()

      // Create DID
      const did = await didManager.createTouristDID(alias)

      // Create wallet object
      const wallet: TouristWallet = {
        address,
        did,
        encryptionKeys,
        credentials: [],
      }

      // Store wallet data securely
      await this.storeWalletData(wallet, password)

      this.currentWallet = wallet

      // Update connection with DID
      const connection: WalletConnection = {
        address,
        chainId: await this.getCurrentChainId(),
        did,
        isConnected: true,
      }

      this.notifyConnectionChange(connection)

      return wallet
    } catch (error) {
      console.error("Failed to create tourist wallet:", error)
      throw error
    }
  }

  async loadWallet(address: string, password: string): Promise<TouristWallet> {
    try {
      const walletData = await this.loadWalletData(address, password)
      this.currentWallet = walletData

      // Update connection
      const connection: WalletConnection = {
        address,
        chainId: await this.getCurrentChainId(),
        did: walletData.did,
        isConnected: true,
      }

      this.notifyConnectionChange(connection)

      return walletData
    } catch (error) {
      console.error("Failed to load wallet:", error)
      throw error
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      await web3Provider.disconnectWallet()
      this.currentWallet = null

      this.notifyConnectionChange(null)
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
      throw error
    }
  }

  getCurrentWallet(): TouristWallet | null {
    return this.currentWallet
  }

  async signMessage(message: string): Promise<string> {
    if (!this.currentWallet) {
      throw new Error("No wallet connected")
    }

    // Sign with both Web3 wallet and DID
    const web3Signature = await web3Provider.signMessage(message)
    const didSignature = await didManager.signMessage(this.currentWallet.did.did, message)

    // Combine signatures
    return JSON.stringify({
      web3: web3Signature,
      did: didSignature,
      timestamp: Date.now(),
    })
  }

  async addCredential(credential: any): Promise<void> {
    if (!this.currentWallet) {
      throw new Error("No wallet connected")
    }

    this.currentWallet.credentials.push(credential)

    // Store updated wallet data
    const password = await this.getStoredPassword()
    if (password) {
      await this.storeWalletData(this.currentWallet, password)
    }
  }

  async getCredentials(): Promise<any[]> {
    if (!this.currentWallet) {
      return []
    }

    return this.currentWallet.credentials
  }

  onConnectionChange(listener: (wallet: WalletConnection | null) => void): () => void {
    this.connectionListeners.push(listener)

    // Return unsubscribe function
    return () => {
      const index = this.connectionListeners.indexOf(listener)
      if (index > -1) {
        this.connectionListeners.splice(index, 1)
      }
    }
  }

  private async loadDIDForAddress(address: string): Promise<TouristDID | null> {
    try {
      // Try to load from local storage first
      const storedDID = localStorage.getItem(`did_${address}`)
      if (storedDID) {
        return JSON.parse(storedDID)
      }

      return null
    } catch (error) {
      console.error("Failed to load DID for address:", error)
      return null
    }
  }

  private async storeWalletData(wallet: TouristWallet, password: string): Promise<void> {
    try {
      await encryptionService.waitForReady()

      // Encrypt wallet data
      const walletJson = JSON.stringify({
        did: wallet.did,
        encryptionKeys: {
          publicKey: Array.from(wallet.encryptionKeys.publicKey),
          privateKey: Array.from(wallet.encryptionKeys.privateKey),
        },
        credentials: wallet.credentials,
      })

      const { encryptedData, salt, nonce } = encryptionService.encryptKYCData(walletJson, password)

      // Store encrypted data
      const storageData = {
        encryptedData: Array.from(encryptedData),
        salt: Array.from(salt),
        nonce: Array.from(nonce),
      }

      localStorage.setItem(`wallet_${wallet.address}`, JSON.stringify(storageData))
      localStorage.setItem(`did_${wallet.address}`, JSON.stringify(wallet.did))
    } catch (error) {
      console.error("Failed to store wallet data:", error)
      throw error
    }
  }

  private async loadWalletData(address: string, password: string): Promise<TouristWallet> {
    try {
      const storedData = localStorage.getItem(`wallet_${address}`)
      if (!storedData) {
        throw new Error("No wallet data found")
      }

      const { encryptedData, salt, nonce } = JSON.parse(storedData)

      await encryptionService.waitForReady()

      // Decrypt wallet data
      const decryptedJson = encryptionService.decryptKYCData(
        new Uint8Array(encryptedData),
        new Uint8Array(salt),
        new Uint8Array(nonce),
        password,
      )

      const walletData = JSON.parse(decryptedJson)

      return {
        address,
        did: walletData.did,
        encryptionKeys: {
          publicKey: new Uint8Array(walletData.encryptionKeys.publicKey),
          privateKey: new Uint8Array(walletData.encryptionKeys.privateKey),
        },
        credentials: walletData.credentials || [],
      }
    } catch (error) {
      console.error("Failed to load wallet data:", error)
      throw error
    }
  }

  private async getCurrentChainId(): Promise<number> {
    try {
      const provider = web3Provider.getProvider()
      if (!provider) return 0

      const network = await provider.getNetwork()
      return Number(network.chainId)
    } catch (error) {
      console.error("Failed to get chain ID:", error)
      return 0
    }
  }

  private async getStoredPassword(): Promise<string | null> {
    // In a real app, you'd want a more secure way to handle passwords
    // This is just for demo purposes
    return sessionStorage.getItem("wallet_password")
  }

  private notifyConnectionChange(connection: WalletConnection | null): void {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(connection)
      } catch (error) {
        console.error("Error in connection listener:", error)
      }
    })
  }
}

export const walletService = WalletService.getInstance()
