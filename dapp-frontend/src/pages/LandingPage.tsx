import React from "react";
import { useNavigate } from "react-router-dom";
import { useActiveAccount } from "thirdweb/react";
import { WalletConnection } from "@/components/wallet/WalletConnection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants";
import { 
  Building2, 
  Users, 
  MessageSquare, 
  Briefcase,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Star,
  Check
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Equity Tokenization",
    description: "Transform traditional equity into digital tokens with smart contracts and transparent ownership tracking.",
  },
  {
    icon: Users,
    title: "Social Profiles",
    description: "Connect with professionals, build your reputation, and showcase your achievements in the Web3 ecosystem.",
  },
  {
    icon: MessageSquare,
    title: "Chat & Social",
    description: "Communicate directly with investors, entrepreneurs, and freelancers in a secure, decentralized environment.",
  },
  {
    icon: Briefcase,
    title: "Freelance Marketplace",
    description: "Find and offer Web3 services with crypto payments and reputation-based matching.",
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Secure & Transparent",
    description: "Built on blockchain technology for maximum security and transparency",
  },
  {
    icon: Zap,
    title: "Fast Transactions",
    description: "Lightning-fast transactions with low fees on Base network",
  },
  {
    icon: Globe,
    title: "Global Access",
    description: "Access from anywhere in the world with just a Web3 wallet",
  },
];

const stats = [
  { label: "Total Value Locked", value: "$2.5M+", icon: TrendingUp },
  { label: "Active Users", value: "1,200+", icon: Users },
  { label: "Projects Funded", value: "45+", icon: Building2 },
  { label: "Jobs Completed", value: "320+", icon: Briefcase },
];

export function LandingPage() {
  const navigate = useNavigate();
  const account = useActiveAccount();

  // Redirect to app if already connected
  React.useEffect(() => {
    if (account) {
      navigate(ROUTES.APP);
    }
  }, [account, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">ZawyaX</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors">
              Benefits
            </a>
            <a href="#stats" className="text-muted-foreground hover:text-foreground transition-colors">
              Stats
            </a>
          </nav>

          <WalletConnection 
onConnect={() => navigate(ROUTES.APP)}
            showBuyCrypto={true}
            showNetworkSwitcher={true}
          />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center space-y-8">
          <Badge variant="secondary" className="px-4 py-2">
            🚀 Now live on Etherlink Network
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold max-w-4xl mx-auto leading-tight">
            The Future of{" "}
            <span className="gradient-text">Equity Tokenization</span>{" "}
            is Here
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your equity into digital tokens, connect with investors, 
            collaborate with professionals, and access global opportunities in the Web3 economy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <WalletConnection 
  onConnect={() => navigate(ROUTES.APP)}
              showBuyCrypto={true}
              showNetworkSwitcher={true}
              className="scale-110"
            />
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              Learn More <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Audited Smart Contracts</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>4.8/5 User Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>SOC 2 Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center space-y-2">
                  <Icon className="w-8 h-8 mx-auto text-primary" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything You Need for Web3 Equity
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need to tokenize, 
              trade, and manage digital equity in the decentralized economy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Why Choose ZawyaX?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for the future of finance with cutting-edge technology and user-first design.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of users who are already tokenizing equity and building the future of finance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <WalletConnection 
  onConnect={() => navigate(ROUTES.APP)}
              showBuyCrypto={true}
              showNetworkSwitcher={true}
              className="scale-110"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              <span className="font-bold gradient-text">ZawyaX</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="/docs" className="hover:text-foreground transition-colors">
                Docs
              </a>
              <a href="/support" className="hover:text-foreground transition-colors">
                Support
              </a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2024 ZawyaX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
