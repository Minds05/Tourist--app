import { PushAPI, CONSTANTS } from "@pushprotocol/restapi"
import { ethers } from "ethers"

export class PushService {
  private pushUser: any
  private signer: ethers.Signer

  constructor(privateKey: string, env: "prod" | "staging" = "staging") {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
    this.signer = new ethers.Wallet(privateKey, provider)
  }

  async initializePushUser(userAddress: string) {
    try {
      this.pushUser = await PushAPI.initialize(this.signer, {
        env: CONSTANTS.ENV.STAGING,
        account: userAddress,
      })
      return this.pushUser
    } catch (error) {
      console.error("Failed to initialize Push user:", error)
      throw error
    }
  }

  async createChannel(channelName: string, channelDescription: string, channelIcon: string) {
    try {
      const response = await this.pushUser.channel.create({
        name: channelName,
        description: channelDescription,
        icon: channelIcon,
        url: process.env.FRONTEND_URL || "https://localhost:3000",
      })
      return response
    } catch (error) {
      console.error("Failed to create channel:", error)
      throw error
    }
  }

  async sendNotification(
    recipients: string[],
    title: string,
    body: string,
    type: "broadcast" | "targeted" | "subset" = "targeted",
  ) {
    try {
      const response = await this.pushUser.channel.send(recipients, {
        notification: {
          title,
          body,
        },
        payload: {
          title,
          body,
          cta: "",
          img: "",
        },
      })
      return response
    } catch (error) {
      console.error("Failed to send notification:", error)
      throw error
    }
  }

  async sendGroupMessage(groupId: string, message: string, sender: string) {
    try {
      const response = await this.pushUser.chat.send(groupId, {
        type: "Text",
        content: message,
        reference: null,
      })
      return response
    } catch (error) {
      console.error("Failed to send group message:", error)
      throw error
    }
  }

  async createGroup(groupName: string, groupDescription: string, members: string[]) {
    try {
      const response = await this.pushUser.chat.group.create(groupName, {
        description: groupDescription,
        image: "",
        members: members,
        admins: [],
        private: false,
      })
      return response
    } catch (error) {
      console.error("Failed to create group:", error)
      throw error
    }
  }

  async addMembersToGroup(groupId: string, members: string[]) {
    try {
      const response = await this.pushUser.chat.group.add(groupId, {
        role: "MEMBER",
        accounts: members,
      })
      return response
    } catch (error) {
      console.error("Failed to add members to group:", error)
      throw error
    }
  }

  async sendEmergencyAlert(
    emergencyType: string,
    location: { lat: number; lng: number },
    message: string,
    affectedUsers: string[],
  ) {
    try {
      const emergencyTitle = `🚨 EMERGENCY ALERT: ${emergencyType}`
      const emergencyBody = `${message}\nLocation: ${location.lat}, ${location.lng}`

      const response = await this.sendNotification(affectedUsers, emergencyTitle, emergencyBody, "broadcast")

      return response
    } catch (error) {
      console.error("Failed to send emergency alert:", error)
      throw error
    }
  }

  async getGroupMessages(groupId: string, limit = 50) {
    try {
      const messages = await this.pushUser.chat.history(groupId, {
        limit,
      })
      return messages
    } catch (error) {
      console.error("Failed to get group messages:", error)
      throw error
    }
  }

  async subscribeToChannel(channelAddress: string, userAddress: string) {
    try {
      const response = await this.pushUser.notification.subscribe(channelAddress)
      return response
    } catch (error) {
      console.error("Failed to subscribe to channel:", error)
      throw error
    }
  }
}
