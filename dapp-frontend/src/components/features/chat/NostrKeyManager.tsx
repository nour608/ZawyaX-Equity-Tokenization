import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNostrStore } from "@/lib/nostr/store";
import { truncateKey } from "@/lib/nostr/utils";
import { 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Check
} from "lucide-react";

interface NostrKeyManagerProps {
  showCurrent?: boolean;
}

export function NostrKeyManager({ showCurrent = false }: NostrKeyManagerProps) {
  const { keys, generateNewKeys, importUserKeys, clearKeys } = useNostrStore();
  const [importInput, setImportInput] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleImport = () => {
    try {
      setError("");
      importUserKeys(importInput);
      setImportInput("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExport = () => {
    if (!keys) return;
    
    const data = {
      npub: keys.npub,
      nsec: keys.nsec,
      created: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nostr-keys.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Show current keys if requested and keys exist
  if (showCurrent && keys) {
    return (
      <div className="space-y-4">
        {/* Security Warning */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your private key (nsec) gives full control of your account. Never share it with anyone or enter it on untrusted websites.
          </AlertDescription>
        </Alert>

        {/* Public Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Public Key (npub)
          </label>
          <div className="flex gap-2">
            <Input
              value={keys.npub}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(keys.npub, 'npub')}
            >
              {copied === 'npub' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Private Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Key className="w-4 h-4" />
            Private Key (nsec)
          </label>
          <div className="flex gap-2">
            <Input
              type={showPrivateKey ? "text" : "password"}
              value={keys.nsec || 'Not available'}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
            >
              {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            {keys.nsec && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(keys.nsec!, 'nsec')}
              >
                {copied === 'nsec' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Keys
          </Button>
          <Button variant="destructive" onClick={clearKeys}>
            Clear Keys
          </Button>
        </div>
      </div>
    );
  }

  // Show key generation/import if no keys
  return (
    <div className="space-y-6">
      {/* Generate New Keys */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Key className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-medium">Create New Identity</h3>
          <p className="text-sm text-muted-foreground">
            Generate a new key pair to start using Nostr
          </p>
        </div>
        
        <Button onClick={generateNewKeys} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Generate New Keys
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or
          </span>
        </div>
      </div>

      {/* Import Existing Keys */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6 text-secondary-foreground" />
          </div>
          <h3 className="font-medium">Import Existing Keys</h3>
          <p className="text-sm text-muted-foreground">
            Use your existing Nostr identity
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Input
            placeholder="Enter nsec or npub..."
            value={importInput}
            onChange={(e) => setImportInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleImport()}
          />
          <Button 
            onClick={handleImport} 
            disabled={!importInput.trim()}
            className="w-full"
          >
            Import Keys
          </Button>
        </div>
      </div>

      {/* Security Note */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Your keys are your identity on Nostr. Keep your private key (nsec) safe and never share it. 
          Consider using a browser extension like Alby or nos2x for better security.
        </AlertDescription>
      </Alert>
    </div>
  );
}