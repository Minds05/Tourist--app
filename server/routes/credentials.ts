import express from "express"
import { credentialService } from "../services/credential-service"
import { User } from "../models/User"
import type { AuthenticatedRequest } from "../middleware/auth"
import { asyncHandler, createError } from "../middleware/errorHandler"

const router = express.Router()

/**
 * @swagger
 * /api/credentials/issue:
 *   post:
 *     summary: Issue verifiable credential
 *     description: Issue a verifiable credential to a user
 *     tags: [Credentials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - subjectDID
 *               - credentialData
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [KYCCredential, GroupMembershipCredential, EmergencyContactCredential]
 *               subjectDID:
 *                 type: string
 *               credentialData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Credential issued successfully
 */
router.post(
  "/issue",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { type, subjectDID, credentialData } = req.body

    // TODO: Add proper authorization check (only issuers should be able to issue credentials)

    if (!type || !subjectDID || !credentialData) {
      throw createError("Missing required fields", 400)
    }

    try {
      let credential

      switch (type) {
        case "KYCCredential":
          credential = await credentialService.issueKYCCredential(subjectDID, credentialData)
          break

        case "GroupMembershipCredential":
          credential = await credentialService.issueGroupMembershipCredential(subjectDID, credentialData)
          break

        case "EmergencyContactCredential":
          credential = await credentialService.issueEmergencyCredential(subjectDID, credentialData)
          break

        default:
          throw createError("Invalid credential type", 400)
      }

      res.json({
        message: "Credential issued successfully",
        credential,
      })
    } catch (error) {
      console.error("Credential issuance error:", error)
      throw createError("Failed to issue credential: " + error.message, 500)
    }
  }),
)

/**
 * @swagger
 * /api/credentials/verify:
 *   post:
 *     summary: Verify verifiable credential or presentation
 *     description: Verify the authenticity of a verifiable credential or presentation
 *     tags: [Credentials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: object
 *               isPresentation:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Verification result
 */
router.post(
  "/verify",
  asyncHandler(async (req, res) => {
    const { credential, isPresentation = false } = req.body

    if (!credential) {
      throw createError("Credential is required", 400)
    }

    try {
      let result

      if (isPresentation) {
        result = await credentialService.verifyPresentation(credential)
      } else {
        result = await credentialService.verifyCredential(credential)
      }

      res.json({
        verified: result.verified,
        errors: result.errors,
      })
    } catch (error) {
      console.error("Credential verification error:", error)
      res.json({
        verified: false,
        errors: [error.message],
      })
    }
  }),
)

/**
 * @swagger
 * /api/credentials/revoke:
 *   post:
 *     summary: Revoke credential
 *     description: Revoke a previously issued credential
 *     tags: [Credentials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credentialId
 *             properties:
 *               credentialId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Credential revoked successfully
 */
router.post(
  "/revoke",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { credentialId, reason } = req.body

    // TODO: Add proper authorization check (only issuers should be able to revoke credentials)

    if (!credentialId) {
      throw createError("Credential ID is required", 400)
    }

    try {
      await credentialService.revokeCredential(credentialId, reason)

      res.json({
        message: "Credential revoked successfully",
        credentialId,
        reason: reason || "No reason provided",
      })
    } catch (error) {
      console.error("Credential revocation error:", error)
      throw createError("Failed to revoke credential: " + error.message, 500)
    }
  }),
)

/**
 * @swagger
 * /api/credentials/user/{did}:
 *   get:
 *     summary: Get user credentials
 *     description: Get all active credentials for a user DID
 *     tags: [Credentials]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *         description: User DID
 *     responses:
 *       200:
 *         description: User credentials retrieved successfully
 */
router.get(
  "/user/:did",
  asyncHandler(async (req, res) => {
    const { did } = req.params

    if (!did) {
      throw createError("DID is required", 400)
    }

    try {
      const credentials = await credentialService.getUserCredentials(did)

      res.json({
        did,
        credentials,
      })
    } catch (error) {
      console.error("Get user credentials error:", error)
      throw createError("Failed to get user credentials", 500)
    }
  }),
)

/**
 * @swagger
 * /api/credentials/my:
 *   get:
 *     summary: Get my credentials
 *     description: Get all active credentials for authenticated user
 *     tags: [Credentials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User credentials retrieved successfully
 */
router.get(
  "/my",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const walletAddress = req.user?.walletAddress

    if (!walletAddress) {
      throw createError("Authentication required", 401)
    }

    const user = await User.findOne({ walletAddress })
    if (!user) {
      throw createError("User not found", 404)
    }

    if (!user.did) {
      return res.json({
        credentials: [],
        message: "User has no DID registered",
      })
    }

    try {
      const credentials = await credentialService.getUserCredentials(user.did)

      res.json({
        did: user.did,
        credentials,
      })
    } catch (error) {
      console.error("Get my credentials error:", error)
      throw createError("Failed to get credentials", 500)
    }
  }),
)

export default router
