import React from "react";
import { ConnectButton, useNetworkSwitcherModal, useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { client, supportedChains, networkSections } from "@/lib/thirdweb";
import { Button } from "@/components/ui/button";
import { Network, Wallet, User, LogOut } from "lucide-react";

interface WalletConnectionProps {
  onConnect?: () => void;
  showBuyCrypto?: boolean;
  showNetworkSwitcher?: boolean;
  className?: string;
}

/**
 * Wallet connection component using thirdweb ConnectButton
 * Provides wallet connection with network selection support
 */
export function WalletConnection({ 
  onConnect, 
  showBuyCrypto = false,
  showNetworkSwitcher = true,
  className = ""
}: WalletConnectionProps) {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const networkSwitcher = useNetworkSwitcherModal();
  const disconnect = useDisconnect();

  const handleNetworkSwitch = () => {
    networkSwitcher.open({
      client,
      theme: 'light',
      sections: networkSections,
    });
  };

  const handleDisconnect = () => {
    if (wallet) {
      disconnect.disconnect(wallet);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <ConnectButton
        client={client}
        chains={supportedChains}
        onConnect={(wallet) => {
          console.log("Wallet connected:", wallet.getAccount()?.address);
          console.log("Connected to network:", wallet.getChain()?.name);
          onConnect?.();
        }}
        connectModal={{
          size: "wide",
          title: "Connect to ZawyaX",
          showThirdwebBranding: false,
          welcomeScreen: {
            title: "Welcome to ZawyaX",
            subtitle: "Connect your wallet and choose your preferred network",
          },
        }}
        connectButton={{
          label: "Connect Wallet",
        }}
        detailsModal={{}}
      />
      
      {/* Network Indicator & Switcher - shows when wallet is connected */}
      {account && wallet && showNetworkSwitcher && (
        <>
          <NetworkIndicator />
          <Button
            variant="outline"
            size="sm"
            onClick={handleNetworkSwitch}
            className="flex items-center gap-2 hover:bg-primary/10"
          >
            <Network className="w-4 h-4" />
            <span className="hidden sm:inline">Switch Network</span>
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * Network indicator component - shows current network
 */
export function NetworkIndicator() {
  const wallet = useActiveWallet();
  const chain = wallet?.getChain();

  if (!chain) return null;

  // Get network icon based on chain
  const getNetworkIcon = (chainName: string) => {
    const name = chainName.toLowerCase();
    if (name.includes('ethereum')) return '🔵';
    if (name.includes('base')) return '🔷';
    if (name.includes('polygon')) return '🟣';
    if (name.includes('optimism')) return '🔴';
    if (name.includes('arbitrum')) return '🔵';
    if (name.includes('avalanche')) return '🔴';
    if (name.includes('bsc')) return '🟡';
    if (name.includes('etherlink')) return '🟢';
    return '🌐';
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-xs">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span className="font-medium">{getNetworkIcon(chain.name || '')} {chain.name}</span>
    </div>
  );
}

/**
 * Simple wallet status indicator
 */
export function WalletStatus() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Wallet className="w-4 h-4" />
      <span>Connect wallet to continue</span>
    </div>
  );
}

/**
 * Compact wallet info display
 */
interface WalletInfoProps {
  address: `0x${string}`;
  ensName?: string;
  avatar?: string;
  balance?: string;
}

export function WalletInfo({ address, ensName, avatar, balance }: WalletInfoProps) {
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
        {avatar ? (
          <img src={avatar} alt="Avatar" className="w-full h-full rounded-full" />
        ) : (
          <User className="w-4 h-4 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {ensName || truncatedAddress}
        </p>
        {balance && (
          <p className="text-xs text-muted-foreground">
            {balance} ETH
          </p>
        )}
      </div>
    </div>
  );
}