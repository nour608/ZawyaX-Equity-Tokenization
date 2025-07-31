import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useNostrStore } from "@/lib/nostr/store";
import { DEFAULT_RELAYS } from "@/lib/nostr/utils";
import { 
  Globe, 
  Plus, 
  Trash2, 
  RefreshCw,
  Zap,
  AlertCircle,
  Check,
  X,
  Loader2
} from "lucide-react";

export function NostrRelayManager() {
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  const { 
    relays, 
    isConnecting,
    connectToRelays,
    disconnectFromRelays,
    addRelay,
    removeRelay
  } = useNostrStore();

  const handleAddRelay = async () => {
    if (!newRelayUrl.trim()) return;
    
    // Validate URL
    if (!newRelayUrl.startsWith('wss://') && !newRelayUrl.startsWith('ws://')) {
      return;
    }
    
    setIsAdding(true);
    addRelay(newRelayUrl);
    await connectToRelays([...relays.map(r => r.url), newRelayUrl]);
    setNewRelayUrl("");
    setIsAdding(false);
  };

  const handleRemoveRelay = (url: string) => {
    removeRelay(url);
  };

  const handleToggleRelay = async (url: string, currentStatus: string) => {
    if (currentStatus === 'connected') {
      // For now, we'll just mark it as disconnected
      // In a real app, you'd disconnect from this specific relay
    } else {
      await connectToRelays([url]);
    }
  };

  const handleReconnectAll = async () => {
    await disconnectFromRelays();
    await connectToRelays();
  };

  const handleResetToDefaults = () => {
    // Clear current relays and add defaults
    relays.forEach(relay => removeRelay(relay.url));
    DEFAULT_RELAYS.forEach(url => addRelay(url));
  };

  const connectedCount = relays.filter(r => r.status === 'connected').length;
  const totalCount = relays.length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold">{connectedCount}/{totalCount}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Relays</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-medium">
                  {isConnecting ? 'Connecting...' : connectedCount > 0 ? 'Online' : 'Offline'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReconnectAll}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Relay */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Relay</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="wss://relay.example.com"
              value={newRelayUrl}
              onChange={(e) => setNewRelayUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRelay()}
            />
            <Button 
              onClick={handleAddRelay}
              disabled={!newRelayUrl.trim() || isAdding}
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Relay List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Active Relays</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefaults}
            >
              Reset to Defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {relays.map((relay) => (
              <div
                key={relay.url}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    relay.status === 'connected' 
                      ? 'bg-green-500' 
                      : relay.status === 'connecting' 
                        ? 'bg-yellow-500 animate-pulse' 
                        : relay.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                  }`} />
                  
                  <div>
                    <p className="font-medium text-sm">{relay.url}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {relay.status}
                      </Badge>
                      {relay.status === 'error' && (
                        <span className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Connection failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <label className="flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Read
                      <Switch
                        checked={relay.read}
                        className="ml-1"
                        disabled
                      />
                    </label>
                    <label className="flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Write
                      <Switch
                        checked={relay.write}
                        className="ml-1"
                        disabled
                      />
                    </label>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRelay(relay.url)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Relays */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommended Relays</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DEFAULT_RELAYS.filter(url => !relays.find(r => r.url === url)).map((url) => (
              <div
                key={url}
                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg"
              >
                <span className="text-sm">{url}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    addRelay(url);
                    connectToRelays([url]);
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}