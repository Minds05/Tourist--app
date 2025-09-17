import express from "express"
import { ipfsService } from "../services/ipfs-service"
import { authenticateToken } from "../middleware/auth"

const router = express.Router()

// Store data on IPFS
router.post("/store", authenticateToken, async (req, res) => {
  try {
    const { data, encryptionKey } = req.body

    if (!data) {
      return res.status(400).json({ error: "Data is required" })
    }

    const cid = await ipfsService.storeEncrypted(data, encryptionKey)

    // Pin the content for persistence
    await ipfsService.pinContent(cid)

    res.json({ cid })
  } catch (error) {
    console.error("IPFS store error:", error)
    res.status(500).json({ error: "Failed to store data on IPFS" })
  }
})

// Retrieve data from IPFS
router.get("/retrieve/:cid", authenticateToken, async (req, res) => {
  try {
    const { cid } = req.params
    const { encryptionKey } = req.query

    if (!cid) {
      return res.status(400).json({ error: "CID is required" })
    }

    const data = await ipfsService.retrieveDecrypted(cid, encryptionKey as string)
    res.json({ data })
  } catch (error) {
    console.error("IPFS retrieve error:", error)
    res.status(500).json({ error: "Failed to retrieve data from IPFS" })
  }
})

// Store credential on IPFS
router.post("/store-credential", authenticateToken, async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ error: "Credential is required" })
    }

    const cid = await ipfsService.storeCredential(credential)

    // Pin the content for persistence
    await ipfsService.pinContent(cid)

    res.json({ cid })
  } catch (error) {
    console.error("IPFS store credential error:", error)
    res.status(500).json({ error: "Failed to store credential on IPFS" })
  }
})

// Retrieve credential from IPFS
router.get("/retrieve-credential/:cid", authenticateToken, async (req, res) => {
  try {
    const { cid } = req.params

    if (!cid) {
      return res.status(400).json({ error: "CID is required" })
    }

    const credential = await ipfsService.retrieveCredential(cid)
    res.json({ credential })
  } catch (error) {
    console.error("IPFS retrieve credential error:", error)
    res.status(500).json({ error: "Failed to retrieve credential from IPFS" })
  }
})

export default router
