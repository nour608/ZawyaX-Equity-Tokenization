import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatTokenAmount, truncateAddress } from "@/lib/utils";
import { EquityToken } from "@/lib/types";
import { 
  Building2, 
  TrendingUp, 
  ExternalLink,
  Plus,
  Minus
} from "lucide-react";

interface EquityTokenCardProps {
  token: EquityToken;
  onTrade?: (tokenId: string, action: 'buy' | 'sell') => void;
  onViewDetails?: (tokenId: string) => void;
  className?: string;
}

export function EquityTokenCard({ 
  token, 
  onTrade, 
  onViewDetails,
  className = "" 
}: EquityTokenCardProps) {
  const formattedSupply = formatTokenAmount(token.totalSupply);
  const formattedBalance = formatTokenAmount(token.userBalance);
  const formattedPrice = formatTokenAmount(token.price);
  const ownershipPercentage = Number(token.userBalance * BigInt(100) / token.totalSupply);

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={token.logo} alt={token.name} />
              <AvatarFallback>
                <Building2 className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{token.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {token.symbol} • {truncateAddress(token.address)}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewDetails?.(token.id)}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {token.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="font-semibold">{formattedPrice} ETH</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Supply</p>
            <p className="font-semibold">{formattedSupply}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Your Ownership</p>
            <p className="font-semibold">{ownershipPercentage.toFixed(2)}%</p>
          </div>
        </div>

        {/* User Balance */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Your Balance</span>
            <div className="text-right">
              <p className="font-medium">{formattedBalance} {token.symbol}</p>
              <p className="text-xs text-muted-foreground">
                ≈ {formatTokenAmount(token.userBalance * token.price / BigInt(10)**BigInt(18))} ETH
              </p>
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-500">+12.5% (24h)</span>
          <Badge variant="success" className="ml-auto">
            Active
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => onTrade?.(token.id, 'buy')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Buy
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onTrade?.(token.id, 'sell')}
            disabled={token.userBalance === BigInt(0)}
          >
            <Minus className="w-4 h-4 mr-1" />
            Sell
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for lists
 */
interface EquityTokenRowProps {
  token: EquityToken;
  onTrade?: (tokenId: string, action: 'buy' | 'sell') => void;
  onViewDetails?: (tokenId: string) => void;
}

export function EquityTokenRow({ token, onTrade, onViewDetails }: EquityTokenRowProps) {
  const formattedBalance = formatTokenAmount(token.userBalance);
  const formattedPrice = formatTokenAmount(token.price);

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar>
        <AvatarImage src={token.logo} alt={token.name} />
        <AvatarFallback>
          <Building2 className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{token.name}</h3>
          <Badge variant="outline" className="text-xs">
            {token.symbol}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {token.description}
        </p>
      </div>

      <div className="text-right">
        <p className="font-medium">{formattedPrice} ETH</p>
        <p className="text-sm text-muted-foreground">
          {formattedBalance} owned
        </p>
      </div>

      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={() => onViewDetails?.(token.id)}>
          View
        </Button>
        <Button size="sm" onClick={() => onTrade?.(token.id, 'buy')}>
          Trade
        </Button>
      </div>
    </div>
  );
}