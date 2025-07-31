export const APP_CONFIG = {
  name: "ZawyaX",
  description: "Decentralized equity tokenization platform with freelance marketplace and social features",
  version: "0.1.0",
  url: import.meta.env.VITE_APP_URL || "http://localhost:5173",
} as const;

export const CHAIN_CONFIG = {
  base: {
    testnet: {
      id: 84532, // Base Sepolia
      name: "Base Sepolia",
      rpcUrl: "https://sepolia.base.org",
      blockExplorer: "https://sepolia.basescan.org",
    },
    mainnet: {
      id: 8453, // Base Mainnet
      name: "Base",
      rpcUrl: "https://mainnet.base.org",
      blockExplorer: "https://basescan.org",
    },
  },
  etherlink: {
    testnet: {
      id: 128123, // Etherlink Testnet
      name: "Etherlink Testnet",
      rpcUrl: "https://node.ghostnet.tezos.network",
      blockExplorer: "https://ghostnet.tzkt.io",
    },
    mainnet: {
      id: 128124, // Etherlink Mainnet
      name: "Etherlink",
      rpcUrl: "https://node.etherlink.com",
      blockExplorer: "https://explorer.etherlink.com",
    },
  },
} as const;

export const FEATURE_FLAGS = {
  enableGaslessTransactions: import.meta.env.VITE_ENABLE_GASLESS_TRANSACTIONS === "true",
  enableBuyCrypto: import.meta.env.VITE_ENABLE_BUY_CRYPTO === "true",
} as const;

export const ROUTES = {
  HOME: "/",
  APP: "/app",
  EQUITY: "/app/equity",
  PROFILE: "/app/profile",
  CHAT: "/app/chat",
  FREELANCE: "/app/freelance",
} as const;

export const STORAGE_KEYS = {
  THEME: "zawayax-theme",
  USER_PREFERENCES: "zawayax-preferences",
  WALLET_CONNECTION: "zawayax-wallet-connection",
} as const;