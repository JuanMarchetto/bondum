# Bondum Mobile

> [bondum.xyz](https://bondum.xyz) | Live on [Solana dApp Store](https://dappstore.app)

![Bondum - Simply scan your everyday products and get the rewards](banner.jpeg)

A mobile-first loyalty rewards platform on Solana. Scan products, earn **$BONDUM** tokens, build streaks for multiplied rewards, and redeem real products at partner brands -- all with on-chain verification and wallet signing.

**Already live** with [PaniCafe](https://panicafe.com.ar), serving **~8,000 real users** with on-chain reward transactions in production.

## How It Works

1. **Scan** a product QR code at a partner brand (e.g. PaniCafe)
2. **Earn** $BONDUM tokens with streak multipliers (up to 2x at 10+ day streaks)
3. **Hit milestones** -- 3-day, 7-day, 14-day, and 30-day streak bonuses
4. **Redeem** real products: free coffee, croissants, ice cream, and more
5. **Sign on-chain** -- 2-step redemption with user wallet signing for verified transactions
6. **Swap** tokens via Jupiter aggregator (BONDUM <-> USDC, SOL, PANICAFE)
7. **Send** tokens to any Solana wallet directly from the app

## Key Features

### On-Chain Reward System
- **2-step redemption with wallet signing** -- Server builds the transaction, user signs with their wallet (MWA or Privy), server submits to network. Every redemption has a verifiable Solscan signature.
- **Priority fees via Helius** -- Dynamic fee estimation with compute unit simulation and a 0.001 SOL cap, ensuring transactions land reliably during network congestion.
- **Send-and-confirm with retry** -- Production-grade transaction delivery that retries until block height expiry, ported from PaniCafe's battle-tested patterns.
- **Anti-replay QR validation** -- Nonce-based QR codes with expiry timestamps prevent double-claiming.

### Consumer Engagement Mechanics
- **Streak system with multipliers** -- Daily scans build streaks that multiply token earnings from 1.0x to 2.0x. Missing a day resets the streak.
- **Milestone bonuses** -- Automatic bonus tokens at streak milestones: +50 at 3 days, +200 at 7 days, +500 at 14 days, +2000 at 30 days.
- **Daily challenges** -- Rotating daily objectives that reward engagement (e.g. "Scan 2 QR codes today", "Check your rewards").
- **Smart recommendations** -- Context-aware insights on the home screen: suggests rewards based on balance, encourages streak maintenance, highlights limited-stock items.

### Solana Mobile Native
- **Seed Vault SDK** -- Automatic detection and integration on Solana Mobile Seeker devices for hardware-level key security.
- **Dual authentication** -- Solana Mobile Wallet Adapter (Phantom, Solflare, Seed Vault) or Privy email-based embedded wallets for Web2 onboarding.
- **Live on Solana dApp Store** -- Published and available for Seeker/Saga users.

### Real-World Integration
- **PaniCafe partnership** -- 16 real product rewards including Cafe, Medialuna, Croissant, Jugo Natural, Desayuno Tradicional, and Helado, ported from PaniCafe's production reward system.
- **Multi-brand architecture** -- Support for multiple brand mints (BONDUM, PANICAFE) with per-brand reward catalogs and token economies.
## Architecture

```
Mobile App (Expo / React Native)
  |
  |-- Auth -------> MWA / Seed Vault (native Solana wallet)
  |                 Privy (email -> embedded wallet)
  |
  |-- Scan -------> QR Parser (nonce + expiry validation)
  |                 POST /claim -> streak multiplier -> SPL transfer
  |                 Post-scan streak/milestone feedback
  |
  |-- Redeem -----> POST /redeem/request -> build tx (server)
  |                 User signs with wallet (MWA or Privy)
  |                 POST /redeem -> submit signed tx -> confirm on-chain
  |
  |-- Home -------> Streak progress bar + multiplier badge
  |                 AI recommendation card
  |                 Daily challenge card
  |
  |-- Balances ---> Helius RPC (getTokenAccountsByOwner)
  |                 Token Program + Token-2022 fallback
  |
  |-- NFTs -------> DAS API (getAssetsByOwner)
  |                 On-chain Metaplex metadata fallback
  |
  |-- Swaps ------> Jupiter Aggregator API (quote + swap)
  |
  |-- Transfers --> Raw SPL Token instructions (SystemProgram / ATA)

Reward Server (Node.js + Helius RPC)
  |
  |-- POST /claim ----------> Validate QR -> update streak -> apply multiplier
  |                           -> check milestones -> transfer tokens on-chain
  |
  |-- POST /redeem/request --> Build partially-signed tx for user signing
  |-- POST /redeem ----------> Accept signed tx -> send to network -> confirm
  |
  |-- GET /streak/:address --> Streak data + multiplier + next milestone
  |-- GET /daily-challenge --> Deterministic rotating challenge
  |-- POST /recommend -------> Context-aware reward recommendation
  |
  |-- Rate limiting ---------> 30 req/min per IP
  |-- Input validation ------> Base58 address format check
  |-- Priority fees ---------> Helius estimation + compute unit simulation
  |-- Retry logic -----------> Send-and-confirm until block height expiry
```

## Tech Stack

- [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/) -- React Native framework with file-based routing
- [Helius RPC](https://helius.dev) -- Priority fee estimation, DAS API, and reliable Solana connectivity
- [@solana/kit](https://github.com/solana-labs/solana-web3.js) -- Solana blockchain interaction
- [@wallet-ui/react-native-kit](https://github.com/nicholasgasior/wallet-ui) -- Solana Mobile Wallet Adapter with Seed Vault support
- [@privy-io/expo](https://docs.privy.io/) -- Web3 email authentication with embedded wallets
- [Jupiter Aggregator](https://dev.jup.ag/) -- Token swap quotes and transactions
- [DAS API](https://docs.helius.dev/solana-apis/digital-asset-standard-das-api) -- NFT metadata and images
- [@tanstack/react-query](https://tanstack.com/query) -- Data fetching, caching, and auto-refetch
- [Uniwind](https://uniwind.dev/) -- Tailwind CSS for React Native
- [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/) -- QR code scanning
- [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) -- Encrypted local persistence

## Project Structure

```
src/
|-- app/                    # Expo Router routes
|   |-- _layout.tsx        # Root layout with providers
|   |-- (auth)/            # Authentication screens
|   |-- (tabs)/            # Main app tabs
|   |   |-- (home)/        # Home dashboard + send + settings
|   |   |-- (trade)/       # Token swap (Jupiter)
|   |   |-- (rewards)/     # Rewards list and detail (2-step redeem)
|   |   |-- (assets)/      # Token balances + NFT gallery
|   |   |-- (profile)/     # User profile + wallet + referral
|   |-- scan/              # QR code scanner + streak feedback
|-- components/            # Reusable UI components
|   |-- ui/               # Base components (Button, Card, Avatar, etc.)
|   |-- TransactionConfirmation  # Tx result with Solscan link
|-- contexts/             # React contexts
|   |-- AuthContext.tsx   # Auth state (MWA + Privy + Seed Vault + Guest)
|-- hooks/                # Custom React hooks
|   |-- useBondumBalance  # $BONDUM token balance
|   |-- useTokenBalances  # SOL, USDC, PANICAFE balances
|   |-- useWalletNfts     # NFT collection via DAS API
|   |-- useStreak         # Server-synced streak with local fallback
|   |-- useSwapQuote      # Jupiter swap quotes with debounce
|   |-- useRewards        # Reward catalog from API
|   |-- useSeekerDevice   # Seeker / Seed Vault detection
|-- services/             # API clients and utilities
|   |-- solana.ts         # RPC calls, DAS, transfers, priority fees
|   |-- jupiter.ts        # Jupiter aggregator API
|   |-- rewardApi.ts      # Reward API client (claim, redeem, streak, AI)
|   |-- qrParser.ts       # QR code parser with nonce/expiry validation
|   |-- streakStorage.ts  # Local streak persistence (offline fallback)

server/                   # Reward distribution API
|-- index.ts              # HTTP server with all endpoints
|-- index.test.ts         # Unit tests (streak, multiplier, catalog)
|-- package.json          # Server dependencies
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android) or Xcode (for iOS)

### Installation

```bash
npm install
cd server && npm install && cd ..
```

### Environment Variables

```bash
cp .env.example .env
# Edit .env with your credentials:
#   EXPO_PUBLIC_SOLANA_RPC_URL - Helius RPC endpoint (recommended)
#   EXPO_PUBLIC_PRIVY_APP_ID   - Privy app ID for email auth
#   EXPO_PUBLIC_REWARD_API_URL - Reward server URL
```

### Running

```bash
# Start the reward server
cd server && npm run dev

# Start the mobile app (development build required for wallet + camera)
npm run android
# or
npm run ios
```

### Testing

```bash
# Server tests
cd server && npm test

# Type check
npm run build
```

## Token Mints

| Token | Mint Address | Decimals |
|-------|-------------|----------|
| $BONDUM | `84ngjhwssch1wvhzqwgk6eznmtx9fwpndy3bqbzjpump` | 6 |
| $PANICAFE | `H27GCsgxeM8RKMta6uBxhQeKSqUv9u4M5c2FyStoFbd1` | 6 |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/rewards` | Fetch reward catalog (filter by `?brand=`) |
| POST | `/claim` | Claim QR scan reward with streak multiplier |
| POST | `/redeem/request` | Build partially-signed redemption tx |
| POST | `/redeem` | Submit user-signed tx to network |
| GET | `/streak/:address` | Get streak, multiplier, next milestone |
| GET | `/daily-challenge` | Get today's rotating challenge |
| POST | `/recommend` | Smart reward recommendation |

## License

Private -- All rights reserved

## Links

- Website: [bondum.xyz](https://bondum.xyz)
- Solana dApp Store: [dappstore.app](https://dappstore.app)
- PaniCafe: [panicafe.com.ar](https://panicafe.com.ar)
