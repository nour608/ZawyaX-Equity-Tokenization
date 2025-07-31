// Nostr event types and interfaces
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface UnsignedEvent {
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
}

// Event kinds as per NIPs
export enum EventKind {
  Metadata = 0,      // User metadata (profile)
  Profile = 0,       // Alias for Metadata
  TextNote = 1,      // Regular posts
  RecommendRelay = 2,
  Contacts = 3,      // Contact list
  EncryptedDM = 4,   // Encrypted direct message (NIP-04)
  EventDeletion = 5,
  Repost = 6,        // Repost/boost
  Reaction = 7,      // Like/reaction
  BadgeAward = 8,
  ChannelCreation = 40,
  ChannelMetadata = 41,
  ChannelMessage = 42,
  ChannelHideMessage = 43,
  ChannelMuteUser = 44,
  // NIP-17: Private messaging
  PrivateMessage = 17, // Private message (NIP-17)
}

export interface Profile {
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  lud16?: string;
  banner?: string;
  display_name?: string;
  website?: string;
}

export interface Contact {
  pubkey: string;
  profile?: Profile;
  lastMessage?: DirectMessage;
  unreadCount?: number;
}

export interface DirectMessage {
  id: string;
  content: string;
  pubkey: string;
  recipientPubkey: string;
  created_at: number;
  decrypted?: boolean;
  sent?: boolean;
  delivered?: boolean;
  read?: boolean;
}

export interface Relay {
  url: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  read: boolean;
  write: boolean;
  pool?: any; // The SimplePool instance from nostr-tools
}

export interface Filter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  '#e'?: string[];
  '#p'?: string[];
  since?: number;
  until?: number;
  limit?: number;
}

export interface Subscription {
  id: string;
  filters: Filter[];
  relay: string;
}

// Key management types
export interface KeyPair {
  privateKey: Uint8Array;
  publicKey: string;
}

export interface UserKeys {
  npub: string;
  nsec?: string;
  pubkey: string;
  privkey?: string; // Stored as hex string for serialization
}