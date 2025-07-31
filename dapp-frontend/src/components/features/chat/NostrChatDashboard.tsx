import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/Header";
import { useNostrStore } from "@/lib/nostr/store";
import { EventKind } from "@/lib/nostr/types";
import { truncateKey } from "@/lib/nostr/utils";
import { NostrFeed } from "./NostrFeed";
import { NostrMessages } from "./NostrMessages";
import { NostrKeyManager } from "./NostrKeyManager";
import { NostrRelayManager } from "./NostrRelayManager";
import { 
  MessageSquare, 
  Rss,
  Key,
  Settings,
  Globe,
  User,
  Shield,
  AlertCircle
} from "lucide-react";

export function NostrChatDashboard() {
  const [activeTab, setActiveTab] = useState("feed");
  const { 
    keys, 
    profile,
    relays,
    isConnecting,
    error,
    connectToRelays,
    subscribeToFeed,
    loadProfile
  } = useNostrStore();

  // Connect to relays on mount
  useEffect(() => {
    if (!relays.some(r => r.status === 'connected')) {
      connectToRelays();
    }
  }, []);

  // Subscribe to feed when connected
  useEffect(() => {
    if (relays.some(r => r.status === 'connected')) {
      // Subscribe to global feed
      subscribeToFeed([
        { kinds: [EventKind.TextNote], limit: 50 },
        { kinds: [EventKind.Metadata], limit: 100 }
      ]);

      // Load own profile if keys exist
      if (keys?.pubkey) {
        loadProfile(keys.pubkey);
      }
    }
  }, [relays, keys, subscribeToFeed, loadProfile]);

  // Show key setup if no keys
  if (!keys) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Nostr Client"
          description="Connect to the decentralized social network"
          breadcrumbs={[
            { label: "App", href: "/app" },
            { label: "Chat & Social" }
          ]}
        />
        
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Welcome to Nostr</CardTitle>
            <p className="text-muted-foreground mt-2">
              Get started by creating or importing your keys
            </p>
          </CardHeader>
          <CardContent>
            <NostrKeyManager />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Nostr Client"
        description="Decentralized social network and messaging"
        breadcrumbs={[
          { label: "App", href: "/app" },
          { label: "Chat & Social" }
        ]}
      >
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm">
            <div className={`w-2 h-2 rounded-full ${
              relays.some(r => r.status === 'connected') 
                ? 'bg-green-500' 
                : isConnecting 
                  ? 'bg-yellow-500 animate-pulse' 
                  : 'bg-red-500'
            }`} />
            <span className="text-muted-foreground">
              {relays.filter(r => r.status === 'connected').length}/{relays.length} relays
            </span>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => setActiveTab("settings")}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* User Info Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={profile?.picture} />
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">
                  {profile?.display_name || profile?.name || "Anonymous"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {truncateKey(keys.npub)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Keys loaded</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feed" className="flex items-center gap-2">
            <Rss className="w-4 h-4" />
            <span className="hidden sm:inline">Feed</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="relays" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Relays</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          <NostrFeed />
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <NostrMessages />
        </TabsContent>

        <TabsContent value="relays" className="space-y-4">
          <NostrRelayManager />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <NostrProfileSettings />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Key Management</CardTitle>
              </CardHeader>
              <CardContent>
                <NostrKeyManager showCurrent />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Profile Settings Component
function NostrProfileSettings() {
  const { profile, updateProfile } = useNostrStore();
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    display_name: profile?.display_name || "",
    about: profile?.about || "",
    picture: profile?.picture || "",
    website: profile?.website || "",
    nip05: profile?.nip05 || "",
    lud16: profile?.lud16 || ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await updateProfile(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Username</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="satoshi"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Display Name</label>
          <Input
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="Satoshi Nakamoto"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">About</label>
        <Input
          value={formData.about}
          onChange={(e) => setFormData({ ...formData, about: e.target.value })}
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Avatar URL</label>
        <Input
          value={formData.picture}
          onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
          placeholder="https://example.com/avatar.jpg"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Website</label>
        <Input
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          placeholder="https://example.com"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">NIP-05 Identifier</label>
        <Input
          value={formData.nip05}
          onChange={(e) => setFormData({ ...formData, nip05: e.target.value })}
          placeholder="name@domain.com"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Lightning Address</label>
        <Input
          value={formData.lud16}
          onChange={(e) => setFormData({ ...formData, lud16: e.target.value })}
          placeholder="name@getalby.com"
        />
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Update Profile"}
      </Button>
    </form>
  );
}