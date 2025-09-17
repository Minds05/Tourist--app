import { Router } from "express"
import { blockchainService } from "../services/blockchain-service"
import { didService } from "../services/did-service"

const router = Router()

// Get blockchain network info
router.get("/network", async (req, res) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo()
    res.json(networkInfo)
  } catch (error) {
    console.error("Failed to get network info:", error)
    res.status(500).json({ error: "Failed to get network info" })
  }
})

// Get account balance
router.get("/balance/:address", async (req, res) => {
  try {
    const { address } = req.params
    const balance = await blockchainService.getBalance(address)
    res.json({ balance })
  } catch (error) {
    console.error("Failed to get balance:", error)
    res.status(500).json({ error: "Failed to get balance" })
  }
})

// Get transaction receipt
router.get("/transaction/:hash", async (req, res) => {
  try {
    const { hash } = req.params
    const receipt = await blockchainService.getTransactionReceipt(hash)
    res.json(receipt)
  } catch (error) {
    console.error("Failed to get transaction receipt:", error)
    res.status(500).json({ error: "Failed to get transaction receipt" })
  }
})

// Create DID
router.post("/did/create", async (req, res) => {
  try {
    const { alias } = req.body
    if (!alias) {
      return res.status(400).json({ error: "Alias is required" })
    }

    const did = await didService.createTouristDID(alias)
    res.json(did)
  } catch (error) {
    console.error("Failed to create DID:", error)
    res.status(500).json({ error: "Failed to create DID" })
  }
})

// Resolve DID
router.get("/did/resolve/:did", async (req, res) => {
  try {
    const { did } = req.params
    const resolution = await didService.resolveDID(did)
    res.json(resolution)
  } catch (error) {
    console.error("Failed to resolve DID:", error)
    res.status(500).json({ error: "Failed to resolve DID" })
  }
})

// Create verifiable credential
router.post("/credential/create", async (req, res) => {
  try {
    const { issuerDID, subjectDID, credentialData, credentialType } = req.body

    if (!issuerDID || !subjectDID || !credentialData || !credentialType) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const credential = await didService.createVerifiableCredential(
      issuerDID,
      subjectDID,
      credentialData,
      credentialType,
    )
    res.json(credential)
  } catch (error) {
    console.error("Failed to create credential:", error)
    res.status(500).json({ error: "Failed to create credential" })
  }
})

// Verify credential
router.post("/credential/verify", async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential) {
      return res.status(400).json({ error: "Credential is required" })
    }

    const isValid = await didService.verifyCredential(credential)
    res.json({ verified: isValid })
  } catch (error) {
    console.error("Failed to verify credential:", error)
    res.status(500).json({ error: "Failed to verify credential" })
  }
})

// List DIDs
router.get("/did/list", async (req, res) => {
  try {
    const dids = await didService.listDIDs()
    res.json(dids)
  } catch (error) {
    console.error("Failed to list DIDs:", error)
    res.status(500).json({ error: "Failed to list DIDs" })
  }
})

export default router
