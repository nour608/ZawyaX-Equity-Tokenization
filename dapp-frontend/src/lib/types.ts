// Core Web3 types
export interface ContractAddress {
  address: `0x${string}`;
  chain: string;
}

// Equity Token types
export interface EquityToken {
  id: string;
  address: `0x${string}`;
  name: string;
  symbol: string;
  totalSupply: bigint;
  userBalance: bigint;
  description: string;
  price: bigint;
  logo?: string;
}

export interface TokenTransaction {
  id: string;
  type: 'mint' | 'transfer' | 'burn';
  from: `0x${string}`;
  to: `0x${string}`;
  amount: bigint;
  tokenAddress: `0x${string}`;
  timestamp: Date;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

// Freelance types
export interface FreelanceJob {
  id: string;
  title: string;
  description: string;
  budget: bigint;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  client: `0x${string}`;
  freelancer: `0x${string}` | null;
  deadline: Date;
  skills: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface JobProposal {
  id: string;
  jobId: string;
  freelancer: `0x${string}`;
  proposedBudget: bigint;
  proposal: string;
  deliveryTime: number; // days
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

// Profile types
export interface UserProfile {
  address: `0x${string}`;
  name?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    discord?: string;
  };
  reputation: number;
  completedJobs: number;
  totalEarnings: bigint;
  skills: string[];
  joinedAt: Date;
  isVerified?: boolean;
}

export interface SocialProfile {
  type: 'google' | 'twitter' | 'discord' | 'github';
  id: string;
  username: string;
  avatar?: string;
  email?: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  from: `0x${string}`;
  to: `0x${string}`;
  message: string;
  timestamp: Date;
  read: boolean;
  messageType?: 'text' | 'file' | 'image';
  metadata?: Record<string, unknown>;
}

export interface ChatChannel {
  id: string;
  participants: `0x${string}`[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
}

// Transaction types
export interface TransactionState {
  hash?: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
  confirmations?: number;
}

// UI types
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: number;
  disabled?: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// App state types
export interface AppState {
  isConnected: boolean;
  userAddress: `0x${string}` | null;
  userProfile: UserProfile | null;
  currentChain: number;
  isLoading: boolean;
  error: string | null;
  notifications: Notification[];
}

// Hook return types
export interface UseContractReturn<T = unknown> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTransactionReturn {
  execute: (...args: unknown[]) => Promise<void>;
  transaction: TransactionState;
  reset: () => void;
}

// Component prop types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export interface WalletConnectionProps {
  onConnect?: (address: `0x${string}`) => void;
  onDisconnect?: () => void;
  showBuyCrypto?: boolean;
}