import express from "express"
import { ethers } from "ethers"
import type { AuthenticatedRequest } from "../middleware/auth"
import { asyncHandler, createError } from "../middleware/errorHandler"

const router = express.Router()

// Contract ABIs (simplified for key functions)
const DID_REGISTRY_ABI = [
  "function registerDID(string memory _did, string memory _documentHash) external",
  "function getDIDDocument(string memory _did) external view returns (string memory, string memory, address, uint256, uint256, bool)",
  "function isDIDActive(string memory _did) external view returns (bool)",
]

const REVOCATION_LIST_ABI = [
  "function registerCredential(string memory _credentialId, uint256 _listId) external returns (uint256)",
  "function revokeCredential(string memory _credentialId, string memory _reason) external",
  "function isRevoked(string memory _credentialId) external view returns (bool)",
  "function getCredentialStatus(string memory _credentialId) external view returns (uint256, uint256, bool, bool, uint256, uint256, string memory)",
]

// Initialize provider
const getProvider = () => {
  const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL
  if (!rpcUrl) {
    throw new Error("RPC URL not configured")
  }
  return new ethers.JsonRpcProvider(rpcUrl)
}

// Initialize signer (for write operations)
const getSigner = () => {
  const provider = getProvider()
  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey) {
    throw new Error("Private key not configured")
  }
  return new ethers.Wallet(privateKey, provider)
}

/**
 * @swagger
 * /api/contracts/did/register:
 *   post:
 *     summary: Register DID on-chain
 *     description: Register a DID in the DID Registry contract
 *     tags: [Contracts]
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
 *               - documentHash
 *             properties:
 *               did:
 *                 type: string
 *               documentHash:
 *                 type: string
 *     responses:
 *       200:
 *         description: DID registered successfully
 */
router.post(
  "/did/register",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { did, documentHash } = req.body

    if (!did || !documentHash) {
      throw createError("DID and document hash are required", 400)
    }

    const contractAddress = process.env.NEXT_PUBLIC_DID_REGISTRY_CONTRACT
    if (!contractAddress) {
      throw createError("DID Registry contract not configured", 500)
    }

    try {
      const signer = getSigner()
      const contract = new ethers.Contract(contractAddress, DID_REGISTRY_ABI, signer)

      const tx = await contract.registerDID(did, documentHash)
      const receipt = await tx.wait()

      res.json({
        message: "DID registered successfully",
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        did,
        documentHash,
      })
    } catch (error) {
      console.error("DID registration error:", error)
      throw createError("Failed to register DID: " + error.message, 500)
    }
  }),
)

/**
 * @swagger
 * /api/contracts/did/{did}:
 *   get:
 *     summary: Get DID document from contract
 *     description: Retrieve DID document from the DID Registry contract
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: DID document retrieved successfully
 */
router.get(
  "/did/:did",
  asyncHandler(async (req, res) => {
    const { did } = req.params

    const contractAddress = process.env.NEXT_PUBLIC_DID_REGISTRY_CONTRACT
    if (!contractAddress) {
      throw createError("DID Registry contract not configured", 500)
    }

    try {
      const provider = getProvider()
      const contract = new ethers.Contract(contractAddress, DID_REGISTRY_ABI, provider)

      const [didValue, documentHash, controller, created, updated, isActive] = await contract.getDIDDocument(did)

      res.json({
        did: didValue,
        documentHash,
        controller,
        created: Number(created),
        updated: Number(updated),
        isActive,
      })
    } catch (error) {
      console.error("DID retrieval error:", error)
      throw createError("Failed to retrieve DID: " + error.message, 500)
    }
  }),
)

/**
 * @swagger
 * /api/contracts/revocation/register:
 *   post:
 *     summary: Register credential in revocation list
 *     description: Register a credential in the revocation list contract
 *     tags: [Contracts]
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
 *               - listId
 *             properties:
 *               credentialId:
 *                 type: string
 *               listId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Credential registered successfully
 */
router.post(
  "/revocation/register",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { credentialId, listId } = req.body

    if (!credentialId || listId === undefined) {
      throw createError("Credential ID and list ID are required", 400)
    }

    const contractAddress = process.env.NEXT_PUBLIC_REVOCATION_LIST_CONTRACT
    if (!contractAddress) {
      throw createError("Revocation List contract not configured", 500)
    }

    try {
      const signer = getSigner()
      const contract = new ethers.Contract(contractAddress, REVOCATION_LIST_ABI, signer)

      const tx = await contract.registerCredential(credentialId, listId)
      const receipt = await tx.wait()

      // Extract status list index from transaction logs
      const statusListIndex = receipt.logs.length > 0 ? 0 : 0 // Simplified

      res.json({
        message: "Credential registered in revocation list",
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        credentialId,
        listId,
        statusListIndex,
      })
    } catch (error) {
      console.error("Credential registration error:", error)
      throw createError("Failed to register credential: " + error.message, 500)
    }
  }),
)

/**
 * @swagger
 * /api/contracts/revocation/revoke:
 *   post:
 *     summary: Revoke credential on-chain
 *     description: Revoke a credential in the revocation list contract
 *     tags: [Contracts]
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
  "/revocation/revoke",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { credentialId, reason = "No reason provided" } = req.body

    if (!credentialId) {
      throw createError("Credential ID is required", 400)
    }

    const contractAddress = process.env.NEXT_PUBLIC_REVOCATION_LIST_CONTRACT
    if (!contractAddress) {
      throw createError("Revocation List contract not configured", 500)
    }

    try {
      const signer = getSigner()
      const contract = new ethers.Contract(contractAddress, REVOCATION_LIST_ABI, signer)

      const tx = await contract.revokeCredential(credentialId, reason)
      const receipt = await tx.wait()

      res.json({
        message: "Credential revoked successfully",
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        credentialId,
        reason,
      })
    } catch (error) {
      console.error("Credential revocation error:", error)
      throw createError("Failed to revoke credential: " + error.message, 500)
    }
  }),
)

/**
 * @swagger
 * /api/contracts/revocation/status/{credentialId}:
 *   get:
 *     summary: Check credential revocation status
 *     description: Check if a credential is revoked in the revocation list contract
 *     tags: [Contracts]
 *     parameters:
 *       - in: path
 *         name: credentialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Credential status retrieved successfully
 */
router.get(
  "/revocation/status/:credentialId",
  asyncHandler(async (req, res) => {
    const { credentialId } = req.params

    const contractAddress = process.env.NEXT_PUBLIC_REVOCATION_LIST_CONTRACT
    if (!contractAddress) {
      throw createError("Revocation List contract not configured", 500)
    }

    try {
      const provider = getProvider()
      const contract = new ethers.Contract(contractAddress, REVOCATION_LIST_ABI, provider)

      const isRevoked = await contract.isRevoked(credentialId)
      const [listId, statusListIndex, revoked, suspended, revokedAt, suspendedAt, reason] =
        await contract.getCredentialStatus(credentialId)

      res.json({
        credentialId,
        isRevoked,
        listId: Number(listId),
        statusListIndex: Number(statusListIndex),
        revoked,
        suspended,
        revokedAt: Number(revokedAt),
        suspendedAt: Number(suspendedAt),
        reason,
      })
    } catch (error) {
      console.error("Credential status check error:", error)
      throw createError("Failed to check credential status: " + error.message, 500)
    }
  }),
)

/**
 * @swagger
 * /api/contracts/network-info:
 *   get:
 *     summary: Get network information
 *     description: Get current blockchain network information
 *     tags: [Contracts]
 *     responses:
 *       200:
 *         description: Network information retrieved successfully
 */
router.get(
  "/network-info",
  asyncHandler(async (req, res) => {
    try {
      const provider = getProvider()
      const network = await provider.getNetwork()
      const blockNumber = await provider.getBlockNumber()

      res.json({
        chainId: Number(network.chainId),
        name: network.name,
        blockNumber,
        contracts: {
          didRegistry: process.env.NEXT_PUBLIC_DID_REGISTRY_CONTRACT,
          revocationList: process.env.NEXT_PUBLIC_REVOCATION_LIST_CONTRACT,
          touristIdentity: process.env.NEXT_PUBLIC_TOURIST_IDENTITY_CONTRACT,
          groupManagement: process.env.NEXT_PUBLIC_GROUP_MANAGEMENT_CONTRACT,
          emergencySystem: process.env.NEXT_PUBLIC_EMERGENCY_SYSTEM_CONTRACT,
          tripVerification: process.env.NEXT_PUBLIC_TRIP_VERIFICATION_CONTRACT,
        },
      })
    } catch (error) {
      console.error("Network info error:", error)
      throw createError("Failed to get network information: " + error.message, 500)
    }
  }),
)

export default router
