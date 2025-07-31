# ZawyaX DApp Frontend

A modern, decentralized equity tokenization platform with freelance marketplace and social features built with React, TypeScript, and Web3 technologies.

## Features

- **Equity Tokenization**: Create, trade, and manage equity tokens
- **Freelance Marketplace**: Post jobs, apply, and complete freelance work
- **Nostr Integration**: Decentralized social networking with real Nostr protocol
- **Web3 Wallet Integration**: Connect with various Web3 wallets
- **Modern UI**: Built with Tailwind CSS and Radix UI components

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: Zustand
- **Web3**: Thirdweb, Ethers.js
- **Nostr**: nostr-tools for decentralized social features
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Web3 wallet (MetaMask, etc.)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dapp-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Required environment variables:
```env
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
VITE_THIRDWEB_SECRET_KEY=your_thirdweb_secret_key
VITE_APP_URL=http://localhost:5173
VITE_CHAIN_ID=84532
VITE_FACTORY_CONTRACT=your_factory_contract_address
VITE_EQUITY_TOKEN_CONTRACT=your_equity_token_contract_address
VITE_USER_REGISTRY_CONTRACT=your_user_registry_contract_address
VITE_FREELANCE_CONTRACT=your_freelance_contract_address
VITE_CHAT_CONTRACT=your_chat_contract_address
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The app will be available at `http://localhost:5173`

## Nostr Integration

This application includes full Nostr protocol integration for decentralized social features:

### Features
- **Real Key Generation**: Generate and import Nostr keys (npub/nsec)
- **Event Publishing**: Create and publish text notes, reactions, and reposts
- **Direct Messaging**: Encrypted direct messages using NIP-04
- **Profile Management**: Update and load user profiles
- **Relay Connections**: Connect to multiple Nostr relays

### Usage
1. Generate or import your Nostr keys in the chat section
2. Connect to relays to start receiving events
3. Post messages, like, repost, and reply to events
4. Send encrypted direct messages to other users

### Technical Details
- Uses `nostr-tools` library for all Nostr operations
- Implements NIP-01 (basic protocol), NIP-04 (encrypted messages), and NIP-17 (private messages)
- Stores events locally and publishes to relays
- Supports multiple relay connections

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── layout/         # Layout components
│   └── features/       # Feature-specific components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   ├── nostr/          # Nostr protocol utilities
│   └── utils/          # General utilities
├── pages/              # Page components
└── types/              # TypeScript type definitions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.