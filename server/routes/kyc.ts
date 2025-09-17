import express from "express"
import { User } from "../models/User"
import type { AuthenticatedRequest } from "../middleware/auth"
import { asyncHandler, createError } from "../middleware/errorHandler"
import { credentialService } from "../services/credential-service"
import { ipfsService } from "../services/ipfs-service"
import { generateEncryptionKey } from "../utils/encryption"

const router = express.Router()

/**
 * @swagger
 * /api/kyc/submit:
 *   post:
 *     summary: Submit KYC data
 *     description: Submit KYC information for verification
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kycData
 *             properties:
 *               kycData:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   nationality:
 *                     type: string
 *                   dateOfBirth:
 *                     type: string
 *                   documentNumber:
 *                     type: string
 *                   documentType:
 *                     type: string
 *                   documentImages:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: KYC data submitted successfully
 *       400:
 *         description: Invalid request data
 */
router.post(
  "/submit",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const walletAddress = req.user?.walletAddress
    const { kycData } = req.body

    if (!walletAddress) {
      throw createError("Authentication required", 401)
    }

    if (!kycData) {
      throw createError("KYC data is required", 400)
    }

    // Find user
    const user = await User.findOne({ walletAddress })
    if (!user) {
      throw createError("User not found", 404)
    }

    // Check if KYC already submitted and verified
    if (user.kycStatus === "verified") {
      throw createError("KYC already verified", 400)
    }

    try {
      // Generate encryption key for sensitive data
      const encryptionKey = generateEncryptionKey()

      // Store KYC data on IPFS (encrypted)
      const ipfsCid = await ipfsService.storeEncrypted(kycData, encryptionKey)

      // Update user KYC status
      user.kycData = {
        ipfsCid,
        verificationLevel: 0, // Will be updated after manual review
        submittedAt: new Date(),
      }
      user.kycStatus = "pending"

      // Update profile with basic info
      if (kycData.firstName) user.profile.firstName = kycData.firstName
      if (kycData.lastName) user.profile.lastName = kycData.lastName
      if (kycData.nationality) user.profile.nationality = kycData.nationality
      if (kycData.dateOfBirth) user.profile.dateOfBirth = new Date(kycData.dateOfBirth)

      await user.save()

      res.json({
        message: "KYC data submitted successfully",
        status: "pending",
        ipfsCid,
      })
    } catch (error) {
      console.error("KYC submission error:", error)
      throw createError("Failed to submit KYC data", 500)
    }
  }),
)

/**
 * @swagger
 * /api/kyc/verify:
 *   post:
 *     summary: Verify KYC submission (Admin only)
 *     description: Verify and approve/reject KYC submission
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userWalletAddress
 *               - status
 *               - verificationLevel
 *             properties:
 *               userWalletAddress:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [verified, rejected]
 *               verificationLevel:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 3
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: KYC verification completed
 */
router.post(
  "/verify",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { userWalletAddress, status, verificationLevel, notes } = req.body

    // TODO: Add admin role check
    // For now, any authenticated user can verify (should be restricted to admins)

    if (!userWalletAddress || !status || verificationLevel === undefined) {
      throw createError("Missing required fields", 400)
    }

    if (!["verified", "rejected"].includes(status)) {
      throw createError("Invalid status", 400)
    }

    if (verificationLevel < 0 || verificationLevel > 3) {
      throw createError("Invalid verification level", 400)
    }

    // Find user to verify
    const user = await User.findOne({ walletAddress: userWalletAddress.toLowerCase() })
    if (!user) {
      throw createError("User not found", 404)
    }

    if (user.kycStatus !== "pending") {
      throw createError("No pending KYC submission found", 400)
    }

    try {
      // Update KYC status
      user.kycStatus = status
      if (user.kycData) {
        user.kycData.verificationLevel = verificationLevel
        user.kycData.verifiedAt = new Date()
      }

      await user.save()

      // If verified and user has DID, issue KYC credential
      if (status === "verified" && user.did) {
        try {
          const kycCredential = await credentialService.issueKYCCredential(user.did, {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            nationality: user.profile.nationality,
            dateOfBirth: user.profile.dateOfBirth?.toISOString(),
            verificationLevel,
          })

          console.log("KYC credential issued:", kycCredential.credentialId)
        } catch (credError) {
          console.error("Failed to issue KYC credential:", credError)
          // Don't fail the verification if credential issuance fails
        }
      }

      res.json({
        message: `KYC ${status} successfully`,
        user: {
          walletAddress: user.walletAddress,
          kycStatus: user.kycStatus,
          verificationLevel: user.kycData?.verificationLevel,
        },
      })
    } catch (error) {
      console.error("KYC verification error:", error)
      throw createError("Failed to verify KYC", 500)
    }
  }),
)

/**
 * @swagger
 * /api/kyc/status:
 *   get:
 *     summary: Get KYC status
 *     description: Get current KYC status for authenticated user
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC status retrieved successfully
 */
router.get(
  "/status",
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
      kycStatus: user.kycStatus,
      verificationLevel: user.kycData?.verificationLevel || 0,
      submittedAt: user.kycData?.submittedAt,
      verifiedAt: user.kycData?.verifiedAt,
    })
  }),
)

export default router
