const { ethers } = require("hardhat")
const hre = require("hardhat") // Declare hre variable

async function main() {
  console.log("🚀 Deploying missing smart contracts...")

  // Get deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with account:", deployer.address)
  console.log("Account balance:", (await deployer.getBalance()).toString())

  // Deploy DIDRegistry
  console.log("\n📋 Deploying DIDRegistry...")
  const DIDRegistry = await ethers.getContractFactory("DIDRegistry")
  const didRegistry = await DIDRegistry.deploy()
  await didRegistry.deployed()
  console.log("✅ DIDRegistry deployed to:", didRegistry.address)

  // Deploy RevocationList
  console.log("\n🚫 Deploying RevocationList...")
  const RevocationList = await ethers.getContractFactory("RevocationList")
  const revocationList = await RevocationList.deploy()
  await revocationList.deployed()
  console.log("✅ RevocationList deployed to:", revocationList.address)

  // Create initial status lists
  console.log("\n📝 Creating initial status lists...")

  // Create revocation status list
  const createRevocationTx = await revocationList.createStatusList("revocation")
  await createRevocationTx.wait()
  console.log("✅ Revocation status list created")

  // Create suspension status list
  const createSuspensionTx = await revocationList.createStatusList("suspension")
  await createSuspensionTx.wait()
  console.log("✅ Suspension status list created")

  // Deploy a sample GroupMembershipNFT for testing
  console.log("\n👥 Deploying sample GroupMembershipNFT...")
  const GroupMembershipNFT = await ethers.getContractFactory("GroupMembershipNFT")

  const sampleGroupNFT = await GroupMembershipNFT.deploy(
    "sample-group-001",
    "Paris Adventure 2024",
    "Paris, France",
    Math.floor(Date.now() / 1000) + 86400 * 30, // Start in 30 days
    Math.floor(Date.now() / 1000) + 86400 * 37, // End in 37 days (7-day trip)
    10, // Max 10 members
    deployer.address,
    "https://ipfs.io/ipfs/QmSampleGroupMetadata",
  )
  await sampleGroupNFT.deployed()
  console.log("✅ Sample GroupMembershipNFT deployed to:", sampleGroupNFT.address)

  // Register issuer DID in DIDRegistry
  if (process.env.ISSUER_DID && process.env.ISSUER_DID_DOCUMENT_HASH) {
    console.log("\n🆔 Registering issuer DID...")
    const registerIssuerTx = await didRegistry.registerIssuerDID(
      process.env.ISSUER_DID,
      process.env.ISSUER_DID_DOCUMENT_HASH,
      deployer.address,
    )
    await registerIssuerTx.wait()
    console.log("✅ Issuer DID registered")
  }

  // Add deployer as issuer in RevocationList
  console.log("\n👤 Adding deployer as issuer in RevocationList...")
  const addIssuerTx = await revocationList.addIssuer(deployer.address)
  await addIssuerTx.wait()
  console.log("✅ Deployer added as issuer")

  // Summary
  console.log("\n🎉 Deployment Summary:")
  console.log("=".repeat(50))
  console.log("DIDRegistry:", didRegistry.address)
  console.log("RevocationList:", revocationList.address)
  console.log("Sample GroupMembershipNFT:", sampleGroupNFT.address)
  console.log("=".repeat(50))

  // Save addresses to environment file
  console.log("\n💾 Contract addresses saved. Update your .env file:")
  console.log(`NEXT_PUBLIC_DID_REGISTRY_CONTRACT=${didRegistry.address}`)
  console.log(`NEXT_PUBLIC_REVOCATION_LIST_CONTRACT=${revocationList.address}`)
  console.log(`SAMPLE_GROUP_NFT_CONTRACT=${sampleGroupNFT.address}`)

  // Verify contracts on Etherscan (if API key is provided)
  if (process.env.ETHERSCAN_API_KEY && process.env.NODE_ENV !== "development") {
    console.log("\n🔍 Verifying contracts on Etherscan...")

    try {
      await hre.run("verify:verify", {
        address: didRegistry.address,
        constructorArguments: [],
      })
      console.log("✅ DIDRegistry verified")
    } catch (error) {
      console.log("❌ DIDRegistry verification failed:", error.message)
    }

    try {
      await hre.run("verify:verify", {
        address: revocationList.address,
        constructorArguments: [],
      })
      console.log("✅ RevocationList verified")
    } catch (error) {
      console.log("❌ RevocationList verification failed:", error.message)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error)
    process.exit(1)
  })
