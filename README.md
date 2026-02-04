# Bondum Mobile

A DeFi/crypto rewards mobile app built with Expo, React Native, and Solana. Earn $BONDUM tokens and exclusive NFTs by scanning products and engaging with your favorite brands.

## Features

- **Dual Authentication**: Support for both Solana wallet (via Mobile Wallet Adapter) and Privy (email-based Web3 auth)
- **Token Rewards**: Earn and manage $BONDUM tokens
- **NFT Collection**: View and collect exclusive Bondum NFTs
- **QR Code Scanning**: Scan products to earn rewards
- **Token Swap**: Exchange $BONDUM for other tokens (USDC)
- **Reward Redemption**: Claim discounts, tokens, and NFTs

## Technologies

- [Expo](https://expo.dev) - React Native framework
- [Expo Router](https://docs.expo.dev/router/introduction/) - File-based navigation
- [Uniwind](https://uniwind.dev/) - Tailwind CSS for React Native
- [@solana/kit](https://github.com/solana-labs/solana-web3.js) - Solana blockchain interaction
- [@wallet-ui/react-native-kit](https://github.com/wallet-ui/wallet-ui) - Solana Mobile Wallet Adapter
- [@privy-io/expo](https://docs.privy.io/) - Web3 authentication
- [@tanstack/react-query](https://tanstack.com/query) - Data fetching and caching
- [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/) - QR code scanning
- [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) - Secure storage

## Project Structure

```
src/
├── app/                    # Expo Router routes
│   ├── _layout.tsx        # Root layout with providers
│   ├── (auth)/            # Authentication screens
│   │   ├── _layout.tsx
│   │   └── welcome.tsx    # Welcome/login screen
│   ├── (tabs)/            # Main app tabs
│   │   ├── _layout.tsx    # Tab bar configuration
│   │   ├── (home)/        # Home/Dashboard
│   │   ├── (trade)/       # Token swap
│   │   ├── (rewards)/     # Rewards list and details
│   │   └── (profile)/     # User profile
│   └── scan/              # QR code scanner
├── components/            # Reusable UI components
│   ├── ui/               # Base components (Button, Card, etc.)
│   └── layout/           # Layout components (Header, etc.)
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication state
├── hooks/                # Custom React hooks
├── services/             # Services and API clients
│   └── storage/          # Secure storage utilities
├── types/                # TypeScript types
├── constants/            # Design tokens and constants
│   ├── colors.ts
│   ├── spacing.ts
│   └── typography.ts
└── global.css            # Global Tailwind styles
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development) or Xcode (for iOS development)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Create a `.env` file with your Privy App ID:

```bash
EXPO_PUBLIC_PRIVY_APP_ID=your-privy-app-id
```

Get your Privy App ID from [https://dashboard.privy.io](https://dashboard.privy.io)

### Running the App

**Development with Expo Go:**

```bash
npm start
```

**Development build (required for camera, wallet adapter):**

```bash
# Android
npm run android

# iOS
npm run ios
```

### Build Commands

```bash
# Type check
npm run build

# Lint
npm run lint

# Format
npm run fmt
```

## Authentication

The app supports two authentication methods:

### 1. Solana Wallet

Connect using any Solana wallet that supports Mobile Wallet Adapter (Phantom, Solflare, etc.).

### 2. Privy Email

Email-based authentication with OTP verification. Creates an embedded Solana wallet automatically.

## Design System

The app uses a consistent design system with:

- **Primary Color**: Violet (#8B5CF6)
- **Secondary Color**: Red (#DC2626) for action cards
- **Background**: Light lavender (#F8F7FC)
- **Typography**: System fonts with bold headings
- **Spacing**: 4px grid system

## Development

### Adding New Screens

1. Create a new file in the appropriate `(group)` folder under `src/app/`
2. Export a default component
3. The route is automatically created based on the file path

### Adding New Components

1. Create component in `src/components/ui/` or `src/components/layout/`
2. Export from the appropriate `index.ts` file
3. Use Uniwind classes for styling

### State Management

- **Auth State**: Managed by `AuthContext` with persistence via SecureStore
- **Server State**: Use React Query for API data
- **Local State**: Use React's `useState` for component state

## License

Private - All rights reserved

## Links

- Website: [https://bondum.xyz](https://bondum.xyz)
- Documentation: Coming soon
