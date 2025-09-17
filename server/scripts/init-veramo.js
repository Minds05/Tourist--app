const { initializeVeramoDatabase, getIssuerDID } = require("../services/veramo-agent")

async function initializeVeramo() {
  try {
    console.log("🔧 Initializing Veramo database...")
    await initializeVeramoDatabase()

    console.log("🆔 Setting up issuer DID...")
    const issuerDID = await getIssuerDID()
    console.log("✅ Issuer DID:", issuerDID)

    console.log("🎉 Veramo initialization complete!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Veramo initialization failed:", error)
    process.exit(1)
  }
}

initializeVeramo()
