import mongoose from "mongoose"
import { Pool } from "pg"

// MongoDB connection
export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/tourist-protection"
    await mongoose.connect(mongoUri)
    console.log("✅ Connected to MongoDB")
  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    throw error
  }
}

// PostgreSQL connection
export const connectPostgreSQL = (): Pool => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRESQL_URI,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  })

  pool.on("connect", () => {
    console.log("✅ Connected to PostgreSQL")
  })

  pool.on("error", (err) => {
    console.error("❌ PostgreSQL connection error:", err)
  })

  return pool
}

// Database connection based on environment preference
export const connectDatabase = async (): Promise<void> => {
  const dbType = process.env.DATABASE_TYPE || "mongodb"

  if (dbType === "postgresql") {
    // Initialize PostgreSQL connection
    const pool = connectPostgreSQL()
    // Test connection
    try {
      const client = await pool.connect()
      client.release()
      console.log("✅ PostgreSQL connection tested successfully")
    } catch (error) {
      console.error("❌ PostgreSQL connection test failed:", error)
      throw error
    }
  } else {
    // Default to MongoDB
    await connectMongoDB()
  }
}

// Export PostgreSQL pool for use in routes
export const pgPool = process.env.DATABASE_TYPE === "postgresql" ? connectPostgreSQL() : null
