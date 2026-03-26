# Bondum

[![Solana](https://img.shields.io/badge/Solana-9945FF?logo=solana&logoColor=white)](https://solana.com)
[![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Solana dApp Store](https://img.shields.io/badge/Solana_dApp_Store-Live-22c55e)](https://dappstore.app)
[![PaniCafe Users](https://img.shields.io/badge/Real_Users-~8%2C000-8b5cf6)](https://panicafe.com.ar)

> [bondum.xyz](https://bondum.xyz) | Live on [Solana dApp Store](https://dappstore.app)

![Bondum - Simply scan your everyday products and get the rewards](banner.jpeg)

A blockchain loyalty platform on Solana. Brands create SPL tokens as loyalty coins, customers earn them by scanning products, build streaks for multiplied rewards, and redeem real products -- all with on-chain verification.

**Already live** with [PaniCafe](https://panicafe.com.ar), serving **~8,000 real users** with on-chain reward transactions in production.

## Bondum Ecosystem

| Product | Description | Link |
|---------|-------------|------|
| **Bondum Launchpad** | Web platform for brands to create and manage on-chain loyalty tokens (SPL) on Solana. Whitelist-gated coin creation, brand directory, tokenomics wizard, and on-chain deploy. | [launchpad.bondum.xyz](https://launchpad.bondum.xyz) / [Source](https://github.com/JuanMarchetto/bondum-launchpad) |
| **Bondum Mobile** | Consumer mobile app — scan products, earn tokens, build streaks, redeem rewards, swap via Jupiter. Live on Solana dApp Store. | [Download](https://github.com/JuanMarchetto/bondum/releases/latest) / This repo |
| **Reward Server** | Backend API for reward distribution, streak tracking, on-chain transaction building and submission. | [`server/`](server/) |
| **Scan Guard** | Anchor program for on-chain nonce replay protection on QR scan claims. | [`programs/scan_guard/`](programs/scan_guard/) |

## Download

| Platform | Link |
|----------|------|
| Android (APK) | [Download latest release](https://github.com/JuanMarchetto/bondum/releases/latest) |
| Solana dApp Store | [Available on Solana dApp Store](https://dappstore.app) -- pre-installed or searchable on Saga & Seeker devices |
| iOS (TestFlight) | Coming soon |

> **Solana dApp Store**: Bondum is published and listed on the official Solana dApp Store, available to all Saga and Seeker device users. This is the recommended install method for Solana Mobile devices.

**Featured by [Privy](https://x.com/privy_io/status/2021426997189280010)** | [$PANICAFE on CoinMarketCap](https://coinmarketcap.com/currencies/panicafe/) ($446K+ market cap) | [Press coverage](https://derechadiario.com.ar/us/argentina/panicafe-launches-its-digital-currency-and-bets-on-an-innovative-loyalty-model)

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
- **2-step redemption with wallet signing** -- Server builds the transaction, user signs with their wallet (MWA or Privy), server submits to network. Every redemption has a verifiable Orb Explorer signature.
- **Priority fees via Helius** -- Dynamic fee estimation with compute unit simulation and a 0.001 SOL cap, ensuring transactions land reliably during network congestion.
- **Send-and-confirm with retry** -- Production-grade transaction delivery that retries until block height expiry, ported from PaniCafe's battle-tested patterns.
- **Anti-replay QR validation** -- Nonce-based QR codes with expiry timestamps prevent double-claiming, backed by an on-chain Anchor program (`scan_guard`) that records nonces in PDAs.

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
  |                 Smart recommendation card
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

On-Chain Program (Anchor / Solana)
  |
  |-- record_scan(nonce) -----> Create PDA [b"scan", nonce] if not exists
  |                             Replay attempt → tx fails (PDA already init)

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
|   |-- TransactionConfirmation  # Tx result with Orb Explorer link
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
|   |-- rewardApi.ts      # Reward API client (claim, redeem, streak, recommendations)
|   |-- qrParser.ts       # QR code parser with nonce/expiry validation
|   |-- streakStorage.ts  # Local streak persistence (offline fallback)

programs/                 # On-chain Solana programs
|-- scan_guard/           # Anchor program for nonce replay protection
    |-- src/lib.rs        # record_scan instruction with PDA nonce guard

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

## On-Chain Program

| Program | Address | Description |
|---------|---------|-------------|
| scan_guard | TBA | On-chain nonce replay guard — prevents double-claiming of QR scan rewards using PDA-based nonce records |

Built with [Anchor](https://www.anchor-lang.com/) 0.32.1. Source: [`programs/scan_guard/src/lib.rs`](programs/scan_guard/src/lib.rs)

## Token Mints

| Token | Mint Address | Decimals | Explorer |
|-------|-------------|----------|----------|
| $BONDUM | `84ngjhwssch1wvhzqwgk6eznmtx9fwpndy3bqbzjpump` | 6 | [Orb Explorer](https://orb.helius.dev/token/84ngjhwssch1wvhzqwgk6eznmtx9fwpndy3bqbzjpump) |
| $PANICAFE | `H27GCsgxeM8RKMta6uBxhQeKSqUv9u4M5c2FyStoFbd1` | 6 | [Orb Explorer](https://orb.helius.dev/token/H27GCsgxeM8RKMta6uBxhQeKSqUv9u4M5c2FyStoFbd1) \| [5,006 holders](https://orb.helius.dev/token/H27GCsgxeM8RKMta6uBxhQeKSqUv9u4M5c2FyStoFbd1#holders) |
| $SKR | `SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3` | 6 | [Orb Explorer](https://orb.helius.dev/token/SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3) — Solana Mobile ecosystem token |

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

MIT -- See [LICENSE](LICENSE)

## Links

- Website: [bondum.xyz](https://bondum.xyz)
- Solana dApp Store: [dappstore.app](https://dappstore.app)
- PaniCafe: [panicafe.com.ar](https://panicafe.com.ar)
- [Demo video](https://github.com/JuanMarchetto/bondum/releases/download/v1.1.0/bondum-demo.mp4)
