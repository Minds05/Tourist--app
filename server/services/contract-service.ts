import { ethers } from "ethers"

export class ContractService {
  private static instance: ContractService
  private provider: ethers.JsonRpcProvider
  private signer: ethers.Wallet

  private constructor() {
    this.provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`)

    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY environment variable is required")
    }
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider)
  }

  static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService()
    }
    return ContractService.instance
  }

  private async getEmergencyContract(): Promise<ethers.Contract> {
    const contractABI = [
      "function declareEmergency(string memory _touristDID, uint8 _emergencyType, string memory _location, string memory _coordinates, string memory _description, string memory _ipfsData) external returns (uint256)",
      "function acknowledgeEmergency(uint256 _emergencyId) external",
      "function updateEmergencyStatus(uint256 _emergencyId, uint8 _status, string memory _action) external",
      "function getEmergency(uint256 _emergencyId) external view returns (tuple(uint256 emergencyId, address tourist, string touristDID, uint8 emergencyType, string location, string coordinates, string description, uint256 timestamp, uint8 status, address[] responders, string[] responseActions, uint256 resolvedAt, string ipfsData))",
      "function getTouristEmergencies(address _tourist) external view returns (uint256[] memory)",
      "event EmergencyDeclared(uint256 indexed emergencyId, address indexed tourist, uint8 emergencyType, string location)",
      "event EmergencyAcknowledged(uint256 indexed emergencyId, address indexed responder)",
      "event EmergencyResolved(uint256 indexed emergencyId, address indexed responder)",
    ]

    const contractAddress = process.env.NEXT_PUBLIC_EMERGENCY_SYSTEM_CONTRACT
    if (!contractAddress) {
      throw new Error("Emergency system contract address not configured")
    }

    return new ethers.Contract(contractAddress, contractABI, this.signer)
  }

  async declareEmergency(
    walletAddress: string,
    emergencyType: string,
    location: string,
    message: string,
    severity: number,
  ): Promise<bigint> {
    try {
      const contract = await this.getEmergencyContract()

      const emergencyTypeMap: { [key: string]: number } = {
        medical: 0,
        accident: 1,
        lost: 2,
        theft: 3,
        natural_disaster: 4,
        other: 5,
      }

      const typeIndex = emergencyTypeMap[emergencyType] || 5

      const tx = await contract.declareEmergency(
        walletAddress, // Using wallet address as DID for now
        typeIndex,
        location,
        "", // coordinates - could be extracted from location
        message,
        JSON.stringify({ severity, timestamp: Date.now() }), // IPFS data
      )

      const receipt = await tx.wait()

      const emergencyDeclaredEvent = receipt.logs.find(
        (log: any) => log.topics[0] === ethers.id("EmergencyDeclared(uint256,address,uint8,string)"),
      )

      if (emergencyDeclaredEvent) {
        return BigInt(emergencyDeclaredEvent.topics[1])
      }

      throw new Error("Emergency ID not found in transaction receipt")
    } catch (error) {
      console.error("Failed to declare emergency:", error)
      throw error
    }
  }

  async respondToEmergency(
    emergencyId: string,
    responderAddress: string,
    responseType: string,
    message: string,
    location: string,
  ): Promise<bigint> {
    try {
      const contract = await this.getEmergencyContract()

      const acknowledgeTx = await contract.acknowledgeEmergency(emergencyId)
      await acknowledgeTx.wait()

      const statusMap: { [key: string]: number } = {
        acknowledged: 1,
        responding: 2,
        resolved: 3,
      }

      const status = statusMap[responseType] || 1
      const action = `${responseType}: ${message} at ${location}`

      const updateTx = await contract.updateEmergencyStatus(emergencyId, status, action)
      const receipt = await updateTx.wait()

      return BigInt(receipt.transactionHash)
    } catch (error) {
      console.error("Failed to respond to emergency:", error)
      throw error
    }
  }

  async resolveEmergency(emergencyId: string, resolution: string): Promise<void> {
    try {
      const contract = await this.getEmergencyContract()

      const tx = await contract.updateEmergencyStatus(emergencyId, 3, `Resolved: ${resolution}`)
      await tx.wait()
    } catch (error) {
      console.error("Failed to resolve emergency:", error)
      throw error
    }
  }

  async getEmergencyDetails(emergencyId: string): Promise<any> {
    try {
      const contract = await this.getEmergencyContract()
      const emergency = await contract.getEmergency(emergencyId)

      return {
        emergencyId: emergency.emergencyId.toString(),
        tourist: emergency.tourist,
        touristDID: emergency.touristDID,
        emergencyType: emergency.emergencyType,
        location: emergency.location,
        coordinates: emergency.coordinates,
        description: emergency.description,
        timestamp: new Date(Number(emergency.timestamp) * 1000),
        status: emergency.status,
        responders: emergency.responders,
        responseActions: emergency.responseActions,
        resolvedAt: emergency.resolvedAt > 0 ? new Date(Number(emergency.resolvedAt) * 1000) : null,
        ipfsData: emergency.ipfsData,
      }
    } catch (error) {
      console.error("Failed to get emergency details:", error)
      throw error
    }
  }

  async getUserEmergencies(walletAddress: string): Promise<any[]> {
    try {
      const contract = await this.getEmergencyContract()
      const emergencyIds = await contract.getTouristEmergencies(walletAddress)

      const emergencies = []
      for (const id of emergencyIds) {
        try {
          const emergency = await this.getEmergencyDetails(id.toString())
          emergencies.push(emergency)
        } catch (error) {
          console.error(`Failed to get emergency ${id}:`, error)
        }
      }

      return emergencies
    } catch (error) {
      console.error("Failed to get user emergencies:", error)
      throw error
    }
  }
}

export const contractService = ContractService.getInstance()
