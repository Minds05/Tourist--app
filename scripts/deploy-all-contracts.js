const { ethers } = require("hardhat")
const hre = require("hardhat")

async function main() {
  console.log("Deploying Tourist Protection App contracts...")

  // Get the deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with account:", deployer.address)
  console.log("Account balance:", (await deployer.getBalance()).toString())

  // Deploy TouristIdentity contract
  console.log("Deploying TouristIdentity...")
  const TouristIdentity = await ethers.getContractFactory("TouristIdentity")
  const touristIdentity = await TouristIdentity.deploy()
  await touristIdentity.deployed()
  console.log("TouristIdentity deployed to:", touristIdentity.address)

  // Deploy GroupManagement contract
  console.log("Deploying GroupManagement...")
  const GroupManagement = await ethers.getContractFactory("GroupManagement")
  const groupManagement = await GroupManagement.deploy()
  await groupManagement.deployed()
  console.log("GroupManagement deployed to:", groupManagement.address)

  // Deploy TripVerification contract
  console.log("Deploying TripVerification...")
  const TripVerification = await ethers.getContractFactory("TripVerification")
  const tripVerification = await TripVerification.deploy()
  await tripVerification.deployed()
  console.log("TripVerification deployed to:", tripVerification.address)

  // Deploy EmergencySystem contract
  console.log("Deploying EmergencySystem...")
  const EmergencySystem = await ethers.getContractFactory("EmergencySystem")
  const emergencySystem = await EmergencySystem.deploy()
  await emergencySystem.deployed()
  console.log("EmergencySystem deployed to:", emergencySystem.address)

  // Save contract addresses to environment file
  const fs = require("fs")
  const contractAddresses = {
    TOURIST_IDENTITY: touristIdentity.address,
    GROUP_MANAGEMENT: groupManagement.address,
    TRIP_VERIFICATION: tripVerification.address,
    EMERGENCY_SYSTEM: emergencySystem.address,
  }

  const envContent = Object.entries(contractAddresses)
    .map(([key, value]) => `NEXT_PUBLIC_${key}_CONTRACT=${value}`)
    .join("\n")

  fs.writeFileSync(".env.local", envContent)
  console.log("Contract addresses saved to .env.local")

  // Create deployment summary
  const deploymentSummary = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: contractAddresses,
    gasUsed: {
      // These would be calculated from actual deployment transactions
      touristIdentity: "estimated",
      groupManagement: "estimated",
      tripVerification: "estimated",
      emergencySystem: "estimated",
    },
  }

  fs.writeFileSync("deployment-summary.json", JSON.stringify(deploymentSummary, null, 2))
  console.log("Deployment summary saved to deployment-summary.json")

  // Verify contracts on Etherscan (optional)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...")
    await touristIdentity.deployTransaction.wait(6)
    await groupManagement.deployTransaction.wait(6)
    await tripVerification.deployTransaction.wait(6)
    await emergencySystem.deployTransaction.wait(6)

    console.log("Verifying contracts on Etherscan...")
    try {
      await hre.run("verify:verify", {
        address: touristIdentity.address,
        constructorArguments: [],
      })

      await hre.run("verify:verify", {
        address: groupManagement.address,
        constructorArguments: [],
      })

      await hre.run("verify:verify", {
        address: tripVerification.address,
        constructorArguments: [],
      })

      await hre.run("verify:verify", {
        address: emergencySystem.address,
        constructorArguments: [],
      })

      console.log("All contracts verified successfully!")
    } catch (error) {
      console.log("Verification failed:", error.message)
    }
  }

  console.log("\n=== Deployment Complete ===")
  console.log("Tourist Protection App smart contracts deployed successfully!")
  console.log("Next steps:")
  console.log("1. Update your frontend configuration with the new contract addresses")
  console.log("2. Test the contracts using the provided interfaces")
  console.log("3. Set up monitoring and alerting for the deployed contracts")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
