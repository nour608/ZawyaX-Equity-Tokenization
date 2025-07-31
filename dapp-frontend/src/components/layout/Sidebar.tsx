import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  User, 
  MessageSquare, 
  Briefcase,
  Menu,
  X,
  Settings,
  Home
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  disabled?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: ROUTES.APP,
    icon: Home,
  },
  {
    id: "equity",
    label: "Equity Tokens",
    href: ROUTES.EQUITY,
    icon: Building2,
  },
  {
    id: "chat",
    label: "Chat & Social",
    href: ROUTES.CHAT,
    icon: MessageSquare,
    badge: 3, // Mock unread messages
  },
  {
    id: "freelance",
    label: "Freelance",
    href: ROUTES.FREELANCE,
    icon: Briefcase,
    badge: 2, // Mock new jobs
  },
  {
    id: "profile", 
    label: "Profile",
    href: ROUTES.PROFILE,
    icon: User,
  },
];

interface SidebarProps {
  className?: string;
  onNavigate?: (href: string) => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const handleNavigate = (href: string) => {
    onNavigate?.(href);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border-r border-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg gradient-text">ZawyaX</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          {isCollapsed ? (
            <Menu className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.id}
              to={item.href}
              onClick={() => handleNavigate(item.href)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                item.disabled && "opacity-50 cursor-not-allowed",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0")} />
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant={isActive ? "secondary" : "default"}
                      className="ml-auto text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4 space-y-2">
        <Link
          to="/app/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Link>
        

      </div>
    </div>
  );
}

/**
 * Mobile sidebar overlay
 */
interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (href: string) => void;
}

export function MobileSidebar({ isOpen, onClose, onNavigate }: MobileSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 z-50 md:hidden animate-slide-in">
        <Sidebar 
          onNavigate={(href) => {
            onNavigate?.(href);
            onClose();
          }}
        />
      </div>
    </>
  );
}

/**
 * Sidebar toggle button for mobile
 */
interface SidebarToggleProps {
  onClick: () => void;
  className?: string;
}

export function SidebarToggle({ onClick, className }: SidebarToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("md:hidden", className)}
    >
      <Menu className="w-5 h-5" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}