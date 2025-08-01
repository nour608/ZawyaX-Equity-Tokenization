import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useActiveAccount } from "thirdweb/react";
import { WalletConnection } from "@/components/wallet/WalletConnection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { Wallet, Shield, ArrowRight } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * Protected route component that requires wallet connection
 */
export function ProtectedRoute({ 
  children, 
  redirectTo = ROUTES.HOME,
  requireAuth = true 
}: ProtectedRouteProps) {
  const account = useActiveAccount();
  const location = useLocation();

  // If authentication is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If wallet is not connected, show connection screen
  if (!account) {
    return <WalletConnectionScreen />;
  }

  // If wallet is connected, render protected content
  return <>{children}</>;
}

/**
 * Wallet connection screen for protected routes
 */
function WalletConnectionScreen() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Connect Your Wallet</CardTitle>
          <p className="text-muted-foreground text-sm">
            Connect your wallet to access the ZawyaX platform and start trading equity tokens
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span>Secure wallet connection</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span>Social login options available</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span>Access to all platform features</span>
            </div>
          </div>

          {/* Connection Component */}
          <div className="flex flex-col items-center gap-4">
            <WalletConnection 
              showBuyCrypto={true}
              onConnect={() => {
                console.log("User connected");
                // Navigation will happen automatically due to state change
              }}
              className="w-full justify-center"
            />
            
            <p className="text-xs text-muted-foreground text-center">
              By connecting, you agree to our{" "}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook to check if user is authenticated
 */
export function useAuth() {
  const account = useActiveAccount();
  
  return {
    isAuthenticated: !!account,
    address: account?.address as `0x${string}` | null,
    account,
  };
}

/**
 * Higher-order component for protecting components
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { redirectTo?: string; requireAuth?: boolean }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute 
        redirectTo={options?.redirectTo}
        requireAuth={options?.requireAuth}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}