import express from "express"
import { SiweMessage } from "siwe"
import { generateToken, verifySiweMessage } from "../middleware/auth"
import { User } from "../models/User"
import { asyncHandler, createError } from "../middleware/errorHandler"
import crypto from "crypto"

const router = express.Router()

// Store for nonces (in production, use Redis or database)
const nonceStore = new Map<string, { nonce: string; timestamp: number }>()

// Clean up expired nonces every hour
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of nonceStore.entries()) {
    if (now - value.timestamp > 3600000) {
      // 1 hour
      nonceStore.delete(key)
    }
  }
}, 3600000)

/**
 * @swagger
 * /api/auth/challenge:
 *   post:
 *     summary: Generate authentication challenge
 *     description: Generates a unique nonce for SIWE authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: Ethereum wallet address
 *     responses:
 *       200:
 *         description: Challenge generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nonce:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.post(
  "/challenge",
  asyncHandler(async (req, res) => {
    const { walletAddress } = req.body

    if (!walletAddress) {
      throw createError("Wallet address is required", 400)
    }

    // Generate nonce
    const nonce = crypto.randomBytes(32).toString("hex")

    // Store nonce with timestamp
    nonceStore.set(walletAddress.toLowerCase(), {
      nonce,
      timestamp: Date.now(),
    })

    // Create SIWE message
    const domain = process.env.DOMAIN || "localhost:3001"
    const origin = process.env.FRONTEND_URL || "http://localhost:3000"

    const message = new SiweMessage({
      domain,
      address: walletAddress,
      statement: "Sign in to Tourist Protection DID System",
      uri: origin,
      version: "1",
      chainId: 11155111, // Sepolia
      nonce,
      issuedAt: new Date().toISOString(),
    })

    res.json({
      nonce,
      message: message.prepareMessage(),
    })
  }),
)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user with signed message
 *     description: Verifies SIWE signature and returns JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - signature
 *             properties:
 *               message:
 *                 type: string
 *                 description: SIWE message
 *               signature:
 *                 type: string
 *                 description: Signed message
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 */
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { message, signature } = req.body

    if (!message || !signature) {
      throw createError("Message and signature are required", 400)
    }

    try {
      // Verify SIWE message
      const siweMessage = await verifySiweMessage(message, signature)
      const walletAddress = siweMessage.address.toLowerCase()

      // Verify nonce
      const storedNonce = nonceStore.get(walletAddress)
      if (!storedNonce || storedNonce.nonce !== siweMessage.nonce) {
        throw createError("Invalid or expired nonce", 400)
      }

      // Remove used nonce
      nonceStore.delete(walletAddress)

      // Find or create user
      let user = await User.findOne({ walletAddress })
      if (!user) {
        user = new User({
          walletAddress,
          profile: {},
          kycStatus: "pending",
        })
        await user.save()
      }

      // Generate JWT token
      const token = generateToken({
        walletAddress,
        userId: user._id.toString(),
        did: user.did,
      })

      res.json({
        token,
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          did: user.did,
          profile: user.profile,
          kycStatus: user.kycStatus,
        },
      })
    } catch (error) {
      throw createError("Authentication failed: " + error.message, 401)
    }
  }),
)

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh authentication token
 *     description: Generates a new JWT token for authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      throw createError("Access token required", 401)
    }

    try {
      const jwt = require("jsonwebtoken")
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true }) as any

      // Find user to ensure they still exist
      const user = await User.findById(decoded.userId)
      if (!user) {
        throw createError("User not found", 404)
      }

      // Generate new token
      const newToken = generateToken({
        walletAddress: user.walletAddress,
        userId: user._id.toString(),
        did: user.did,
      })

      res.json({ token: newToken })
    } catch (error) {
      throw createError("Token refresh failed", 401)
    }
  }),
)

export default router
