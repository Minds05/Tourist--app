export const BLOCKCHAIN_CONFIG = {
  // Ethereum Sepolia Testnet for development
  CHAIN_ID: 11155111,
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
  NETWORK_NAME: "Sepolia",

  // Contract addresses (will be deployed)
  CONTRACTS: {
    TOURIST_IDENTITY: process.env.NEXT_PUBLIC_TOURIST_IDENTITY_CONTRACT || "",
    GROUP_MANAGEMENT: process.env.NEXT_PUBLIC_GROUP_MANAGEMENT_CONTRACT || "",
    EMERGENCY_SYSTEM: process.env.NEXT_PUBLIC_EMERGENCY_SYSTEM_CONTRACT || "",
    TRIP_VERIFICATION: process.env.NEXT_PUBLIC_TRIP_VERIFICATION_CONTRACT || "",
  },

  // IPFS Configuration
  IPFS: {
    HOST: "ipfs.infura.io",
    PORT: 5001,
    PROTOCOL: "https",
    PROJECT_ID: process.env.NEXT_PUBLIC_IPFS_PROJECT_ID || "",
  },

  // DID Configuration
  DID: {
    REGISTRY_ADDRESS: "0xdca7ef03e98e0dc2b855be647c39abe984fcf21b", // Ethereum DID Registry
    RESOLVER_URL: "https://dev.uniresolver.io/1.0/identifiers/",
  },

  // Push Protocol Configuration
  PUSH: {
    ENV: "staging" as const,
    API_URL: "https://backend-staging.push.org/apis",
  },
} as const;

export const SUPPORTED_CHAINS = [
  {
    chainId: 11155111,
    chainName: "Sepolia",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"],
    blockExplorerUrls: ["https://sepolia.etherscan.io/"],
  },
];