const { ethers } = require("hardhat")
const hre = require("hardhat") // Declare hre variable

async function main() {
  console.log("Deploying Tourist Protection App contracts...")

  // Get the deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with account:", deployer.address)
  console.log("Account balance:", (await deployer.getBalance()).toString())

  // Deploy TouristIdentity contract
  const TouristIdentity = await ethers.getContractFactory("TouristIdentity")
  const touristIdentity = await TouristIdentity.deploy()
  await touristIdentity.deployed()
  console.log("TouristIdentity deployed to:", touristIdentity.address)

  // Save contract addresses to environment file
  const fs = require("fs")
  const contractAddresses = {
    TOURIST_IDENTITY: touristIdentity.address,
  }

  const envContent = Object.entries(contractAddresses)
    .map(([key, value]) => `NEXT_PUBLIC_${key}_CONTRACT=${value}`)
    .join("\n")

  fs.writeFileSync(".env.local", envContent)
  console.log("Contract addresses saved to .env.local")

  // Verify contracts on Etherscan (optional)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...")
    await touristIdentity.deployTransaction.wait(6)

    console.log("Verifying contracts on Etherscan...")
    try {
      await hre.run("verify:verify", {
        address: touristIdentity.address,
        constructorArguments: [],
      })
    } catch (error) {
      console.log("Verification failed:", error.message)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
