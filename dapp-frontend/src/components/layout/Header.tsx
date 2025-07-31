import React from "react";
import { useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletConnection, WalletInfo, NetworkIndicator } from "@/components/wallet/WalletConnection";
import { SidebarToggle } from "./Sidebar";
import { ROUTES } from "@/lib/constants";
import { 
  Bell, 
  Moon, 
  Sun, 
  Search,
  ChevronDown,
  LogOut
} from "lucide-react";

interface HeaderProps {
  onSidebarToggle: () => void;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  className?: string;
}

export function Header({ 
  onSidebarToggle, 
  onThemeToggle, 
  isDarkMode = false,
  className 
}: HeaderProps) {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const disconnect = useDisconnect();
  const navigate = useNavigate();

  const handleDisconnect = async () => {
    try {
      if (wallet) {
        disconnect.disconnect(wallet);
      }
      // Navigate back to landing page after disconnect
      navigate(ROUTES.HOME);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };
  
  return (
    <header className={cn(
      "flex items-center justify-between px-4 py-3 bg-background border-b border-border",
      className
    )}>
      {/* Left side */}
      <div className="flex items-center gap-4">
        <SidebarToggle onClick={onSidebarToggle} />
        
        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 min-w-[200px]">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm flex-1"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
          >
            3
          </Badge>
        </Button>

        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onThemeToggle}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* Wallet Connection */}
        {account ? (
          <div className="flex items-center gap-3">
            <NetworkIndicator />
            <WalletInfo 
              address={account.address as `0x${string}`}
              // These would come from hooks/context in a real app
              balance="1.234"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        ) : (
          <WalletConnection 
            showBuyCrypto={true}
            onConnect={() => {
              console.log("Connected");
            }}
          />
        )}
      </div>
    </header>
  );
}

/**
 * Breadcrumb component for navigation context
 */
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm text-muted-foreground", className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
          )}
          {item.href ? (
            <a 
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="font-medium text-foreground">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/**
 * Page header with title and actions
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  children, 
  breadcrumbs,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
      
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}