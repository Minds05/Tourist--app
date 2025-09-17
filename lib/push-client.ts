import { PushAPI, CONSTANTS } from "@pushprotocol/restapi"
import type { ethers } from "ethers"

export class PushClient {
  private pushUser: any
  private signer: ethers.Signer | null = null

  async initialize(signer: ethers.Signer) {
    try {
      this.signer = signer
      const address = await signer.getAddress()

      this.pushUser = await PushAPI.initialize(signer, {
        env: CONSTANTS.ENV.STAGING,
        account: address,
      })

      return this.pushUser
    } catch (error) {
      console.error("Failed to initialize Push client:", error)
      throw error
    }
  }

  async getNotifications(limit = 20) {
    try {
      if (!this.pushUser) throw new Error("Push user not initialized")

      const notifications = await this.pushUser.notification.list("INBOX", {
        limit,
        page: 1,
      })

      return notifications
    } catch (error) {
      console.error("Failed to get notifications:", error)
      throw error
    }
  }

  async sendMessage(recipient: string, message: string) {
    try {
      if (!this.pushUser) throw new Error("Push user not initialized")

      const response = await this.pushUser.chat.send(recipient, {
        type: "Text",
        content: message,
      })

      return response
    } catch (error) {
      console.error("Failed to send message:", error)
      throw error
    }
  }

  async getChatHistory(recipient: string, limit = 50) {
    try {
      if (!this.pushUser) throw new Error("Push user not initialized")

      const history = await this.pushUser.chat.history(recipient, {
        limit,
      })

      return history
    } catch (error) {
      console.error("Failed to get chat history:", error)
      throw error
    }
  }

  async subscribeToChannel(channelAddress: string) {
    try {
      if (!this.pushUser) throw new Error("Push user not initialized")

      const response = await this.pushUser.notification.subscribe(channelAddress)
      return response
    } catch (error) {
      console.error("Failed to subscribe to channel:", error)
      throw error
    }
  }

  async createStream() {
    try {
      if (!this.pushUser) throw new Error("Push user not initialized")

      const stream = await this.pushUser.initStream([CONSTANTS.STREAM.NOTIF, CONSTANTS.STREAM.CHAT])

      return stream
    } catch (error) {
      console.error("Failed to create stream:", error)
      throw error
    }
  }
}

export const pushClient = new PushClient()
