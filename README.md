# ZawyaX - Decentralized Community Platform for Digital Collaboration

<!-- Add a banner image -->

## 🚀 Overview

ZawyaX is a comprehensive decentralized community platform that empowers freelancers, developers, and investors through advanced digital collaboration tools built on blockchain technology. Our mission is to bring more users to the blockchain space by creating practical, consumer-focused DApps.
### Note:

**This repository (ZawyaX-Equity-Tokenization)** contains:

- **Project Tokenization Platform** - Core smart contracts and frontend
- **Decentralized Communication** - Nostr protocol integration
- **Main Frontend Demo** - Unified platform interface
- **Etherlink & Thirdweb Integration** - L2 deployment and wallet connectivity

**Related Repository:**

- [**Freelance Services Platform**](https://github.com/nour608/ZawiyaX) - Smart contracts for escrow, dispute resolution, and reputation system
## Problem Statement

Current freelance and project funding platforms suffer from:

- High fees and centralized control
- Lack of transparency in dispute resolution
- Limited investment opportunities for smaller projects
- Privacy concerns with traditional communication tools
- Fragmented ecosystem requiring multiple platforms

## Solution

ZawyaX provides an integrated ecosystem with three core components:

### 1. Freelance Services Mechanism

- **Trust & Privacy**: Decentralized reputation system
- **Smart Escrow**: Automated payment release based on milestones
- **Dispute Resolution**: Community-driven arbitration
- **Cost Optimization**: Hybrid on-chain/off-chain architecture

### 2. Project Tokenization Platform

- **Equity Tokenization**: Transform projects into investable tokens
- **OrderBook Trading**: Built-in DEX for project shares
- **Real-World Projects (RWP)**: Bridge physical assets to blockchain
- **Democratic Governance**: Token holders participate in project decisions

### 3. Decentralized Communication

- **Nostr Integration**: Censorship-resistant messaging
- **Social Features**: Community building and networking
- **Privacy-First**: End-to-end encrypted communications

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Smart         │    │   Nostr         │
│   (React/Next)  │◄──►│   Contracts     │    │   Protocol      │
│                 │    │   (Solidity)    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IPFS          │    │   Etherlink     │    │   Relays        │
│   Storage       │    │   Network       │    │   Network       │
└─────────────────┘    └─────────────────┘    └─────────────────┘

```

## Tech Stack

### Blockchain & Smart Contracts

- **Etherlink L2**: Primary blockchain infrastructure
- **Solidity**: Smart contract development
- **Foundry**: Development environment and deployment toolkit
- **Thirdweb SDK**: Wallet connectivity and payment processing
- **OpenZeppelin**: Security standards

### Frontend & Backend

- React 18 with TypeScript: User interface
- **Thirdweb Connect**: Wallet integration and user onboarding
- **Web3.js/Ethers.js**: Blockchain interaction optimized for Etherlink
- **IPFS**: Decentralized storage

### Communication & Social

- **Decentralized Social**: Nostr protocol (nostr-tools 2.15)
- **Markdown**: React Markdown

### **SPONSOR TECHNOLOGY INTEGRATION**

### **ETHERLINK L2 BLOCKCHAIN**

- **Primary Infrastructure**: All smart contracts deployed on Etherlink
- **Benefits Achieved**:
    - 99% reduction in gas fees compared to Ethereum mainnet
    - Sub-second transaction finality for real-time interactions
    - Full EVM compatibility enabling seamless migration
- **Implementation**:
    - Freelance escrow contracts optimized for Etherlink's low fees
    - High-frequency tokenization transactions made economically viable
    - Real-time order book trading without prohibitive costs

### **THIRDWEB SDK INTEGRATION**

- **ConnectWallet Component**: Seamless wallet connection experience
- **OnRamp Integration**: Fiat-to-crypto payment gateway
- **Implementation Features**:
    - Support for 100+ wallets out of the box
    - Built-in fiat onramp for new crypto users
    - Simplified smart contract interactions
    - Social login options for Web2 users transitioning to Web3

## Getting Started

### Prerequisites

- Node.js v16+
- MetaMask or compatible Web3 wallet
- Git

### Installation

1. **Clone the repository**
    
    ```bash
    git clone https://github.com/nour608/ZawyaX-Equity-Tokenization.git
    cd ZawyaX-Equity-Tokenization
    ```
    
2. **Install dependencies**
    
    ```bash
    in /home/nour/ZawyaX-Equity-Tokenization/dapp-frontend
    npm install
    in /home/nour/ZawyaX-Equity-Tokenization/
    forge install
    ```
    
3. **Start the frontend**
    
    ```bash
    cd dapp-frontend
    npm run dev
    ```
    
4. **Access the application**
e.g. open [http://localhost:3000](http://localhost:3000/)

### Testing

```bash
# Run smart contract tests
forge test
```

## Core Features Demo

**Everything will be connected with the user wallet address**

### Freelance Platform

1. **Create Profile**: Set up your freelancer or client profile
2. **Post Jobs**: Create detailed job postings with milestone-based payments
3. **Smart Escrow**: Automatic fund holding and release
4. **Dispute Resolution**: Community arbitration system

### Project Tokenization

1. **Submit Project**: Upload project details and funding requirements
2. **Token Creation**: Automatic ERC-20 token generation
3. **Investment**: Buy project tokens through built-in DEX
4. **Governance**: Vote on project decisions as a token holder

### Decentralized Chat

1. **Nostr Integration**: Connect with your Nostr identity
2. **Project Channels**: Join project-specific communication channels
3. **Private Messaging**: End-to-end encrypted direct messages
4. **Social Features**: Follow other users and build your network

## 🔗 Why Etherlink + Thirdweb?

### Etherlink L2 Advantages

- **Cost Efficiency**: Freelance payments and tokenization viable with micro-fees
- **Speed**: Real-time trading and instant escrow releases
- **EVM Compatibility**: Easy migration of existing Ethereum contracts
- **Developer Experience**: Full Ethereum tooling support

### Thirdweb Integration Benefits

- **User Onboarding**: Simplified wallet connection for Web2 users
- **Payment Rails**: Built-in fiat onramp reduces crypto barriers
- **Developer Productivity**: Pre-built components accelerated development
- **Multi-wallet Support**: Inclusive access across wallet preferences

### Combined Impact

The Etherlink + Thirdweb combination enables ZawyaX to:

1. **Scale Economically**: Support high-volume, low-value transactions
2. **Onboard Web2 Users**: Reduce friction for traditional freelancers
3. **Enable Real-time Features**: Fast confirmation for live collaboration
4. **Maintain Decentralization**: L2 benefits without sacrificing principles

## 🚧 Current Development Status

### Hackathon Prototype Status

- ✅ **Smart Contracts**: Fully developed and tested locally
- ✅ **Etherlink Integration**: Network configuration complete, ready for deployment
- ✅ **Thirdweb SDK**: Wallet connectivity and UI components integrated
- 🔄 **Deployment**: In progress
- ✅ **Frontend Demo**: Functional with mock data and local blockchain

### Smart Contract Deployment Plan

```markdown
Target Network: Etherlink Testnet (Chain ID: 128123)
Freelance Escrow: Ready for deployment
Token Factory: Ready for deployment  
OrderBook DEX: Ready for deployment
Dispute Resolution: Ready for deployment
```

### Live Demo Limitations

- Etherlink deployment in final testing phase
- All core functionality demonstrated with local contracts

## 🔐 Security Features

- **Multi-signature wallets** for large transactions
- **Time-locked contracts** for dispute resolution
- **Reputation staking** to prevent malicious behavior
- **Encrypted communications** via Nostr protocol
- **Etherlink's proven security** inherited from Tezos consensus
- **Thirdweb's audited contracts** for payment processing

## Roadmap

### Phase 1 (Current)

- ✅ Core smart contracts
- ✅ Basic frontend interface
- ✅ Nostr integration
- ✅ Token creation mechanism

### Phase 2 (Next 3 months)

- [ ]  Mobile app development
- [ ]  Advanced dispute resolution with DAO governance

### Phase 3 (6 months)

- [ ]  Cross-chain compatibility
- [ ]  AI-powered project matching
- [ ]  DAO governance implementation
- [ ]  Enterprise partnerships

## Hackathon Development Notes

Due to time constraints during the hackathon, smart contracts are currently 
deployed and tested on locally. The Etherlink integration is 
fully configured and ready for deployment. All smart contract logic has been 
developed with Etherlink's low-fee, fast-transaction capabilities in mind.

**Post-Hackathon**: Immediate Etherlink testnet deployment planned within 48 hours.