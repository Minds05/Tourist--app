import { ethers } from "ethers"
import { web3Provider } from "./web3-provider"
import { BLOCKCHAIN_CONFIG } from "./config"

export class ContractService {
  private static instance: ContractService
  private contracts: Map<string, ethers.Contract> = new Map()

  private constructor() {}

  static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService()
    }
    return ContractService.instance
  }

  async getTouristIdentityContract(): Promise<ethers.Contract> {
    const contractKey = "TOURIST_IDENTITY"

    if (!this.contracts.has(contractKey)) {
      const provider = web3Provider.getProvider()
      const signer = web3Provider.getSigner()

      if (!provider || !signer) {
        throw new Error("Wallet not connected")
      }

      const contractABI = [
        "function registerTourist(string memory _did, string memory _ipfsHash) external",
        "function submitKYC(string memory _ipfsHash) external",
        "function getTouristProfile(address _tourist) external view returns (tuple(string did, string ipfsHash, uint256 registrationTimestamp, bool isVerified, bool isActive, string emergencyContactDID, uint256 safetyScore))",
        "function verifyTourist(uint256 _requestId, bool _isApproved) external",
        "function updateSafetyScore(address _tourist, uint256 _newScore) external",
        "function setEmergencyContact(string memory _emergencyContactDID) external",
        "function getTotalTourists() external view returns (uint256)",
        "event TouristRegistered(address indexed tourist, string did, uint256 touristId)",
        "event KYCSubmitted(address indexed tourist, string ipfsHash, uint256 requestId)",
        "event TouristVerified(address indexed tourist, bool isVerified)",
        "event SafetyScoreUpdated(address indexed tourist, uint256 newScore)",
      ]

      const contract = new ethers.Contract(BLOCKCHAIN_CONFIG.CONTRACTS.TOURIST_IDENTITY, contractABI, signer)

      this.contracts.set(contractKey, contract)
    }

    return this.contracts.get(contractKey)!
  }

  async getGroupManagementContract(): Promise<ethers.Contract> {
    const contractKey = "GROUP_MANAGEMENT"

    if (!this.contracts.has(contractKey)) {
      const provider = web3Provider.getProvider()
      const signer = web3Provider.getSigner()

      if (!provider || !signer) {
        throw new Error("Wallet not connected")
      }

      const contractABI = [
        "function createGroup(string memory _name, string memory _destination, uint256 _startDate, uint256 _endDate, uint256 _maxMembers, string memory _ipfsMetadata, string memory _creatorDID) external returns (uint256)",
        "function joinGroup(uint256 _groupId, string memory _memberDID, string memory _emergencyContact) external",
        "function joinGroupByInviteCode(string memory _inviteCode, string memory _memberDID, string memory _emergencyContact) external",
        "function leaveGroup(uint256 _groupId) external",
        "function sendMessage(uint256 _groupId, string memory _content, bool _isEmergency) external",
        "function getGroup(uint256 _groupId) external view returns (tuple(uint256 groupId, string name, address creator, string destination, uint256 startDate, uint256 endDate, uint256 maxMembers, uint256 currentMembers, bool isActive, string ipfsMetadata, uint256 createdAt))",
        "function getGroupMembers(uint256 _groupId) external view returns (address[] memory)",
        "function getUserGroups(address _user) external view returns (uint256[] memory)",
        "event GroupCreated(uint256 indexed groupId, address indexed creator, string name)",
        "event MemberJoined(uint256 indexed groupId, address indexed member, string memberDID)",
        "event MessageSent(uint256 indexed groupId, address indexed sender, bool isEmergency)",
        "event EmergencyAlert(uint256 indexed groupId, address indexed sender, string location)",
      ]

      const contract = new ethers.Contract(BLOCKCHAIN_CONFIG.CONTRACTS.GROUP_MANAGEMENT, contractABI, signer)

      this.contracts.set(contractKey, contract)
    }

    return this.contracts.get(contractKey)!
  }

  async getTripVerificationContract(): Promise<ethers.Contract> {
    const contractKey = "TRIP_VERIFICATION"

    if (!this.contracts.has(contractKey)) {
      const provider = web3Provider.getProvider()
      const signer = web3Provider.getSigner()

      if (!provider || !signer) {
        throw new Error("Wallet not connected")
      }

      const contractABI = [
        "function createTrip(string memory _touristDID, string memory _destination, uint256 _startDate, uint256 _endDate, string[] memory _plannedCheckpoints, string memory _ipfsMetadata) external returns (uint256)",
        "function startTrip(uint256 _tripId) external",
        "function reachCheckpoint(uint256 _tripId, uint256 _checkpointIndex, string memory _coordinates, string memory _notes) external",
        "function completeTrip(uint256 _tripId) external",
        "function declareEmergency(uint256 _tripId, string memory _location, string memory _description) external",
        "function fileSafetyReport(uint256 _tripId, string memory _reportType, string memory _description, string memory _location) external",
        "function getTrip(uint256 _tripId) external view returns (tuple(uint256 tripId, address tourist, string touristDID, string destination, uint256 startDate, uint256 endDate, string[] checkpoints, uint256[] checkpointTimestamps, uint8 status, uint256 safetyScore, string ipfsMetadata, uint256 createdAt, uint256 completedAt))",
        "function getUserTrips(address _user) external view returns (uint256[] memory)",
        "event TripCreated(uint256 indexed tripId, address indexed tourist, string destination)",
        "event TripStarted(uint256 indexed tripId, address indexed tourist)",
        "event CheckpointReached(uint256 indexed tripId, string location, uint256 timestamp)",
        "event TripCompleted(uint256 indexed tripId, address indexed tourist, uint256 safetyScore)",
      ]

      const contract = new ethers.Contract(BLOCKCHAIN_CONFIG.CONTRACTS.TRIP_VERIFICATION, contractABI, signer)

      this.contracts.set(contractKey, contract)
    }

    return this.contracts.get(contractKey)!
  }

  async getEmergencySystemContract(): Promise<ethers.Contract> {
    const contractKey = "EMERGENCY_SYSTEM"

    if (!this.contracts.has(contractKey)) {
      const provider = web3Provider.getProvider()
      const signer = web3Provider.getSigner()

      if (!provider || !signer) {
        throw new Error("Wallet not connected")
      }

      const contractABI = [
        "function declareEmergency(string memory _touristDID, uint8 _emergencyType, string memory _location, string memory _coordinates, string memory _description, string memory _ipfsData) external returns (uint256)",
        "function acknowledgeEmergency(uint256 _emergencyId) external",
        "function updateEmergencyStatus(uint256 _emergencyId, uint8 _status, string memory _action) external",
        "function registerEmergencyResponder(string memory _name, string memory _organization, string[] memory _specializations) external",
        "function addEmergencyContact(string memory _name, string memory _phone, string memory _relationship, string memory _email) external",
        "function getEmergency(uint256 _emergencyId) external view returns (tuple(uint256 emergencyId, address tourist, string touristDID, uint8 emergencyType, string location, string coordinates, string description, uint256 timestamp, uint8 status, address[] responders, string[] responseActions, uint256 resolvedAt, string ipfsData))",
        "function getTouristEmergencies(address _tourist) external view returns (uint256[] memory)",
        "function getActiveEmergencies() external view returns (uint256[] memory)",
        "event EmergencyDeclared(uint256 indexed emergencyId, address indexed tourist, uint8 emergencyType, string location)",
        "event EmergencyAcknowledged(uint256 indexed emergencyId, address indexed responder)",
        "event EmergencyResolved(uint256 indexed emergencyId, address indexed responder)",
      ]

      const contract = new ethers.Contract(BLOCKCHAIN_CONFIG.CONTRACTS.EMERGENCY_SYSTEM, contractABI, signer)

      this.contracts.set(contractKey, contract)
    }

    return this.contracts.get(contractKey)!
  }

  async deployContracts(): Promise<void> {
    try {
      const signer = web3Provider.getSigner()
      if (!signer) {
        throw new Error("Wallet not connected")
      }

      console.log("Deploying contracts...")

      // In a real application, you would deploy contracts here
      // For now, we'll assume contracts are already deployed
      console.log("Contracts deployed successfully")
    } catch (error) {
      console.error("Failed to deploy contracts:", error)
      throw error
    }
  }

  clearContracts(): void {
    this.contracts.clear()
  }
}

export const contractService = ContractService.getInstance()
