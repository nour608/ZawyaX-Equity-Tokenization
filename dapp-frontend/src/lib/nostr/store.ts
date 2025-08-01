import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  nip19,
  SimplePool,
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  nip04,
  verifyEvent,
  Filter as NostrFilter,
} from "nostr-tools";
import {
  NostrEvent,
  Profile,
  Contact,
  DirectMessage,
  Relay as RelayType,
  Filter,
  UserKeys,
  EventKind,
  UnsignedEvent,
} from "./types";

// Default relays - use reliable ones
const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
  "wss://nostr-pub.wellorder.net",
];

// Helper function to convert Uint8Array to hex string for storage
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

// Helper function to convert hex string back to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  if (!hex || typeof hex !== "string") {
    throw new Error("Invalid hex string provided");
  }

  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;

  if (cleanHex.length % 2 !== 0) {
    throw new Error(
      `Invalid hex string length: ${cleanHex.length}. Must be even.`
    );
  }

  if (cleanHex.length !== 64) {
    throw new Error(
      `Invalid private key length: ${cleanHex.length}. Must be 64 characters (32 bytes).`
    );
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
    throw new Error("No private key available");
  }

  if (privkey instanceof Uint8Array) {
    return privkey;
  }

  if (typeof privkey === "string") {
    if (privkey.startsWith("nsec")) {
      const decoded = nip19.decode(privkey);
      if (decoded.type === "nsec") {
        return decoded.data;
      }
    }
    return hexToUint8Array(privkey);
  }

  if (typeof privkey === "object" && privkey !== null) {
    if (Array.isArray(privkey)) {
      return new Uint8Array(privkey);
    }
    if (privkey.data && Array.isArray(privkey.data)) {
      return new Uint8Array(privkey.data);
    }
  }

  throw new Error("Invalid private key format");
}

// Generate new key pair
function generateKeyPair() {
  const privateKey = generateSecretKey();
  const publicKey = getPublicKey(privateKey);

  return {
    privateKey,
    publicKey,
    npub: nip19.npubEncode(publicKey),
    nsec: nip19.nsecEncode(privateKey),
  };
}

// Import keys from various formats
function importKeys(input: string) {
  let privateKey: Uint8Array | undefined;
  let publicKey: string;

  if (input.startsWith("nsec")) {
    const decoded = nip19.decode(input);
    if (decoded.type !== "nsec") {
      throw new Error("Invalid nsec format");
    }
    privateKey = decoded.data;
    publicKey = getPublicKey(privateKey);
  } else if (input.startsWith("npub")) {
    const decoded = nip19.decode(input);
    if (decoded.type !== "npub") {
      throw new Error("Invalid npub format");
    }
    publicKey = decoded.data;
  } else if (input.length === 64) {
    // Assume hex format
    privateKey = hexToUint8Array(input);
    publicKey = getPublicKey(privateKey);
  } else {
    throw new Error(
      "Unsupported key format. Please provide nsec, npub, or hex format."
    );
  }

  return {
    privateKey,
    publicKey,
    nsec: privateKey ? nip19.nsecEncode(privateKey) : undefined,
    npub: nip19.npubEncode(publicKey),
  };
}

// Create a proper Nostr event
async function createEvent(
  content: string,
  kind: number,
  tags: string[][] = [],
  privateKey: Uint8Array
): Promise<NostrEvent> {
  const publicKey = getPublicKey(privateKey);

  const event: UnsignedEvent = {
    kind,
    content,
    tags,
    created_at: Math.floor(Date.now() / 1000),
    pubkey: publicKey,
  };

  return finalizeEvent(event, privateKey);
}

// Create private message event (simplified NIP-04)
async function createPrivateMessageEvent(
  content: string,
  recipientPubkey: string,
  privateKey: Uint8Array
): Promise<NostrEvent> {
  try {
    // Convert recipient pubkey to hex format if it's in npub format
    let recipientHexPubkey: string;
    
    if (recipientPubkey.startsWith('npub')) {
      const decoded = nip19.decode(recipientPubkey);
      if (decoded.type !== 'npub') {
        throw new Error('Invalid npub format');
      }
      recipientHexPubkey = decoded.data;
    } else if (recipientPubkey.length === 64) {
      // Already in hex format
      recipientHexPubkey = recipientPubkey;
    } else {
      throw new Error('Invalid public key format. Please provide npub or hex format.');
    }
    
    console.log('Encrypting message for recipient:', {
      original: recipientPubkey,
      hex: recipientHexPubkey,
      contentLength: content.length
    });
    
    const encryptedContent = await nip04.encrypt(
      privateKey,
      recipientHexPubkey,
      content
    );
    
    return await createEvent(
      encryptedContent,
      EventKind.EncryptedDM,
      [["p", recipientHexPubkey]],
      privateKey
    );
  } catch (error) {
    console.error("Error creating private message:", error);
    throw new Error(
      `Failed to create private message: ${(error as Error).message}`
    );
  }
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
  pool: SimplePool | null;
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
  publishEvent: (
    content: string,
    kind: EventKind,
    tags?: string[][]
  ) => Promise<void>;
  subscribeToFeed: (filters: Filter[]) => void;

          // Message actions
        sendDirectMessage: (
          recipientPubkey: string,
          content: string
        ) => Promise<void>;
        loadMessages: (pubkey: string) => Promise<void>;
        subscribeToMessages: () => void;
        processIncomingMessage: (event: NostrEvent) => Promise<void>;
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
        pool: null,
        relays: DEFAULT_RELAYS.map((url) => ({
          url,
          status: "disconnected",
          read: true,
          write: true,
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
              privkey: uint8ArrayToHex(keyPair.privateKey), // Store as hex for persistence
            };
            set({ keys, error: null });
          } catch (error) {
            set({
              error: `Failed to generate keys: ${(error as Error).message}`,
            });
          }
        },

        importUserKeys: (input: string) => {
          try {
            const keyPair = importKeys(input);
            const keys: UserKeys = {
              npub: keyPair.npub,
              nsec: keyPair.nsec || "",
              pubkey: keyPair.publicKey,
              privkey: keyPair.privateKey
                ? uint8ArrayToHex(keyPair.privateKey)
                : undefined,
            };
            set({ keys, error: null });
          } catch (error) {
            set({
              error: `Failed to import keys: ${(error as Error).message}`,
            });
          }
        },

        clearKeys: () => {
          const { pool, relays } = get();
          if (pool) {
            const relayUrls = relays.map(r => r.url);
            pool.close(relayUrls);
          }
          set({ keys: null, profile: null, pool: null });
        },

        // Profile management
        updateProfile: async (profile: Profile) => {
          const { keys, pool } = get();
          if (!keys?.privkey) {
            set({ error: "No private key available" });
            return;
          }

          try {
            const privateKey = getPrivateKeyAsUint8Array(keys.privkey);
            const event = await createEvent(
              JSON.stringify(profile),
              EventKind.Profile,
              [],
              privateKey
            );

            // Store locally
            set((state) => ({
              profile,
              profiles: new Map(state.profiles).set(keys.pubkey, profile),
              events: new Map(state.events).set(event.id, event),
            }));

            // Publish to relays if connected
            if (pool) {
              await get().publishToRelays(event);
            }

            set({ error: null });
          } catch (error) {
            set({
              error: `Failed to update profile: ${(error as Error).message}`,
            });
          }
        },

        loadProfile: async (pubkey: string) => {
          const { pool, relays } = get();
          if (!pool) {
            set({ error: "Not connected to relays" });
            return;
          }

          try {
                         const filter: NostrFilter = {
               kinds: [EventKind.Profile],
               authors: [pubkey],
               limit: 1,
             };

            const connectedRelays = relays
              .filter((r) => r.status === "connected")
              .map((r) => r.url);
            if (connectedRelays.length === 0) {
              set({ error: "No connected relays" });
              return;
            }

            const events = await pool.querySync(connectedRelays, filter);

            if (events.length > 0) {
              try {
                const profileData = JSON.parse(events[0].content) as Profile;
                set((state) => ({
                  profiles: new Map(state.profiles).set(pubkey, profileData),
                }));
              } catch (parseError) {
                console.error("Failed to parse profile data:", parseError);
              }
            }

            set({ error: null });
          } catch (error) {
            set({
              error: `Failed to load profile: ${(error as Error).message}`,
            });
          }
        },

        // Relay management
        connectToRelays: async (urls: string[] = DEFAULT_RELAYS) => {
          set({ isConnecting: true, error: null });

          try {
            // Close existing pool if any
            const { pool: existingPool, relays: existingRelays } = get();
            if (existingPool) {
              const relayUrls = existingRelays.map(r => r.url);
              existingPool.close(relayUrls);
            }

            const pool = new SimplePool();

            const relayConnections: RelayType[] = urls.map((url) => ({
              url,
              status: "connected" as const,
              read: true,
              write: true,
            }));

            set({
              pool,
              relays: relayConnections,
              isConnecting: false,
              error: null,
            });

            console.log(`Connected to ${urls.length} relays`);
          } catch (error) {
            set({
              isConnecting: false,
              error: `Failed to connect to relays: ${(error as Error).message}`,
            });
          }
        },

        disconnectFromRelays: () => {
          const { pool, relays } = get();
          if (pool) {
            const relayUrls = relays.map(r => r.url);
            pool.close(relayUrls);
          }
          set({
            pool: null,
            relays: DEFAULT_RELAYS.map((url) => ({
              url,
              status: "disconnected",
              read: true,
              write: true,
            })),
          });
        },

        // Publish event to all connected relays
        publishToRelays: async (event: NostrEvent) => {
          const { pool, relays } = get();

          if (!pool) {
            throw new Error("Not connected to relays");
          }

          const connectedRelays = relays.filter(
            (r) => r.status === "connected"
          );

          if (connectedRelays.length === 0) {
            throw new Error("No connected relays to publish to");
          }

          try {
            const urls = connectedRelays.map((r) => r.url);
            await pool.publish(urls, event);
            console.log(`Published event to ${urls.length} relays`);
          } catch (error) {
            console.error("Failed to publish to relays:", error);
            throw error;
          }
        },

        addRelay: (url: string) => {
          set((state) => ({
            relays: [
              ...state.relays,
              {
                url,
                status: "disconnected" as const,
                read: true,
                write: true,
              },
            ],
          }));
        },

        removeRelay: (url: string) => {
          set((state) => ({
            relays: state.relays.filter((relay) => relay.url !== url),
          }));
        },

        // Event publishing
        publishEvent: async (
          content: string,
          kind: EventKind,
          tags: string[][] = []
        ) => {
          const { keys } = get();
          if (!keys?.privkey) {
            set({ error: "No private key available" });
            return;
          }

          try {
            const privateKey = getPrivateKeyAsUint8Array(keys.privkey);
            const event = await createEvent(content, kind, tags, privateKey);

            // Store locally
            set((state) => ({
              events: new Map(state.events).set(event.id, event),
              error: null,
            }));

            // Publish to relays
            await get().publishToRelays(event);
          } catch (error) {
            set({
              error: `Failed to publish event: ${(error as Error).message}`,
            });
          }
        },

        // Feed subscription with performance optimizations
        subscribeToFeed: (filters: NostrFilter[]) => {
          const { pool, relays } = get();

          if (!pool) {
            set({ error: "Not connected to relays" });
            return;
          }

          try {
            const connectedRelays = relays
              .filter((r) => r.status === "connected")
              .map((r) => r.url);

            if (connectedRelays.length === 0) {
              set({ error: "No connected relays for subscription" });
              return;
            }

            // Close existing feed subscription
            const existingSub = get().subscriptions.get("feed");
            if (existingSub) {
              existingSub.close();
            }

            // Add rate limiting and debouncing for event processing
            let eventQueue: NostrEvent[] = [];
            let processingTimeout: NodeJS.Timeout | null = null;

            const processEventQueue = () => {
              if (eventQueue.length === 0) return;

              set((state) => {
                const newEvents = new Map(state.events);
                let addedCount = 0;
                
                // Process events in batches to avoid overwhelming the UI
                eventQueue.slice(0, 50).forEach((event) => {
                  if (!newEvents.has(event.id)) {
                    newEvents.set(event.id, event);
                    addedCount++;
                  }
                });

                // Keep only the latest 1000 events to prevent memory issues
                if (newEvents.size > 1000) {
                  const sortedEvents = Array.from(newEvents.entries())
                    .sort(([, a], [, b]) => b.created_at - a.created_at)
                    .slice(0, 1000);
                  newEvents.clear();
                  sortedEvents.forEach(([id, event]) => newEvents.set(id, event));
                }

                return { events: newEvents };
              });

              eventQueue = [];
              processingTimeout = null;
            };

            const sub = pool.subscribeMany(connectedRelays, filters, {
              onevent(event) {
                // Verify event signature
                if (!verifyEvent(event)) {
                  console.warn("Invalid event signature:", event);
                  return;
                }

                // Add to processing queue
                eventQueue.push(event);

                // Debounce processing to avoid excessive re-renders
                if (processingTimeout) {
                  clearTimeout(processingTimeout);
                }
                processingTimeout = setTimeout(processEventQueue, 100);
              },
              oneose() {
                console.log("End of stored events");
                // Process any remaining events
                if (eventQueue.length > 0) {
                  processEventQueue();
                }
              },
              onclose() {
                console.log("Subscription closed");
                if (processingTimeout) {
                  clearTimeout(processingTimeout);
                }
              },
            });

            set((state) => ({
              subscriptions: new Map(state.subscriptions).set("feed", sub),
              error: null,
            }));
          } catch (error) {
            set({
              error: `Failed to subscribe to feed: ${(error as Error).message}`,
            });
          }
        },

        // Direct messages using NIP-04
        sendDirectMessage: async (recipientPubkey: string, content: string) => {
          const { keys } = get();
          if (!keys?.privkey) {
            set({
              error:
                "No private key available. Please generate or import your Nostr keys first.",
            });
            return;
          }

          if (!recipientPubkey || !content.trim()) {
            set({
              error: "Recipient public key and message content are required.",
            });
            return;
          }

          console.log('Sending message:', {
            recipientPubkey,
            contentLength: content.length,
            hasPrivkey: !!keys.privkey
          });

          try {
            const privateKey = getPrivateKeyAsUint8Array(keys.privkey);
            const event = await createPrivateMessageEvent(
              content,
              recipientPubkey,
              privateKey
            );

            const message: DirectMessage = {
              id: event.id,
              content,
              pubkey: keys.pubkey,
              recipientPubkey,
              created_at: event.created_at,
              decrypted: true,
              sent: true,
            };

            set((state) => {
              const messages = new Map(state.messages);
              const conversationKey = [keys.pubkey, recipientPubkey]
                .sort()
                .join("-");
              const conversation = messages.get(conversationKey) || [];
              messages.set(conversationKey, [...conversation, message]);
              return { messages, error: null };
            });

            // Publish to relays
            await get().publishToRelays(event);
            console.log("Message published to relays successfully");
          } catch (error) {
            console.error("Error sending message:", error);
            set({
              error: `Failed to send message: ${(error as Error).message}`,
            });
          }
        },

        loadMessages: async (_pubkey: string) => {
          const { keys, pool, relays } = get();
          if (!keys?.pubkey || !pool) {
            set({ error: "No keys or pool available" });
            return;
          }

          try {
            // Load messages where current user is recipient
            const recipientFilter: NostrFilter = {
              kinds: [EventKind.EncryptedDM],
              "#p": [keys.pubkey],
              limit: 100,
            };

            // Load messages where current user is sender
            const senderFilter: NostrFilter = {
              kinds: [EventKind.EncryptedDM],
              authors: [keys.pubkey],
              limit: 100,
            };

            const connectedRelays = relays
              .filter((r) => r.status === "connected")
              .map((r) => r.url);
            if (connectedRelays.length === 0) {
              set({ error: "No connected relays" });
              return;
            }

            const recipientEvents = await pool.querySync(connectedRelays, recipientFilter);
            const senderEvents = await pool.querySync(connectedRelays, senderFilter);
            const events = [...recipientEvents, ...senderEvents];

            if (!keys.privkey) {
              set({ error: "No private key for decryption" });
              return;
            }

            const privateKey = getPrivateKeyAsUint8Array(keys.privkey);

            for (const event of events) {
              try {
                const isOwnMessage = event.pubkey === keys.pubkey;
                let decryptedContent: string;
                let message: DirectMessage;

                if (isOwnMessage) {
                  // This is a message we sent - find the recipient from tags
                  const recipientTag = event.tags.find(tag => tag[0] === 'p');
                  if (!recipientTag) continue;
                  
                  const recipientPubkey = recipientTag[1];
                  decryptedContent = await nip04.decrypt(
                    privateKey,
                    recipientPubkey,
                    event.content
                  );

                  message = {
                    id: event.id,
                    content: decryptedContent,
                    pubkey: keys.pubkey,
                    recipientPubkey: recipientPubkey,
                    created_at: event.created_at,
                    decrypted: true,
                    sent: true,
                  };
                } else {
                  // This is a message we received
                  decryptedContent = await nip04.decrypt(
                    privateKey,
                    event.pubkey,
                    event.content
                  );

                  message = {
                    id: event.id,
                    content: decryptedContent,
                    pubkey: event.pubkey,
                    recipientPubkey: keys.pubkey,
                    created_at: event.created_at,
                    decrypted: true,
                    sent: false,
                  };
                }

                set((state) => {
                  const messages = new Map(state.messages);
                  const conversationKey = [keys.pubkey, message.recipientPubkey === keys.pubkey ? message.pubkey : message.recipientPubkey]
                    .sort()
                    .join("-");
                  const conversation = messages.get(conversationKey) || [];
                  // Avoid duplicates
                  if (!conversation.find((m) => m.id === message.id)) {
                    messages.set(
                      conversationKey,
                      [...conversation, message].sort(
                        (a, b) => a.created_at - b.created_at
                      )
                    );
                  }
                  return { messages };
                });
              } catch (decryptError) {
                console.warn("Failed to decrypt message:", decryptError);
              }
            }

            set({ error: null });
          } catch (error) {
            set({
              error: `Failed to load messages: ${(error as Error).message}`,
            });
          }
        },

        subscribeToMessages: () => {
          const { keys, pool, relays } = get();
          if (!keys?.pubkey || !pool) {
            set({ error: "No keys or pool available" });
            return;
          }

          try {
            const connectedRelays = relays
              .filter((r) => r.status === "connected")
              .map((r) => r.url);

            if (connectedRelays.length === 0) {
              set({ error: "No connected relays for subscription" });
              return;
            }

            // Subscribe to messages where we are recipient
            const recipientFilter: NostrFilter = {
              kinds: [EventKind.EncryptedDM],
              "#p": [keys.pubkey],
            };

            const sub = pool.subscribeMany(connectedRelays, [recipientFilter], {
              onevent(event) {
                // Verify event signature
                if (!verifyEvent(event)) {
                  console.warn("Invalid message event signature:", event);
                  return;
                }

                // Process the message
                get().processIncomingMessage(event);
              },
              oneose() {
                console.log("End of stored messages");
              },
              onclose() {
                console.log("Message subscription closed");
              },
            });

            set((state) => ({
              subscriptions: new Map(state.subscriptions).set("messages", sub),
              error: null,
            }));
          } catch (error) {
            set({
              error: `Failed to subscribe to messages: ${(error as Error).message}`,
            });
          }
        },

        processIncomingMessage: async (event: NostrEvent) => {
          const { keys } = get();
          if (!keys?.privkey) return;

          try {
            const privateKey = getPrivateKeyAsUint8Array(keys.privkey);
            const decryptedContent = await nip04.decrypt(
              privateKey,
              event.pubkey,
              event.content
            );

            const message: DirectMessage = {
              id: event.id,
              content: decryptedContent,
              pubkey: event.pubkey,
              recipientPubkey: keys.pubkey,
              created_at: event.created_at,
              decrypted: true,
              sent: false,
            };

            set((state) => {
              const messages = new Map(state.messages);
              const conversationKey = [keys.pubkey, event.pubkey]
                .sort()
                .join("-");
              const conversation = messages.get(conversationKey) || [];
              
              // Avoid duplicates
              if (!conversation.find((m) => m.id === message.id)) {
                messages.set(
                  conversationKey,
                  [...conversation, message].sort(
                    (a, b) => a.created_at - b.created_at
                  )
                );
              }
              return { messages };
            });

            console.log("New message received:", message);
          } catch (error) {
            console.warn("Failed to process incoming message:", error);
          }
        },

        markMessageAsRead: (messageId: string) => {
          set((state) => {
            const messages = new Map(state.messages);
            messages.forEach((conversation, key) => {
              const updatedConversation = conversation.map((msg) =>
                msg.id === messageId ? { ...msg, read: true } : msg
              );
              messages.set(key, updatedConversation);
            });
            return { messages };
          });
        },

        addContact: (contact: Contact) => {
          set((state) => ({
            contacts: [
              ...state.contacts.filter((c) => c.pubkey !== contact.pubkey),
              contact,
            ],
          }));
        },

        // Social actions
        likeEvent: async (eventId: string) => {
          const { keys } = get();
          if (!keys?.privkey) {
            set({ error: "No private key available" });
            return;
          }

          try {
            const privateKey = getPrivateKeyAsUint8Array(keys.privkey);
            const event = await createEvent(
              "+",
              EventKind.Reaction,
              [["e", eventId]],
              privateKey
            );

            // Store locally
            set((state) => ({
              events: new Map(state.events).set(event.id, event),
              error: null,
            }));

            // Publish to relays
            await get().publishToRelays(event);
          } catch (error) {
            set({ error: `Failed to like event: ${(error as Error).message}` });
          }
        },

        repostEvent: async (event: NostrEvent) => {
          const { keys } = get();
          if (!keys?.privkey) {
            set({ error: "No private key available" });
            return;
          }

          try {
            const privateKey = getPrivateKeyAsUint8Array(keys.privkey);
            const repostEvent = await createEvent(
              "",
              EventKind.Repost,
              [
                ["e", event.id],
                ["p", event.pubkey],
              ],
              privateKey
            );

            // Store locally
            set((state) => ({
              events: new Map(state.events).set(repostEvent.id, repostEvent),
              error: null,
            }));

            // Publish to relays
            await get().publishToRelays(repostEvent);
          } catch (error) {
            set({
              error: `Failed to repost event: ${(error as Error).message}`,
            });
          }
        },

        replyToEvent: async (event: NostrEvent, content: string) => {
          const { keys } = get();
          if (!keys?.privkey) {
            set({ error: "No private key available" });
            return;
          }

          try {
            const privateKey = getPrivateKeyAsUint8Array(keys.privkey);
            const replyEvent = await createEvent(
              content,
              EventKind.TextNote,
              [
                ["e", event.id, "", "reply"],
                ["p", event.pubkey],
              ],
              privateKey
            );

            // Store locally
            set((state) => ({
              events: new Map(state.events).set(replyEvent.id, replyEvent),
              error: null,
            }));

            // Publish to relays
            await get().publishToRelays(replyEvent);
          } catch (error) {
            set({
              error: `Failed to reply to event: ${(error as Error).message}`,
            });
          }
        },
      }),
      {
        name: "nostr-storage",
        partialize: (state) => ({
          keys: state.keys,
          profile: state.profile,
          relays: state.relays.map((r) => ({
            ...r,
            status: "disconnected" as const,
          })),
          contacts: state.contacts,
          messages: state.messages,
          events: state.events,
          profiles: state.profiles,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Convert plain objects back to Maps
            if (state.messages && !(state.messages instanceof Map)) {
              state.messages = new Map(Object.entries(state.messages));
            }
            if (state.events && !(state.events instanceof Map)) {
              state.events = new Map(Object.entries(state.events));
            }
            if (state.profiles && !(state.profiles instanceof Map)) {
              state.profiles = new Map(Object.entries(state.profiles));
            }
          }
        },
      }
    )
  )
);
