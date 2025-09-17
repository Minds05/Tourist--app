import express from "express"
import { User } from "../models/User"
import type { AuthenticatedRequest } from "../middleware/auth"
import { asyncHandler, createError } from "../middleware/errorHandler"

const router = express.Router()

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register user DID
 *     description: Associates a DID with the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - did
 *             properties:
 *               did:
 *                 type: string
 *                 description: Decentralized Identifier
 *     responses:
 *       200:
 *         description: DID registered successfully
 *       400:
 *         description: Invalid request
 *       409:
 *         description: DID already registered
 */
router.post(
  "/register",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { did } = req.body
    const walletAddress = req.user?.walletAddress

    if (!did) {
      throw createError("DID is required", 400)
    }

    if (!walletAddress) {
      throw createError("Authentication required", 401)
    }

    // Check if DID is already registered
    const existingUser = await User.findOne({ did })
    if (existingUser && existingUser.walletAddress !== walletAddress) {
      throw createError("DID already registered to another user", 409)
    }

    // Update user with DID
    const user = await User.findOneAndUpdate({ walletAddress }, { did }, { new: true, runValidators: true })

    if (!user) {
      throw createError("User not found", 404)
    }

    res.json({
      message: "DID registered successfully",
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        did: user.did,
        profile: user.profile,
        kycStatus: user.kycStatus,
      },
    })
  }),
)

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieves the authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get(
  "/profile",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const walletAddress = req.user?.walletAddress

    if (!walletAddress) {
      throw createError("Authentication required", 401)
    }

    const user = await User.findOne({ walletAddress })
    if (!user) {
      throw createError("User not found", 404)
    }

    res.json({
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        did: user.did,
        profile: user.profile,
        kycStatus: user.kycStatus,
        credentials: user.credentials,
        groups: user.groups,
        emergencyContacts: user.emergencyContacts,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  }),
)

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Updates the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: object
 *               emergencyContacts:
 *                 type: array
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put(
  "/profile",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const walletAddress = req.user?.walletAddress
    const { profile, emergencyContacts } = req.body

    if (!walletAddress) {
      throw createError("Authentication required", 401)
    }

    const updateData: any = {}
    if (profile) updateData.profile = profile
    if (emergencyContacts) updateData.emergencyContacts = emergencyContacts

    const user = await User.findOneAndUpdate({ walletAddress }, updateData, { new: true, runValidators: true })

    if (!user) {
      throw createError("User not found", 404)
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        did: user.did,
        profile: user.profile,
        emergencyContacts: user.emergencyContacts,
      },
    })
  }),
)

export default router
