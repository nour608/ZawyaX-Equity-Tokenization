# ZawyaX Equity Tokenization - Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Environment Setup
```bash
# Clone and setup
git clone <repository>
cd ZawyaX-Equity-Tokenization

# Install dependencies
forge install

# Copy environment file
cp env.example .env
# Edit .env with your configuration
```

### 2. Required Environment Variables
```bash
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs for different networks
MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/your-api-key
SEPOLIA_RPC_URL=https://eth-sepolia.alchemyapi.io/v2/your-api-key

# API keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Pre-Deployment Testing
```bash
# Run all tests
forge test

# Check gas usage
forge test --gas-report

# Run coverage analysis
forge coverage
```

## 🔧 Deployment Steps

### Step 1: Mainnet Deployment
```bash
# Deploy to mainnet
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url mainnet \
    --broadcast \
    --verify \
    --slow

# Verify deployment success
cat deployment.env
```

### Step 2: Testnet Deployment (Sepolia)
```bash
# Deploy to Sepolia
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url sepolia \
    --broadcast \
    --verify

# Setup testnet with mock tokens
source deployment.env
forge script script/SetupTestnet.s.sol:SetupTestnetScript \
    --rpc-url sepolia \
    --broadcast
```

### Step 3: Post-Deployment Configuration
```bash
# Load environment
source deployment.env

# Verify contract functionality
cast call $FACTORY_ADDRESS "projectCount()" --rpc-url sepolia

# Add additional currencies if needed
cast send $CURRENCYMANAGER_ADDRESS \
    "addCurrency(address)" \
    0x... \
    --private-key $PRIVATE_KEY \
    --rpc-url sepolia
```

## 🔒 Security Considerations

### Critical Items to Address Before Mainnet:

1. **Multi-sig Wallet Setup**
   ```solidity
   // Replace single admin with multi-sig
   // Consider using Gnosis Safe or similar
   ```

2. **Time Locks for Critical Functions**
   ```solidity
   // Add time delays for:
   // - Platform fee changes
   // - Trading fee changes
   // - Admin role transfers
   ```

3. **Emergency Pause Mechanism**
   ```solidity
   // Implement circuit breakers for:
   // - Large fund withdrawals
   // - Suspicious trading activity
   // - Technical issues
   ```

4. **Compliance Integration**
   ```solidity
   // Integrate with:
   // - KYC/AML providers
   // - Sanctions screening
   // - Jurisdictional restrictions
   ```

## 📊 Monitoring & Maintenance

### 1. Key Metrics to Monitor
- Project creation rate
- Trading volume and fees
- Failed transactions
- Gas usage patterns
- Token holder distribution

### 2. Regular Maintenance Tasks
- Monitor for smart contract upgrades in dependencies
- Review and update fee structures
- Audit new currency additions
- Backup critical data and configurations

### 3. Emergency Procedures
- Factory pause procedure
- Project-specific pause procedure
- Fee withdrawal in emergency
- Communication channels for users

## 🌐 Network-Specific Configurations

### Ethereum Mainnet
- **Gas Optimization**: Critical due to high fees
- **Stablecoins**: USDC, USDT, DAI
- **Verification**: Etherscan required

### Polygon
- **Lower Fees**: Enable smaller trades
- **Stablecoins**: USDC.e, USDT
- **Bridge Considerations**: For cross-chain assets

### Arbitrum
- **Layer 2 Benefits**: Faster, cheaper transactions
- **Stablecoins**: USDC, USDT
- **Sequencer Risk**: Monitor uptime

## 🔍 Post-Deployment Verification

### 1. Functional Tests
```bash
# Test project creation
cast send $FACTORY_ADDRESS \
    "createProject(bytes32,uint256,uint256,address,string,string)" \
    0x... 1000000 100000 $USDC_ADDRESS "Test Project" "TEST"

# Test share purchase
cast send $FACTORY_ADDRESS \
    "buyShares(uint256,uint256)" \
    1 1000

# Test secondary market
cast send $FACTORY_ADDRESS \
    "enableSecondaryMarket(uint256)" \
    1
```

### 2. Security Verification
```bash
# Check admin roles
cast call $FACTORY_ADDRESS "hasRole(bytes32,address)" \
    0x... $ADMIN_ADDRESS

# Verify fee settings
cast call $FACTORY_ADDRESS "PLATFORM_FEE()"
cast call $FACTORY_ADDRESS "TRADING_FEE_RATE()"
```

## 🚨 Known Issues & Mitigations

### 1. Platform Fee Collection
- **Issue**: Platform fees collected but not automatically distributed
- **Mitigation**: Manual withdrawal by admins, consider automated distribution

### 2. Secondary Market Liquidity
- **Issue**: May have low initial liquidity
- **Mitigation**: Implement market maker incentives, bootstrap liquidity

### 3. Gas Price Volatility
- **Issue**: High gas costs during network congestion
- **Mitigation**: Consider Layer 2 deployment, batch operations

## 📝 Smart Contract Addresses

After deployment, update this section with actual addresses:

```
Network: [Chain Name]
Factory: 0x...
UserRegistry: 0x...
CurrencyManager: 0x...
Block Number: [Deployment Block]
Transaction Hash: 0x...
Deployer: 0x...
```

## 🔗 External Dependencies

- OpenZeppelin Contracts v5.x
- Foundry toolkit
- Network RPC providers (Alchemy/Infura)
- Block explorers for verification

## 📞 Support & Contacts

- **Technical Issues**: [Technical Team Contact]
- **Security Concerns**: [Security Team Contact]
- **Business Inquiries**: [Business Team Contact]

---

**⚠️ IMPORTANT**: This deployment guide assumes thorough testing and security audits have been completed. Never deploy to mainnet without proper audits and testing.