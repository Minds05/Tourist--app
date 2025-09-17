import express from "express"
import { credentialService } from "../services/credential-service"
import { User } from "../models/User"
import { Group } from "../models/Group"
import { asyncHandler, createError } from "../middleware/errorHandler"

const router = express.Router()

/**
 * @swagger
 * /api/verify/presentation:
 *   post:
 *     summary: Verify verifiable presentation
 *     description: Verify a verifiable presentation and extract claims
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - presentation
 *             properties:
 *               presentation:
 *                 type: object
 *                 description: Verifiable presentation to verify
 *               challenge:
 *                 type: string
 *                 description: Challenge nonce for presentation verification
 *     responses:
 *       200:
 *         description: Presentation verification result
 */
router.post(
  "/presentation",
  asyncHandler(async (req, res) => {
    const { presentation, challenge } = req.body

    if (!presentation) {
      throw createError("Presentation is required", 400)
    }

    try {
      // Verify the presentation
      const verificationResult = await credentialService.verifyPresentation(presentation)

      // Extract claims from verified credentials
      let claims = {}
      if (verificationResult.verified && presentation.verifiableCredential) {
        const credentials = Array.isArray(presentation.verifiableCredential)
          ? presentation.verifiableCredential
          : [presentation.verifiableCredential]

        for (const credential of credentials) {
          // Extract credential subject claims
          if (credential.credentialSubject) {
            claims = { ...claims, ...credential.credentialSubject }
          }
        }
      }

      res.json({
        verified: verificationResult.verified,
        errors: verificationResult.errors,
        claims,
        holder: presentation.holder,
      })
    } catch (error) {
      console.error("Presentation verification error:", error)
      res.json({
        verified: false,
        errors: [error.message],
        claims: {},
      })
    }
  }),
)

/**
 * @swagger
 * /api/verify/kyc:
 *   post:
 *     summary: Verify KYC status
 *     description: Verify KYC status and level for a user
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Wallet address or DID
 *               requiredLevel:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 3
 *                 default: 1
 *     responses:
 *       200:
 *         description: KYC verification result
 */
router.post(
  "/kyc",
  asyncHandler(async (req, res) => {
    const { identifier, requiredLevel = 1 } = req.body

    if (!identifier) {
      throw createError("Identifier (wallet address or DID) is required", 400)
    }

    try {
      // Find user by wallet address or DID
      const user = await User.findOne({
        $or: [{ walletAddress: identifier.toLowerCase() }, { did: identifier }],
      })

      if (!user) {
        return res.json({
          verified: false,
          kycStatus: "not_found",
          verificationLevel: 0,
          message: "User not found",
        })
      }

      const isVerified = user.kycStatus === "verified" && (user.kycData?.verificationLevel || 0) >= requiredLevel

      res.json({
        verified: isVerified,
        kycStatus: user.kycStatus,
        verificationLevel: user.kycData?.verificationLevel || 0,
        requiredLevel,
        verifiedAt: user.kycData?.verifiedAt,
      })
    } catch (error) {
      console.error("KYC verification error:", error)
      throw createError("Failed to verify KYC status", 500)
    }
  }),
)

/**
 * @swagger
 * /api/verify/group-membership:
 *   post:
 *     summary: Verify group membership
 *     description: Verify if a user is a member of a specific group
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIdentifier
 *               - groupId
 *             properties:
 *               userIdentifier:
 *                 type: string
 *                 description: Wallet address or DID
 *               groupId:
 *                 type: string
 *                 description: Group identifier
 *               requiredRole:
 *                 type: string
 *                 enum: [member, admin]
 *                 description: Required role (optional)
 *     responses:
 *       200:
 *         description: Group membership verification result
 */
router.post(
  "/group-membership",
  asyncHandler(async (req, res) => {
    const { userIdentifier, groupId, requiredRole } = req.body

    if (!userIdentifier || !groupId) {
      throw createError("User identifier and group ID are required", 400)
    }

    try {
      // Find group
      const group = await Group.findOne({ groupId })
      if (!group) {
        return res.json({
          verified: false,
          isMember: false,
          message: "Group not found",
        })
      }

      // Find user in group members
      const member = group.members.find(
        (m) => m.walletAddress === userIdentifier.toLowerCase() || m.did === userIdentifier,
      )

      if (!member) {
        return res.json({
          verified: false,
          isMember: false,
          message: "User is not a member of this group",
        })
      }

      // Check role requirement
      const roleMatches = !requiredRole || member.role === requiredRole

      res.json({
        verified: roleMatches,
        isMember: true,
        role: member.role,
        requiredRole,
        joinedAt: member.joinedAt,
        groupInfo: {
          groupId: group.groupId,
          name: group.name,
          destination: group.destination,
          status: group.status,
        },
      })
    } catch (error) {
      console.error("Group membership verification error:", error)
      throw createError("Failed to verify group membership", 500)
    }
  }),
)

/**
 * @swagger
 * /api/verify/emergency-access:
 *   post:
 *     summary: Verify emergency access
 *     description: Verify emergency access credentials for a user
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIdentifier
 *               - emergencyCode
 *             properties:
 *               userIdentifier:
 *                 type: string
 *                 description: Wallet address or DID
 *               emergencyCode:
 *                 type: string
 *                 description: Emergency access code
 *     responses:
 *       200:
 *         description: Emergency access verification result
 */
router.post(
  "/emergency-access",
  asyncHandler(async (req, res) => {
    const { userIdentifier, emergencyCode } = req.body

    if (!userIdentifier || !emergencyCode) {
      throw createError("User identifier and emergency code are required", 400)
    }

    try {
      // Find user
      const user = await User.findOne({
        $or: [{ walletAddress: userIdentifier.toLowerCase() }, { did: userIdentifier }],
      })

      if (!user) {
        return res.json({
          verified: false,
          message: "User not found",
        })
      }

      // TODO: Implement proper emergency code verification
      // For now, we'll use a simple hash-based verification
      const expectedCode = require("crypto")
        .createHash("sha256")
        .update(user.walletAddress + "emergency")
        .digest("hex")
        .substring(0, 8)

      const isValidCode = emergencyCode === expectedCode

      if (isValidCode) {
        res.json({
          verified: true,
          emergencyContacts: user.emergencyContacts,
          profile: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            nationality: user.profile.nationality,
          },
          kycStatus: user.kycStatus,
        })
      } else {
        res.json({
          verified: false,
          message: "Invalid emergency code",
        })
      }
    } catch (error) {
      console.error("Emergency access verification error:", error)
      throw createError("Failed to verify emergency access", 500)
    }
  }),
)

export default router
