import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNostrStore } from "@/lib/nostr/store";
import { Contact, DirectMessage } from "@/lib/nostr/types";
import { formatTimestamp, truncateKey, formatPublicKey } from "@/lib/nostr/utils";
// import { nip19 } from "nostr-tools";
import { 
  Send, 
  Search,
  Plus,
  Lock,
  Check,
  CheckCheck,
  AlertCircle,
  User,
  MessageSquare
} from "lucide-react";

export function NostrMessages() {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newContactInput, setNewContactInput] = useState("");
  const [showNewContact, setShowNewContact] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    keys,
    messages,
    contacts,
    profiles,
    relays,
    isConnecting,
    error,
    sendDirectMessage,
    loadMessages,
    loadProfile,
    connectToRelays,
    addContact,
    subscribeToMessages
  } = useNostrStore();

  // Connect to relays and subscribe to messages when component mounts
  useEffect(() => {
    if (keys && relays.length === 0) {
      console.log('Connecting to relays...');
      connectToRelays();
    }
  }, [keys, relays.length, connectToRelays]);

  // Subscribe to messages when relays are connected
  useEffect(() => {
    if (keys && relays.some(r => r.status === 'connected')) {
      console.log('Subscribing to messages...');
      subscribeToMessages();
    }
  }, [keys, relays, subscribeToMessages]);

  // Get unique contacts from messages
  const messageContacts = messages && typeof messages.entries === 'function' 
    ? Array.from(messages.entries()).map(([key, msgs]) => {
        const [pubkey1, pubkey2] = key.split('-');
        const otherPubkey = pubkey1 === keys?.pubkey ? pubkey2 : pubkey1;
        const lastMessage = msgs[msgs.length - 1];
        
        return {
          pubkey: otherPubkey,
          lastMessage,
          unreadCount: msgs.filter(m => m.pubkey !== keys?.pubkey && !m.read).length
        } as Contact;
      })
    : [];

  // Combine with stored contacts
  const allContacts = [...messageContacts, ...contacts.filter(c => 
    !messageContacts.find(mc => mc.pubkey === c.pubkey)
  )];

  // Filter contacts
  const filteredContacts = allContacts.filter(contact => {
    const profile = profiles && typeof profiles.get === 'function' ? profiles.get(contact.pubkey) : undefined;
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.pubkey.toLowerCase().includes(searchLower) ||
      profile?.name?.toLowerCase().includes(searchLower) ||
      profile?.display_name?.toLowerCase().includes(searchLower)
    );
  });

  // Get current conversation
  const currentMessages = selectedContact && keys && messages && typeof messages.get === 'function'
    ? messages.get([keys.pubkey, selectedContact].sort().join('-')) || []
    : [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // Load messages for selected contact
  useEffect(() => {
    if (selectedContact && keys) {
      loadMessages(selectedContact);
      loadProfile(selectedContact);
    }
  }, [selectedContact, keys]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedContact) return;
    
    await sendDirectMessage(selectedContact, messageInput);
    setMessageInput("");
  };

  const handleAddContact = () => {
    try {
      let pubkey = newContactInput.trim();
      
      if (!pubkey) return;
      
      // Add to contacts list
      const newContact: Contact = {
        pubkey,
        profile: { name: `User ${pubkey.slice(0, 8)}` },
        unreadCount: 0
      };
      
      addContact(newContact);
      setSelectedContact(pubkey);
      setNewContactInput("");
      setShowNewContact(false);
      loadProfile(pubkey);
      
      console.log('Added contact:', newContact);
    } catch (error) {
      console.error('Invalid pubkey:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full">
      {/* Contacts Sidebar */}
      <div className="w-64 border-r border-border flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </CardTitle>
          
          {/* Relay Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${
              isConnecting ? 'bg-yellow-500' : 
              relays.some(r => r.status === 'connected') ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {isConnecting ? 'Connecting to relays...' : 
             relays.some(r => r.status === 'connected') ? 
             `${relays.filter(r => r.status === 'connected').length} relay(s) connected` : 
             'No relays connected'}
          </div>
          
          {/* Manual Connect Button */}
          {!isConnecting && relays.length === 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => connectToRelays()}
              className="mt-2"
            >
              Connect to Relays
            </Button>
          )}
          
          {error && (
            <div className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardHeader>

        <ScrollArea className="flex-1">
          <CardContent className="p-0">
            {/* New Contact Input */}
            {showNewContact && (
              <div className="p-4 border-b">
                <div className="space-y-2">
                  <Input
                    placeholder="Enter npub or hex pubkey..."
                    value={newContactInput}
                    onChange={(e) => setNewContactInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddContact()}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddContact} disabled={!newContactInput.trim()}>
                      Add Contact
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowNewContact(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const profile = profiles && typeof profiles.get === 'function' ? profiles.get(contact.pubkey) : undefined;
                  const isSelected = selectedContact === contact.pubkey;
                  
                  return (
                    <div
                      key={contact.pubkey}
                      onClick={() => setSelectedContact(contact.pubkey)}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                        isSelected ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={profile?.picture} />
                          <AvatarFallback>
                            {profile?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                        {(contact.unreadCount || 0) > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                          >
                            {contact.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">
                            {profile?.display_name || profile?.name || formatPublicKey(contact.pubkey)}
                          </p>
                          {contact.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(contact.lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        {contact.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.lastMessage.decrypted 
                              ? contact.lastMessage.content 
                              : <span className="italic">Encrypted message</span>
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={profiles && typeof profiles.get === 'function' ? profiles.get(selectedContact)?.picture : undefined} />
                    <AvatarFallback>
                      {profiles && typeof profiles.get === 'function' ? profiles.get(selectedContact)?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {profiles && typeof profiles.get === 'function' ? 
                        profiles.get(selectedContact)?.display_name || 
                        profiles.get(selectedContact)?.name || 
                        formatPublicKey(selectedContact) : 
                        formatPublicKey(selectedContact)
                      }
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      <span>End-to-end encrypted</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {currentMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lock className="w-8 h-8 mx-auto mb-2" />
                    <p>Send your first encrypted message</p>
                  </div>
                ) : (
                  currentMessages.map((message) => {
                    const isOwnMessage = message.pubkey === keys?.pubkey;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`p-3 rounded-lg ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {message.decrypted ? (
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            ) : (
                              <div className="flex items-center gap-2 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span className="italic">Unable to decrypt</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 px-1">
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(message.created_at)}
                            </p>
                            {isOwnMessage && (
                              <span className="text-xs text-muted-foreground">
                                {message.delivered ? (
                                  message.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                                ) : null}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type an encrypted message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No Contact Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a contact to start messaging
                </p>
              </div>
              <Button onClick={() => setShowNewContact(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}