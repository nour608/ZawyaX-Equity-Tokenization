import { 
  generateSecretKey, 
  getPublicKey, 
  nip19, 
  finalizeEvent,
  validateEvent,
  verifyEvent,
  nip04
} from 'nostr-tools';
import { NostrEvent, UnsignedEvent, Profile, EventKind } from './types';

// Generate new key pair
export function generateKeyPair() {
  const privateKey = generateSecretKey();
  const publicKey = getPublicKey(privateKey);
  
  return {
    privateKey,
    publicKey,
    npub: nip19.npubEncode(publicKey),
    nsec: nip19.nsecEncode(privateKey)
  };
}

// Import keys from nsec/npub format
export function importKeys(input: string) {
  try {
    if (input.startsWith('nsec')) {
      const decoded = nip19.decode(input);
      if (decoded.type === 'nsec') {
        const privateKey = decoded.data;
        const publicKey = getPublicKey(privateKey);
        return {
          privateKey,
          publicKey,
          npub: nip19.npubEncode(publicKey),
          nsec: input
        };
      }
    } else if (input.startsWith('npub')) {
      const decoded = nip19.decode(input);
      if (decoded.type === 'npub') {
        return {
          publicKey: decoded.data,
          npub: input
        };
      }
    }
    throw new Error('Invalid key format');
  } catch (error) {
    throw new Error('Failed to import keys: ' + (error as Error).message);
  }
}

// Create and sign an event
export async function createEvent(
  content: string,
  kind: number,
  tags: string[][] = [],
  privateKey: Uint8Array
): Promise<NostrEvent> {
  const event: UnsignedEvent = {
    pubkey: getPublicKey(privateKey),
    created_at: Math.floor(Date.now() / 1000),
    kind,
    tags,
    content
  };

  return finalizeEvent(event, privateKey);
}

// Encrypt a direct message using NIP-04
export async function encryptMessage(
  content: string,
  recipientPubkey: string,
  privateKey: Uint8Array
): Promise<string> {
  return await nip04.encrypt(privateKey, recipientPubkey, content);
}

// Decrypt a direct message using NIP-04
export async function decryptMessage(
  encryptedContent: string,
  senderPubkey: string,
  privateKey: Uint8Array
): Promise<string> {
  try {
    return await nip04.decrypt(privateKey, senderPubkey, encryptedContent);
  } catch (error) {
    console.error('Failed to decrypt message:', error);
    return '[Failed to decrypt message]';
  }
}

// NIP-17: Create private message event
export function createPrivateMessageEvent(
  content: string,
  recipientPubkey: string,
  privateKey: Uint8Array
): Promise<NostrEvent> {
  // For NIP-17, we create a kind 17 event with encrypted content
  return createEvent(
    content,
    EventKind.PrivateMessage,
    [['p', recipientPubkey]],
    privateKey
  );
}

// NIP-17: Parse private message content
export function parsePrivateMessage(event: NostrEvent): {
  recipient: string;
  content: string;
} | null {
  if (event.kind !== EventKind.PrivateMessage) return null;
  
  const recipientTag = event.tags.find(tag => tag[0] === 'p');
  if (!recipientTag) return null;
  
  return {
    recipient: recipientTag[1],
    content: event.content
  };
}

// Parse profile metadata from event content
export function parseProfile(content: string): Profile {
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}

// Format timestamp for display
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  
  return date.toLocaleDateString();
}

// Truncate npub/nsec for display
export function truncateKey(key: string, length: number = 8): string {
  if (key.length <= length * 2) return key;
  return `${key.slice(0, length)}...${key.slice(-length)}`;
}

// Format public key for better display
export function formatPublicKey(pubkey: string): string {
  // If it's already an npub format, truncate it nicely
  if (pubkey.startsWith('npub1')) {
    return `@${truncateKey(pubkey, 6)}`;
  }
  
  // If it's a hex public key, convert to npub first
  try {
    const { nip19 } = require('nostr-tools');
    const npub = nip19.npubEncode(pubkey);
    return `@${truncateKey(npub, 6)}`;
  } catch (error) {
    // Fallback to hex format with @ prefix
    return `@${truncateKey(pubkey, 6)}`;
  }
}

// Validate event signature
export function isValidEvent(event: NostrEvent): boolean {
  try {
    return validateEvent(event) && verifyEvent(event);
  } catch {
    return false;
  }
}

// Extract mentions from content
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(npub1[a-z0-9]+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
}

// Replace mentions with links
export function replaceMentions(content: string): string {
  return content.replace(
    /@(npub1[a-z0-9]+)/g,
    '<a href="#/profile/$1" class="text-primary hover:underline">@$1</a>'
  );
}

// Extract hashtags from content
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const hashtags: string[] = [];
  let match;
  
  while ((match = hashtagRegex.exec(content)) !== null) {
    hashtags.push(match[1]);
  }
  
  return hashtags;
}

// Default relay URLs
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://nostr-pub.wellorder.net'
];

// Storage keys
export const STORAGE_KEYS = {
  PRIVATE_KEY: 'nostr_private_key',
  PUBLIC_KEY: 'nostr_public_key',
  RELAYS: 'nostr_relays',
  PROFILE: 'nostr_profile',
  CONTACTS: 'nostr_contacts'
};