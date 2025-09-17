import { ethers } from "ethers"

export class BlockchainService {
  private static instance: BlockchainService
  private provider: ethers.JsonRpcProvider

  private constructor() {
    const infuraUrl = `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`
    this.provider = new ethers.JsonRpcProvider(infuraUrl)
  }

  static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService()
    }
    return BlockchainService.instance
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber()
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address)
    return ethers.formatEther(balance)
  }

  async getTransactionReceipt(txHash: string) {
    return await this.provider.getTransactionReceipt(txHash)
  }

  async estimateGas(transaction: any): Promise<string> {
    const gasEstimate = await this.provider.estimateGas(transaction)
    return gasEstimate.toString()
  }

  async getNetworkInfo() {
    const network = await this.provider.getNetwork()
    return {
      chainId: Number(network.chainId),
      name: network.name,
    }
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider
  }
}

export const blockchainService = BlockchainService.getInstance()
