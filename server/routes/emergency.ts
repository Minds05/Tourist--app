import express from "express"
import { authenticateToken } from "../middleware/auth"
import { PushService } from "../services/push-service"
import { User } from "../models/User"
import { Group } from "../models/Group"
import { contractService } from "../services/contract-service"

const router = express.Router()
const pushService = new PushService(process.env.PUSH_PRIVATE_KEY!)

// Declare emergency
router.post("/declare", authenticateToken, async (req, res) => {
  try {
    const { emergencyType, location, message, severity } = req.body
    const userId = req.user.userId

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Record emergency on blockchain
    const emergencyId = await contractService.declareEmergency(
      user.walletAddress,
      emergencyType,
      location,
      message,
      severity || 1,
    )

    // Get user's groups for notification
    const userGroups = await Group.find({ members: userId }).populate("members")

    // Send emergency alerts to group members
    for (const group of userGroups) {
      const memberAddresses = group.members
        .filter((member: any) => member._id.toString() !== userId)
        .map((member: any) => member.walletAddress)

      if (memberAddresses.length > 0) {
        await pushService.sendEmergencyAlert(
          emergencyType,
          location,
          `${user.name} has declared an emergency: ${message}`,
          memberAddresses,
        )
      }
    }

    // Update user's emergency status
    user.emergencyStatus = {
      isActive: true,
      type: emergencyType,
      location,
      message,
      declaredAt: new Date(),
      emergencyId: emergencyId.toString(),
    }
    await user.save()

    res.json({
      success: true,
      message: "Emergency declared successfully",
      data: {
        emergencyId: emergencyId.toString(),
        alertsSent: userGroups.length,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to declare emergency",
      error: error.message,
    })
  }
})

// Respond to emergency
router.post("/respond/:emergencyId", authenticateToken, async (req, res) => {
  try {
    const { emergencyId } = req.params
    const { responseType, message, location } = req.body
    const userId = req.user.userId

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Record response on blockchain
    const responseId = await contractService.respondToEmergency(
      emergencyId,
      user.walletAddress,
      responseType,
      message,
      location,
    )

    res.json({
      success: true,
      message: "Emergency response recorded",
      data: { responseId: responseId.toString() },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to respond to emergency",
      error: error.message,
    })
  }
})

// Resolve emergency
router.post("/resolve/:emergencyId", authenticateToken, async (req, res) => {
  try {
    const { emergencyId } = req.params
    const { resolution } = req.body
    const userId = req.user.userId

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if user is the emergency declarer
    if (user.emergencyStatus?.emergencyId !== emergencyId) {
      return res.status(403).json({
        success: false,
        message: "Only the emergency declarer can resolve this emergency",
      })
    }

    // Resolve emergency on blockchain
    await contractService.resolveEmergency(emergencyId, resolution)

    // Update user's emergency status
    user.emergencyStatus = {
      ...user.emergencyStatus,
      isActive: false,
      resolvedAt: new Date(),
      resolution,
    }
    await user.save()

    res.json({
      success: true,
      message: "Emergency resolved successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to resolve emergency",
      error: error.message,
    })
  }
})

// Get emergency details
router.get("/:emergencyId", authenticateToken, async (req, res) => {
  try {
    const { emergencyId } = req.params

    const emergencyDetails = await contractService.getEmergencyDetails(emergencyId)

    res.json({
      success: true,
      data: emergencyDetails,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get emergency details",
      error: error.message,
    })
  }
})

// Get user's emergency history
router.get("/user/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const emergencyHistory = await contractService.getUserEmergencies(user.walletAddress)

    res.json({
      success: true,
      data: emergencyHistory,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get emergency history",
      error: error.message,
    })
  }
})

export default router
