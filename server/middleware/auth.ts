import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { SiweMessage } from "siwe"

export interface AuthenticatedRequest extends Request {
  user?: {
    walletAddress: string
    userId: string
    did?: string
  }
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error("JWT_SECRET not configured")
    }

    const decoded = jwt.verify(token, jwtSecret) as any
    req.user = {
      walletAddress: decoded.walletAddress,
      userId: decoded.userId,
      did: decoded.did,
    }
    next()
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" })
  }
}

export const generateToken = (payload: { walletAddress: string; userId: string; did?: string }): string => {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error("JWT_SECRET not configured")
  }

  return jwt.sign(payload, jwtSecret, { expiresIn: "24h" })
}

export const verifySiweMessage = async (message: string, signature: string): Promise<SiweMessage> => {
  try {
    const siweMessage = new SiweMessage(message)
    const fields = await siweMessage.verify({ signature })
    return siweMessage
  } catch (error) {
    throw new Error("Invalid SIWE signature")
  }
}
