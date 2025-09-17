import express from "express"
import { Group } from "../models/Group"
import { User } from "../models/User"
import type { AuthenticatedRequest } from "../middleware/auth"
import { asyncHandler, createError } from "../middleware/errorHandler"
import { credentialService } from "../services/credential-service"
import { v4 as uuidv4 } from "uuid"

const router = express.Router()

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create travel group
 *     description: Create a new travel group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - destination
 *               - startDate
 *               - endDate
 *               - maxMembers
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               destination:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               maxMembers:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 50
 *               requirements:
 *                 type: object
 *     responses:
 *       201:
 *         description: Group created successfully
 */
router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const walletAddress = req.user?.walletAddress
    const { name, description, destination, startDate, endDate, maxMembers, requirements } = req.body

    if (!walletAddress) {
      throw createError("Authentication required", 401)
    }

    // Validate required fields
    if (!name || !description || !destination || !startDate || !endDate || !maxMembers) {
      throw createError("Missing required fields", 400)
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    if (start <= now) {
      throw createError("Start date must be in the future", 400)
    }

    if (end <= start) {
      throw createError("End date must be after start date", 400)
    }

    // Validate max members
    if (maxMembers < 2 || maxMembers > 50) {
      throw createError("Max members must be between 2 and 50", 400)
    }

    // Find user
    const user = await User.findOne({ walletAddress })
    if (!user) {
      throw createError("User not found", 404)
    }

    try {
      // Generate unique group ID
      const groupId = `group-${uuidv4()}`

      // Create group
      const group = new Group({
        groupId,
        name,
        description,
        destination,
        startDate: start,
        endDate: end,
        maxMembers,
        creator: walletAddress,
        metadata: {
          tags: [],
          requirements: {
            minKycLevel: requirements?.minKycLevel || 1,
            ageRestriction: requirements?.ageRestriction,
            nationalityRestrictions: requirements?.nationalityRestrictions,
          },
        },
        members: [
          {
            walletAddress,
            did: user.did,
            role: "admin",
            joinedAt: new Date(),
          },
        ],
        status: "active",
      })

      await group.save()

      // Add group to user's groups
      user.groups.push({
        groupId,
        role: "admin",
        joinedAt: new Date(),
      })
      await user.save()

      res.status(201).json({
        message: "Group created successfully",
        group: {
          groupId: group.groupId,
          name: group.name,
          description: group.description,
          destination: group.destination,
          startDate: group.startDate,
          endDate: group.endDate,
          maxMembers: group.maxMembers,
          currentMembers: group.currentMembers,
          creator: group.creator,
          status: group.status,
        },
      })
    } catch (error) {
      console.error("Group creation error:", error)
      throw createError("Failed to create group", 500)
    }
  }),
)

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get travel groups
 *     description: Get list of travel groups with optional filters
 *     tags: [Groups]
 *     parameters:
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { destination, status, limit = 20, offset = 0 } = req.query

    // Build filter
    const filter: any = {}
    if (destination) filter.destination = new RegExp(destination as string, "i")
    if (status) filter.status = status

    try {
      const groups = await Group.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .select("-members.did -emergencyInfo") // Exclude sensitive data

      const total = await Group.countDocuments(filter)

      res.json({
        groups: groups.map((group) => ({
          groupId: group.groupId,
          name: group.name,
          description: group.description,
          destination: group.destination,
          startDate: group.startDate,
          endDate: group.endDate,
          maxMembers: group.maxMembers,
          currentMembers: group.currentMembers,
          creator: group.creator,
          status: group.status,
          metadata: {
            imageUrl: group.metadata.imageUrl,
            tags: group.metadata.tags,
            requirements: group.metadata.requirements,
          },
          createdAt: group.createdAt,
        })),
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total,
        },
      })
    } catch (error) {
      console.error("Get groups error:", error)
      throw createError("Failed to get groups", 500)
    }
  }),
)

/**
 * @swagger
 * /api/groups/{groupId}:
 *   get:
 *     summary: Get group details
 *     description: Get detailed information about a specific group
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group details retrieved successfully
 */
router.get(
  "/:groupId",
  asyncHandler(async (req, res) => {
    const { groupId } = req.params

    const group = await Group.findOne({ groupId })
    if (!group) {
      throw createError("Group not found", 404)
    }

    res.json({
      group: {
        groupId: group.groupId,
        name: group.name,
        description: group.description,
        destination: group.destination,
        startDate: group.startDate,
        endDate: group.endDate,
        maxMembers: group.maxMembers,
        currentMembers: group.currentMembers,
        creator: group.creator,
        status: group.status,
        metadata: group.metadata,
        members: group.members.map((member) => ({
          walletAddress: member.walletAddress,
          role: member.role,
          joinedAt: member.joinedAt,
          // Exclude DID for privacy
        })),
        emergencyInfo: group.emergencyInfo,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      },
    })
  }),
)

/**
 * @swagger
 * /api/groups/{groupId}/join:
 *   post:
 *     summary: Join travel group
 *     description: Join an existing travel group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully joined group
 */
router.post(
  "/:groupId/join",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { groupId } = req.params
    const walletAddress = req.user?.walletAddress

    if (!walletAddress) {
      throw createError("Authentication required", 401)
    }

    // Find group
    const group = await Group.findOne({ groupId })
    if (!group) {
      throw createError("Group not found", 404)
    }

    // Check if group is active
    if (group.status !== "active") {
      throw createError("Group is not active", 400)
    }

    // Check if group is full
    if (group.currentMembers >= group.maxMembers) {
      throw createError("Group is full", 400)
    }

    // Check if user is already a member
    const existingMember = group.members.find((member) => member.walletAddress === walletAddress)
    if (existingMember) {
      throw createError("Already a member of this group", 400)
    }

    // Find user
    const user = await User.findOne({ walletAddress })
    if (!user) {
      throw createError("User not found", 404)
    }

    // Check KYC requirements
    if (
      user.kycStatus !== "verified" ||
      (user.kycData?.verificationLevel || 0) < group.metadata.requirements.minKycLevel
    ) {
      throw createError("KYC verification level insufficient", 403)
    }

    try {
      // Add user to group
      group.members.push({
        walletAddress,
        did: user.did,
        role: "member",
        joinedAt: new Date(),
      })
      group.currentMembers += 1
      await group.save()

      // Add group to user's groups
      user.groups.push({
        groupId,
        role: "member",
        joinedAt: new Date(),
      })
      await user.save()

      // Issue group membership credential if user has DID
      if (user.did) {
        try {
          await credentialService.issueGroupMembershipCredential(user.did, {
            groupId,
            groupName: group.name,
            role: "member",
          })
        } catch (credError) {
          console.error("Failed to issue membership credential:", credError)
          // Don't fail the join operation if credential issuance fails
        }
      }

      res.json({
        message: "Successfully joined group",
        groupId,
        role: "member",
      })
    } catch (error) {
      console.error("Group join error:", error)
      throw createError("Failed to join group", 500)
    }
  }),
)

/**
 * @swagger
 * /api/groups/{groupId}/leave:
 *   post:
 *     summary: Leave travel group
 *     description: Leave a travel group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully left group
 */
router.post(
  "/:groupId/leave",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { groupId } = req.params
    const walletAddress = req.user?.walletAddress

    if (!walletAddress) {
      throw createError("Authentication required", 401)
    }

    // Find group
    const group = await Group.findOne({ groupId })
    if (!group) {
      throw createError("Group not found", 404)
    }

    // Check if user is a member
    const memberIndex = group.members.findIndex((member) => member.walletAddress === walletAddress)
    if (memberIndex === -1) {
      throw createError("Not a member of this group", 400)
    }

    // Check if user is the creator
    if (group.creator === walletAddress) {
      throw createError("Group creator cannot leave. Transfer ownership or cancel group.", 400)
    }

    try {
      // Remove user from group
      group.members.splice(memberIndex, 1)
      group.currentMembers -= 1
      await group.save()

      // Remove group from user's groups
      const user = await User.findOne({ walletAddress })
      if (user) {
        const userGroupIndex = user.groups.findIndex((g) => g.groupId === groupId)
        if (userGroupIndex !== -1) {
          user.groups.splice(userGroupIndex, 1)
          await user.save()
        }
      }

      res.json({
        message: "Successfully left group",
        groupId,
      })
    } catch (error) {
      console.error("Group leave error:", error)
      throw createError("Failed to leave group", 500)
    }
  }),
)

/**
 * @swagger
 * /api/groups/my:
 *   get:
 *     summary: Get my groups
 *     description: Get all groups the authenticated user is a member of
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User groups retrieved successfully
 */
router.get(
  "/my",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const walletAddress = req.user?.walletAddress

    if (!walletAddress) {
      throw createError("Authentication required", 401)
    }

    try {
      const groups = await Group.find({
        "members.walletAddress": walletAddress,
      }).select("-members.did -emergencyInfo")

      const userGroups = groups.map((group) => {
        const userMember = group.members.find((member) => member.walletAddress === walletAddress)
        return {
          groupId: group.groupId,
          name: group.name,
          description: group.description,
          destination: group.destination,
          startDate: group.startDate,
          endDate: group.endDate,
          maxMembers: group.maxMembers,
          currentMembers: group.currentMembers,
          status: group.status,
          role: userMember?.role,
          joinedAt: userMember?.joinedAt,
          createdAt: group.createdAt,
        }
      })

      res.json({
        groups: userGroups,
      })
    } catch (error) {
      console.error("Get my groups error:", error)
      throw createError("Failed to get user groups", 500)
    }
  }),
)

export default router
