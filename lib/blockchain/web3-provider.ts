import { ethers } from "ethers"
import { MetaMaskSDK } from "@metamask/sdk"
import { BLOCKCHAIN_CONFIG, SUPPORTED_CHAINS } from "./config"

export class Web3Provider {
  private static instance: Web3Provider
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.Signer | null = null
  private metaMaskSDK: MetaMaskSDK | null = null
  private isConnected = false

  private constructor() {
    this.initializeMetaMask()
  }

  static getInstance(): Web3Provider {
    if (!Web3Provider.instance) {
      Web3Provider.instance = new Web3Provider()
    }
    return Web3Provider.instance
  }

  private initializeMetaMask() {
    if (typeof window !== "undefined") {
      this.metaMaskSDK = new MetaMaskSDK({
        dappMetadata: {
          name: "Tourist Protection App",
          url: window.location.href,
        },
        // infuraAPIKey removed - using direct wallet connection only
      })
    }
  }

  async connectWallet(): Promise<{ address: string; chainId: number }> {
    try {
      if (!this.metaMaskSDK) {
        throw new Error("MetaMask SDK not initialized")
      }

      const ethereum = this.metaMaskSDK.getProvider()
      if (!ethereum) {
        throw new Error("MetaMask not found")
      }

      // Request account access
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[]

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found")
      }

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(ethereum)
      this.signer = await this.provider.getSigner()

      // Check and switch to correct network
      const network = await this.provider.getNetwork()
      const chainId = Number(network.chainId)

      if (chainId !== BLOCKCHAIN_CONFIG.CHAIN_ID) {
        await this.switchNetwork()
      }

      this.isConnected = true

      return {
        address: accounts[0],
        chainId: chainId,
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      throw error
    }
  }

  async switchNetwork(): Promise<void> {
    try {
      const ethereum = this.metaMaskSDK?.getProvider()
      if (!ethereum) throw new Error("MetaMask not found")

      const chainConfig = SUPPORTED_CHAINS[0]

      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${chainConfig.chainId.toString(16)}` }],
        })
      } catch (switchError: any) {
        // Chain not added to MetaMask
        if (switchError.code === 4902) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [chainConfig],
          })
        } else {
          throw switchError
        }
      }
    } catch (error) {
      console.error("Failed to switch network:", error)
      throw error
    }
  }

  async disconnectWallet(): Promise<void> {
    this.provider = null
    this.signer = null
    this.isConnected = false
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider
  }

  getSigner(): ethers.Signer | null {
    return this.signer
  }

  getIsConnected(): boolean {
    return this.isConnected
  }

  async getAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error("Wallet not connected")
    }
    return await this.signer.getAddress()
  }

  async getBalance(): Promise<string> {
    if (!this.provider || !this.signer) {
      throw new Error("Wallet not connected")
    }
    const address = await this.signer.getAddress()
    const balance = await this.provider.getBalance(address)
    return ethers.formatEther(balance)
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error("Wallet not connected")
    }
    return await this.signer.signMessage(message)
  }
}

export const web3Provider = Web3Provider.getInstance()
