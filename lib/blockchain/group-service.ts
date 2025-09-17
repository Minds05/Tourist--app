import { contractService } from "./contract-service"
import { walletService } from "./wallet-service"
import { ipfsClient } from "./ipfs-client"
import { didManager } from "./did-manager"

export interface BlockchainGroup {
  groupId: number
  name: string
  creator: string
  destination: string
  startDate: number
  endDate: number
  maxMembers: number
  currentMembers: number
  isActive: boolean
  ipfsMetadata: string
  createdAt: number
  inviteCode?: string
}

export interface GroupMember {
  memberAddress: string
  memberDID: string
  joinedAt: number
  isAdmin: boolean
  isActive: boolean
  emergencyContact: string
}

export interface GroupMessage {
  sender: string
  content: string
  timestamp: number
  isEmergency: boolean
}

export class GroupService {
  private static instance: GroupService

  private constructor() {}

  static getInstance(): GroupService {
    if (!GroupService.instance) {
      GroupService.instance = new GroupService()
    }
    return GroupService.instance
  }

  async createGroup(
    name: string,
    destination: string,
    startDate: Date,
    endDate: Date,
    maxMembers: number,
    description?: string,
  ): Promise<number> {
    try {
      const wallet = walletService.getCurrentWallet()
      if (!wallet) {
        throw new Error("Wallet not connected")
      }

      // Create metadata object
      const metadata = {
        description: description || "",
        rules: [
          "Stay together during activities",
          "Share location updates regularly",
          "Report any safety concerns immediately",
          "Respect local customs and environment",
        ],
        emergencyProcedures: {
          primaryContact: "Local Emergency Services",
          backupContact: "Group Admin",
          meetingPoints: ["Hotel Lobby", "Main Tourist Center"],
        },
        createdBy: wallet.did.did,
        createdAt: Date.now(),
      }

      // Upload metadata to IPFS
      const ipfsHash = await ipfsClient.uploadJSON(metadata)

      // Create group on blockchain
      const contract = await contractService.getGroupManagementContract()
      const tx = await contract.createGroup(
        name,
        destination,
        Math.floor(startDate.getTime() / 1000),
        Math.floor(endDate.getTime() / 1000),
        maxMembers,
        ipfsHash,
        wallet.did.did,
      )

      const receipt = await tx.wait()

      // Extract group ID from events
      const groupCreatedEvent = receipt.events?.find((event: any) => event.event === "GroupCreated")
      const groupId = groupCreatedEvent?.args?.groupId?.toNumber()

      if (!groupId) {
        throw new Error("Failed to get group ID from transaction")
      }

      return groupId
    } catch (error) {
      console.error("Failed to create group:", error)
      throw error
    }
  }

  async joinGroup(groupId: number, emergencyContact: string): Promise<void> {
    try {
      const wallet = walletService.getCurrentWallet()
      if (!wallet) {
        throw new Error("Wallet not connected")
      }

      const contract = await contractService.getGroupManagementContract()
      const tx = await contract.joinGroup(groupId, wallet.did.did, emergencyContact)
      await tx.wait()
    } catch (error) {
      console.error("Failed to join group:", error)
      throw error
    }
  }

  async joinGroupByInviteCode(inviteCode: string, emergencyContact: string): Promise<void> {
    try {
      const wallet = walletService.getCurrentWallet()
      if (!wallet) {
        throw new Error("Wallet not connected")
      }

      const contract = await contractService.getGroupManagementContract()
      const tx = await contract.joinGroupByInviteCode(inviteCode, wallet.did.did, emergencyContact)
      await tx.wait()
    } catch (error) {
      console.error("Failed to join group by invite code:", error)
      throw error
    }
  }

  async leaveGroup(groupId: number): Promise<void> {
    try {
      const contract = await contractService.getGroupManagementContract()
      const tx = await contract.leaveGroup(groupId)
      await tx.wait()
    } catch (error) {
      console.error("Failed to leave group:", error)
      throw error
    }
  }

  async sendMessage(groupId: number, content: string, isEmergency = false): Promise<void> {
    try {
      const contract = await contractService.getGroupManagementContract()
      const tx = await contract.sendMessage(groupId, content, isEmergency)
      await tx.wait()
    } catch (error) {
      console.error("Failed to send message:", error)
      throw error
    }
  }

  async getGroup(groupId: number): Promise<BlockchainGroup> {
    try {
      const contract = await contractService.getGroupManagementContract()
      const groupData = await contract.getGroup(groupId)

      return {
        groupId: groupData.groupId.toNumber(),
        name: groupData.name,
        creator: groupData.creator,
        destination: groupData.destination,
        startDate: groupData.startDate.toNumber(),
        endDate: groupData.endDate.toNumber(),
        maxMembers: groupData.maxMembers.toNumber(),
        currentMembers: groupData.currentMembers.toNumber(),
        isActive: groupData.isActive,
        ipfsMetadata: groupData.ipfsMetadata,
        createdAt: groupData.createdAt.toNumber(),
      }
    } catch (error) {
      console.error("Failed to get group:", error)
      throw error
    }
  }

  async getGroupMembers(groupId: number): Promise<string[]> {
    try {
      const contract = await contractService.getGroupManagementContract()
      return await contract.getGroupMembers(groupId)
    } catch (error) {
      console.error("Failed to get group members:", error)
      throw error
    }
  }

  async getUserGroups(): Promise<number[]> {
    try {
      const wallet = walletService.getCurrentWallet()
      if (!wallet) {
        return []
      }

      const contract = await contractService.getGroupManagementContract()
      const groupIds = await contract.getUserGroups(wallet.address)
      return groupIds.map((id: any) => id.toNumber())
    } catch (error) {
      console.error("Failed to get user groups:", error)
      return []
    }
  }

  async getGroupMetadata(ipfsHash: string): Promise<any> {
    try {
      return await ipfsClient.retrieveJSON(ipfsHash)
    } catch (error) {
      console.error("Failed to get group metadata:", error)
      return null
    }
  }

  async createGroupCredential(groupId: number, role: "admin" | "member"): Promise<any> {
    try {
      const wallet = walletService.getCurrentWallet()
      if (!wallet) {
        throw new Error("Wallet not connected")
      }

      const group = await this.getGroup(groupId)

      const credential = await didManager.createVerifiableCredential(
        wallet.did.did, // Self-issued for now
        wallet.did.did,
        {
          groupId,
          groupName: group.name,
          destination: group.destination,
          role,
          joinedAt: new Date().toISOString(),
        },
        "GroupMembershipCredential",
      )

      await walletService.addCredential(credential)
      return credential
    } catch (error) {
      console.error("Failed to create group credential:", error)
      throw error
    }
  }
}

export const groupService = GroupService.getInstance()
