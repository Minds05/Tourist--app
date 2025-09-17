import express from "express"
import { PushService } from "../services/push-service"
import { authenticateToken } from "../middleware/auth"
import { Group } from "../models/Group"
import { User } from "../models/User"

const router = express.Router()
const pushService = new PushService(process.env.PUSH_PRIVATE_KEY!)

// Initialize Push Protocol for user
router.post("/init", authenticateToken, async (req, res) => {
  try {
    const { userAddress } = req.body
    const pushUser = await pushService.initializePushUser(userAddress)

    res.json({
      success: true,
      message: "Push Protocol initialized successfully",
      data: { userAddress },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to initialize Push Protocol",
      error: error.message,
    })
  }
})

// Create group chat
router.post("/groups/:groupId/chat", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params
    const { groupName, groupDescription } = req.body

    const group = await Group.findById(groupId).populate("members")
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    const memberAddresses = group.members.map((member: any) => member.walletAddress)
    const pushGroup = await pushService.createGroup(groupName, groupDescription, memberAddresses)

    // Update group with Push chat ID
    group.pushChatId = pushGroup.chatId
    await group.save()

    res.json({
      success: true,
      message: "Group chat created successfully",
      data: pushGroup,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create group chat",
      error: error.message,
    })
  }
})

// Send message to group
router.post("/groups/:groupId/messages", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params
    const { message } = req.body
    const userId = req.user.userId

    const group = await Group.findById(groupId)
    const user = await User.findById(userId)

    if (!group || !group.pushChatId) {
      return res.status(404).json({
        success: false,
        message: "Group chat not found",
      })
    }

    const response = await pushService.sendGroupMessage(group.pushChatId, message, user.walletAddress)

    res.json({
      success: true,
      message: "Message sent successfully",
      data: response,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    })
  }
})

// Get group messages
router.get("/groups/:groupId/messages", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params
    const { limit = 50 } = req.query

    const group = await Group.findById(groupId)
    if (!group || !group.pushChatId) {
      return res.status(404).json({
        success: false,
        message: "Group chat not found",
      })
    }

    const messages = await pushService.getGroupMessages(group.pushChatId, Number(limit))

    res.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get messages",
      error: error.message,
    })
  }
})

// Send emergency alert
router.post("/emergency/alert", authenticateToken, async (req, res) => {
  try {
    const { emergencyType, location, message, groupId } = req.body

    let affectedUsers: string[] = []

    if (groupId) {
      const group = await Group.findById(groupId).populate("members")
      affectedUsers = group.members.map((member: any) => member.walletAddress)
    }

    const response = await pushService.sendEmergencyAlert(emergencyType, location, message, affectedUsers)

    res.json({
      success: true,
      message: "Emergency alert sent successfully",
      data: response,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send emergency alert",
      error: error.message,
    })
  }
})

// Send notification to group members
router.post("/groups/:groupId/notify", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params
    const { title, body } = req.body

    const group = await Group.findById(groupId).populate("members")
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    const memberAddresses = group.members.map((member: any) => member.walletAddress)
    const response = await pushService.sendNotification(memberAddresses, title, body)

    res.json({
      success: true,
      message: "Notification sent successfully",
      data: response,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    })
  }
})

// Subscribe to notifications
router.post("/subscribe", authenticateToken, async (req, res) => {
  try {
    const { channelAddress, userAddress } = req.body

    const response = await pushService.subscribeToChannel(channelAddress, userAddress)

    res.json({
      success: true,
      message: "Subscribed to channel successfully",
      data: response,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to subscribe to channel",
      error: error.message,
    })
  }
})

export default router
