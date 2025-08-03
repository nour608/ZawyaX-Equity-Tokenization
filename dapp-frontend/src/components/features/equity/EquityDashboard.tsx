import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EquityTokenCard, EquityTokenRow } from "./EquityTokenCard";
import { PageHeader } from "@/components/layout/Header";
import { formatTokenAmount, truncateAddress } from "@/lib/utils";
import { EquityToken } from "@/lib/types";
import { useEquityFactory } from "@/hooks/useContract";
import { 
  Search, 
  Filter, 
  Grid,
  List,
  Plus,
  TrendingUp,
  Building2,
  Wallet,
  PieChart,
  TrendingDown, 
  DollarSign,
  Users,
  Activity,
  AlertCircle
} from "lucide-react";

type ViewMode = 'grid' | 'list';

export function EquityDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Get real data from hooks
  const { allTokens, isLoading, error: contractError } = useEquityFactory();
  
  // Filter tokens based on search
  const filteredTokens = allTokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         token.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleTrade = (tokenId: string, action: 'buy' | 'sell') => {
    console.log(`${action} token:`, tokenId);
    // Implementation would open trade modal
  };

  const handleViewDetails = (tokenId: string) => {
    console.log("View details for token:", tokenId);
    // Implementation would navigate to token details page
  };

  return (
    <div className="space-y-6">
      {/* Contract Configuration Warning */}
      {contractError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Contract Not Configured</AlertTitle>
          <AlertDescription>
            Smart contracts are not configured. Token data will be displayed
            from mock data.
            {contractError}
          </AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <PageHeader
        title="Equity Tokenization"
        description="Manage your tokenized equity investments"
        breadcrumbs={[
          { label: "App", href: "/app" },
          { label: "Equity Tokenization" },
        ]}
      >
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tokenize Project
        </Button>
      </PageHeader>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Portfolio Value
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTokenAmount(BigInt(0))} ETH
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTokens.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for trading
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Holdings</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Token types owned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+12.5%</div>
            <p className="text-xs text-muted-foreground">30-day performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Filter by:</span>
            {["all", "owned", "trending", "new"].map((filter) => (
              <Badge
                key={filter}
                variant={selectedFilter === filter ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </Badge>
            ))}
          </div>

          {/* Token List */}
          {filteredTokens.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tokens found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "Create your first equity token to get started"}
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tokenize Project
              </Button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredTokens.map((token) =>
                viewMode === "grid" ? (
                  <EquityTokenCard
                    key={token.id}
                    token={token}
                    onTrade={handleTrade}
                    onViewDetails={handleViewDetails}
                  />
                ) : (
                  <EquityTokenRow
                    key={token.id}
                    token={token}
                    onTrade={handleTrade}
                    onViewDetails={handleViewDetails}
                  />
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}