import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import dotenv from "dotenv"
import rateLimit from "express-rate-limit"
import swaggerUi from "swagger-ui-express"
import swaggerJsdoc from "swagger-jsdoc"

// Import routes
import authRoutes from "./routes/auth"
import userRoutes from "./routes/users"
import kycRoutes from "./routes/kyc"
import credentialRoutes from "./routes/credentials"
import groupRoutes from "./routes/groups"
import verifyRoutes from "./routes/verify"
import contractRoutes from "./routes/contracts"
import messagingRoutes from "./routes/messaging"
import emergencyRoutes from "./routes/emergency"
import ipfsRoutes from "./routes/ipfs"
import blockchainRoutes from "./routes/blockchain"

// Import middleware
import { errorHandler } from "./middleware/errorHandler"
import { authenticateToken } from "./middleware/auth"

// Import database connection
import { connectDatabase } from "./config/database"

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Tourist Protection DID API",
      version: "1.0.0",
      description: "Decentralized Identity API for Tourist Protection System",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./server/routes/*.ts"], // paths to files containing OpenAPI definitions
}

const specs = swaggerJsdoc(swaggerOptions)

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(morgan("combined"))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(limiter)

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Tourist Protection DID API",
  })
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", authenticateToken, userRoutes)
app.use("/api/kyc", authenticateToken, kycRoutes)
app.use("/api/credentials", credentialRoutes)
app.use("/api/groups", authenticateToken, groupRoutes)
app.use("/api/verify", verifyRoutes)
app.use("/api/contracts", contractRoutes)
app.use("/api/messaging", authenticateToken, messagingRoutes)
app.use("/api/emergency", authenticateToken, emergencyRoutes)
app.use("/api/ipfs", ipfsRoutes)
app.use("/api/blockchain", blockchainRoutes)

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase()

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`)
      console.log(`🏥 Health check available at http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()

export default app
