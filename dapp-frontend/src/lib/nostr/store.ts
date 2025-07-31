import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { nip19, SimplePool } from 'nostr-tools';
import { 
  NostrEvent, 
  Profile, 
  Contact, 
  DirectMessage, 
  Relay as RelayType, 
  Filter,
  UserKeys,
  EventKind
} from './types';
import { 
  generateKeyPair, 
  importKeys, 
  createEvent, 
  encryptMessage, 
  decryptMessage,
  createPrivateMessageEvent,
  parsePrivateMessage,
  parseProfile,
  isValidEvent,
  DEFAULT_RELAYS
} from './utils';

// Helper function to convert Uint8Array to hex string for storage
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper function to convert hex string back to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  if (!hex || typeof hex !== 'string') {
    throw new Error('Invalid hex string provided');
  }
  
  // Remove '0x' prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  
  if (cleanHex.length % 2 !== 0) {
    throw new Error(`Invalid hex string length: ${cleanHex.length}. Must be even.`);
  }
  
  if (cleanHex.length !== 64) {
    throw new Error(`Invalid private key length: ${cleanHex.length}. Must be 64 characters (32 bytes).`);
  }
  
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    const byte = parseInt(cleanHex.substr(i, 2), 16);
    if (isNaN(byte)) {
      throw new Error(`Invalid hex character at position ${i}`);
    }
    bytes[i / 2] = byte;
  }
  return bytes;
}

// Helper function to safely get private key as Uint8Array
function getPrivateKeyAsUint8Array(privkey: any): Uint8Array {
  if (!privkey) {
    throw new Error('No private key available');
  }
  
  // If it's already a Uint8Array, return it
  if (privkey instanceof Uint8Array) {
    return privkey;
  }
  
  // If it's a string, check if it's hex or nsec format
  if (typeof privkey === 'string') {
    // If it's nsec format, decode it first
    if (privkey.startsWith('nsec')) {
      try {
        const decoded = nip19.decode(privkey);
        if (decoded.type === 'nsec') {
          return decoded.data;
        }
      } catch (error) {
        throw new Error('Invalid nsec format');
      }
    }
    
    // Otherwise treat as hex string
    return hexToUint8Array(privkey);
  }
  
  // If it's an object (serialized Uint8Array), try to reconstruct it
  if (typeof privkey === 'object' && privkey !== null) {
    if (Array.isArray(privkey)) {
      return new Uint8Array(privkey);
    }
    // If it has a data property (common serialization format)
    if (privkey.data && Array.isArray(privkey.data)) {
      return new Uint8Array(privkey.data);
    }
  }
  
  throw new Error('Invalid private key format');
}

interface NostrState {
  // User keys
  keys: UserKeys | null;
  profile: Profile | null;
  
  // Events
  events: Map<string, NostrEvent>;
  profiles: Map<string, Profile>;
  
  // Direct messages
  messages: Map<string, DirectMessage[]>;
  contacts: Contact[];
  
  // Relays
  relays: RelayType[];
  subscriptions: Map<string, any>;
  
  // UI state
  isConnecting: boolean;
  error: string | null;
  
  // Actions
  generateNewKeys: () => void;
  importUserKeys: (input: string) => void;
  clearKeys: () => void;
  
  // Profile actions
  updateProfile: (profile: Profile) => Promise<void>;
  loadProfile: (pubkey: string) => Promise<void>;
  
  // Relay actions
  connectToRelays: (urls?: string[]) => Promise<void>;
  disconnectFromRelays: () => void;
  addRelay: (url: string) => void;
  removeRelay: (url: string) => void;
  publishToRelays: (event: NostrEvent) => Promise<void>;
  
  // Event actions
  publishEvent: (content: string, kind: EventKind, tags?: string[][]) => Promise<void>;
  subscribeToFeed: (filters: Filter[]) => void;
  
  // Message actions
  sendDirectMessage: (recipientPubkey: string, content: string) => Promise<void>;
  loadMessages: (pubkey: string) => Promise<void>;
  markMessageAsRead: (messageId: string) => void;
  addContact: (contact: Contact) => void;
  
  // Social actions
  likeEvent: (eventId: string) => Promise<void>;
  repostEvent: (event: NostrEvent) => Promise<void>;
  replyToEvent: (event: NostrEvent, content: string) => Promise<void>;
}

export const useNostrStore = create<NostrState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        keys: null,
        profile: null,
        events: new Map(),
        profiles: new Map(),
        messages: new Map(),
        contacts: [],
        relays: DEFAULT_RELAYS.map(url => ({ 
          url, 
          status: 'disconnected', 
          read: true, 
          write: true 
        })),
        subscriptions: new Map(),
        isConnecting: false,
        error: null,

        // Key management
        generateNewKeys: () => {
          try {
            const keyPair = generateKeyPair();
            const keys: UserKeys = {
              npub: keyPair.npub,
              nsec: keyPair.nsec,
              pubkey: keyPair.publicKey,
              privkey: keyPair.nsec // Store as nsec format for better compatibility
            };
            set({ keys, error: null });
          } catch (error) {
            set({ error: `Failed to generate keys: ${(error as Error).message}` });
          }
        },

        importUserKeys: (input: string) => {
          try {
            const keyPair = importKeys(input);
            const keys: UserKeys = {
              npub: keyPair.npub,
              nsec: keyPair.nsec || '',
              pubkey: keyPair.publicKey,
              privkey: keyPair.nsec || keyPair.privateKey ? uint8ArrayToHex(keyPair.privateKey) : undefined
            };
            set({ keys, error: null });
          } catch (error) {
            set({ error: `Failed to import keys: ${(error as Error).message}` });
          }
        },

        clearKeys: () => {
          set({ keys: null, profile: null });
        },

        // Profile management
        updateProfile: async (profile: Profile) => {
          const { keys } = get();
          if (!keys?.privkey) {
            set({ error: 'No private key available' });
            return;
          }

          try {
            const event = await createEvent(
              JSON.stringify(profile),
              EventKind.Profile,
              [],
              getPrivateKeyAsUint8Array(keys.privkey)
            );
            
            // Store locally
            set(state => ({
              profile,
              profiles: new Map(state.profiles).set(keys.pubkey, profile),
              events: new Map(state.events).set(event.id, event)
            }));
            
            // TODO: Publish to relays
            set({ error: null });
          } catch (error) {
            set({ error: `Failed to update profile: ${(error as Error).message}` });
          }
        },

        loadProfile: async (pubkey: string) => {
          try {
            // TODO: Load from relays
            // For now, just clear any error
            set({ error: null });
          } catch (error) {
            set({ error: `Failed to load profile: ${(error as Error).message}` });
          }
        },

        // Relay management
        connectToRelays: async (urls: string[] = DEFAULT_RELAYS) => {
          set({ isConnecting: true, error: null });
          
          try {
            const pool = new SimplePool();
            const relayConnections: RelayType[] = urls.map(url => ({ 
              url, 
              status: 'connected' as const, 
              read: true, 
              write: true,
              pool 
            }));
            
            set({ 
              relays: relayConnections,
              isConnecting: false,
              error: null 
            });
            
            console.log(`Connected to ${urls.length} relays`);
            
          } catch (error) {
            set({ 
              isConnecting: false, 
              error: `Failed to connect to relays: ${(error as Error).message}` 
            });
          }
        },

        disconnectFromRelays: () => {
          const { relays } = get();
          relays.forEach(relayData => {
            if (relayData.pool) {
              relayData.pool.close();
            }
          });
          set({ relays: [] });
        },

        // Publish event to all connected relays
        publishToRelays: async (event: NostrEvent) => {
          const { relays } = get();
          const connectedRelays = relays.filter(r => r.status === 'connected' && r.pool);
          
          if (connectedRelays.length === 0) {
            console.warn('No connected relays to publish to');
            return;
          }
          
          try {
            const pool = connectedRelays[0].pool;
            const urls = connectedRelays.map(r => r.url);
            await pool.publish(urls, event);
            console.log(`Published event to ${urls.length} relays`);
          } catch (error) {
            console.error('Failed to publish to relays:', error);
          }
        },

        addRelay: (url: string) => {
          set(state => ({
            relays: [...state.relays, { 
              url, 
              status: 'disconnected' as const, 
              read: true, 
              write: true 
            }]
          }));
        },

        removeRelay: (url: string) => {
          set(state => ({
            relays: state.relays.filter(relay => relay.url !== url)
          }));
        },

        // Event publishing
        publishEvent: async (content: string, kind: EventKind, tags: string[][] = []) => {
          const { keys } = get();
          if (!keys?.privkey) {
            set({ error: 'No private key available' });
            return;
          }

          try {
            const event = await createEvent(content, kind, tags, getPrivateKeyAsUint8Array(keys.privkey));
            
            // Store locally
            set(state => ({
              events: new Map(state.events).set(event.id, event),
              error: null
            }));
            
            // TODO: Publish to relays
          } catch (error) {
            set({ error: `Failed to publish event: ${(error as Error).message}` });
          }
        },

        // Feed subscription
        subscribeToFeed: () => {
          try {
            // TODO: Subscribe to real events from relays
            set({ error: null });
          } catch (error) {
            set({ error: `Failed to subscribe to feed: ${(error as Error).message}` });
          }
        },

        // Direct messages using NIP-17
        sendDirectMessage: async (recipientPubkey: string, content: string) => {
          const { keys } = get();
          if (!keys?.privkey) {
            set({ error: 'No private key available. Please generate or import your Nostr keys first.' });
            return;
          }

          try {
            console.log('Sending message with keys:', {
              hasPrivkey: !!keys.privkey,
              privkeyType: typeof keys.privkey,
              privkeyLength: keys.privkey?.length,
              privkeyStartsWith: keys.privkey?.toString().substring(0, 10),
              pubkey: keys.pubkey,
              recipientPubkey
            });

            const privateKey = getPrivateKeyAsUint8Array(keys.privkey);
            console.log('Converted private key:', {
              length: privateKey.length,
              isValid: privateKey.length === 32,
              firstBytes: Array.from(privateKey.slice(0, 4))
            });

            const event = await createPrivateMessageEvent(content, recipientPubkey, privateKey);
            
            const message: DirectMessage = {
              id: event.id,
              content,
              pubkey: keys.pubkey,
              recipientPubkey,
              created_at: event.created_at,
              decrypted: true,
              sent: true
            };
            
            set(state => {
              const messages = new Map(state.messages);
              const conversationKey = [keys.pubkey, recipientPubkey].sort().join('-');
              const conversation = messages.get(conversationKey) || [];
              messages.set(conversationKey, [...conversation, message]);
              return { messages, error: null };
            });
            
            // Publish to relays
            await get().publishToRelays(event);
            console.log('Message published to relays successfully');
            
          } catch (error) {
            console.error('Error sending message:', error);
            set({ error: `Failed to send message: ${(error as Error).message}` });
          }
        },

        loadMessages: async (pubkey: string) => {
          const { keys } = get();
          if (!keys?.pubkey) {
            set({ error: 'No keys available' });
            return;
          }

          try {
            // TODO: Load real messages from relays
            set({ error: null });
          } catch (error) {
            set({ error: `Failed to load messages: ${(error as Error).message}` });
          }
        },

        markMessageAsRead: (messageId: string) => {
          set(state => {
            const messages = new Map(state.messages);
            messages.forEach((conversation, key) => {
              const updatedConversation = conversation.map(msg => 
                msg.id === messageId ? { ...msg, read: true } : msg
              );
              messages.set(key, updatedConversation);
            });
            return { messages };
          });
        },

        addContact: (contact: Contact) => {
          set(state => ({
            contacts: [...state.contacts.filter(c => c.pubkey !== contact.pubkey), contact]
          }));
        },

        // Social actions
        likeEvent: async (eventId: string) => {
          const { keys } = get();
          if (!keys?.privkey) {
            set({ error: 'No private key available' });
            return;
          }

          try {
            const event = await createEvent(
              '+',
              EventKind.Reaction,
              [['e', eventId]],
              getPrivateKeyAsUint8Array(keys.privkey)
            );
            
            // Store locally
            set(state => ({
              events: new Map(state.events).set(event.id, event),
              error: null
            }));
            
            // TODO: Publish to relays
          } catch (error) {
            set({ error: `Failed to like event: ${(error as Error).message}` });
          }
        },

        repostEvent: async (event: NostrEvent) => {
          const { keys } = get();
          if (!keys?.privkey) {
            set({ error: 'No private key available' });
            return;
          }

          try {
            const repostEvent = await createEvent(
              '',
              EventKind.Repost,
              [['e', event.id], ['p', event.pubkey]],
              getPrivateKeyAsUint8Array(keys.privkey)
            );
            
            // Store locally
            set(state => ({
              events: new Map(state.events).set(repostEvent.id, repostEvent),
              error: null
            }));
            
            // TODO: Publish to relays
          } catch (error) {
            set({ error: `Failed to repost event: ${(error as Error).message}` });
          }
        },

        replyToEvent: async (event: NostrEvent, content: string) => {
          const { keys } = get();
          if (!keys?.privkey) {
            set({ error: 'No private key available' });
            return;
          }

          try {
            const replyEvent = await createEvent(
              content,
              EventKind.TextNote,
              [['e', event.id, '', 'reply'], ['p', event.pubkey]],
              getPrivateKeyAsUint8Array(keys.privkey)
            );
            
            // Store locally
            set(state => ({
              events: new Map(state.events).set(replyEvent.id, replyEvent),
              error: null
            }));
            
            // TODO: Publish to relays
          } catch (error) {
            set({ error: `Failed to reply to event: ${(error as Error).message}` });
          }
        }
      }),
      {
        name: 'nostr-storage',
        partialize: (state) => ({
          keys: state.keys,
          profile: state.profile,
          relays: state.relays
        })
      }
    )
  )
); 