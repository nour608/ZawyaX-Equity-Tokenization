import { createThirdwebClient, getContract } from "thirdweb";
import { 
  ethereum,
  sepolia,
  base,
  baseSepolia,
  optimism,
  optimismSepolia,
  arbitrum,
  arbitrumSepolia,
  polygon,
  polygonAmoy,
  avalanche,
  avalancheFuji,
  bsc,
  bscTestnet
} from "thirdweb/chains";

import { defineChain } from "thirdweb/chains";

// Custom Etherlink chains
const etherlinkTestnet = defineChain({
  id: 128123,
  name: "Etherlink Testnet",
  nativeCurrency: {
    name: "Tezos",
    symbol: "XTZ",
    decimals: 18,
  },
  rpc: "https://node.ghostnet.tezos.network",
  blockExplorers: [
    {
      name: "TzKT",
      url: "https://ghostnet.tzkt.io",
    },
  ],
});

const etherlinkMainnet = defineChain({
  id: 128124,
  name: "Etherlink",
  nativeCurrency: {
    name: "Tezos",
    symbol: "XTZ", 
    decimals: 18,
  },
  rpc: "https://node.etherlink.com",
  blockExplorers: [
    {
      name: "Etherlink Explorer",
      url: "https://explorer.etherlink.com",
    },
  ],
});

// Create thirdweb client
export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "demo_client_id_for_development",
});

// Chain configuration - Popular networks for better user experience
export const supportedChains = [
  // Ethereum ecosystem
  ethereum,
  sepolia,
  
  // Layer 2 solutions
  base,
  baseSepolia,
  optimism,
  optimismSepolia,
  arbitrum,
  arbitrumSepolia,
  polygon,
  polygonAmoy,
  
  // Alternative L1s
  avalanche,
  avalancheFuji,
  bsc,
  bscTestnet,
  
  // Etherlink
  etherlinkMainnet,
  etherlinkTestnet,
];

// Network categories for the switcher modal
export const networkSections = [
  {
    label: "Recently Used",
    chains: [base, ethereum, etherlinkMainnet],
  },
  {
    label: "Ethereum Ecosystem", 
    chains: [ethereum, sepolia],
  },
  {
    label: "Layer 2 Solutions",
    chains: [base, baseSepolia, optimism, optimismSepolia, arbitrum, arbitrumSepolia, polygon, polygonAmoy],
  },
  {
    label: "Alternative L1s",
    chains: [avalanche, avalancheFuji, bsc, bscTestnet],
  },
  {
    label: "Etherlink",
    chains: [etherlinkMainnet, etherlinkTestnet],
  },
];

export const getActiveChain = () => {
  const isMainnet = import.meta.env.VITE_CHAIN_ID === "8453";
  return isMainnet ? base : baseSepolia;
};

// Contract configurations
export const contracts = {
  factory: {
    address: import.meta.env.VITE_FACTORY_CONTRACT as `0x${string}`,
    chain: getActiveChain(),
  },
  equityToken: {
    address: import.meta.env.VITE_EQUITY_TOKEN_CONTRACT as `0x${string}`,
    chain: getActiveChain(),
  },
  currencyManager: {
    address: import.meta.env.VITE_CURRENCY_MANAGER_CONTRACT as `0x${string}`,
    chain: getActiveChain(),
  },
  userRegistry: {
    address: import.meta.env.VITE_USER_REGISTRY_CONTRACT as `0x${string}`,
    chain: getActiveChain(),
  },
  freelance: {
    address: import.meta.env.VITE_FREELANCE_CONTRACT as `0x${string}`,
    chain: getActiveChain(),
  },
  profile: {
    address: import.meta.env.VITE_PROFILE_CONTRACT as `0x${string}`,
    chain: getActiveChain(),
  },
  chat: {
    address: import.meta.env.VITE_CHAT_CONTRACT as `0x${string}`,
    chain: getActiveChain(),
  },
};

/**
 * Get a contract instance
 * @param contractKey - Key from contracts object
 * @returns Contract instance or null if address not configured
 */
export const getContractInstance = (contractKey: keyof typeof contracts) => {
  const config = contracts[contractKey];
  if (!config.address) {
    console.warn(`Contract address not configured for ${contractKey}`);
    return null;
  }
  
  return getContract({
    client,
    chain: config.chain,
    address: config.address,
  });
};

// thirdweb Connect configuration
export const connectConfig = {
  appMetadata: {
    name: import.meta.env.VITE_APP_NAME || "ZawyaX",
    description: "Decentralized equity tokenization platform",
    url: import.meta.env.VITE_APP_URL || "http://localhost:5173",
  },
  chains: supportedChains,
  client,
};