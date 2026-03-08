# Security

## Architecture

Bondum uses multiple layers of security for on-chain reward distribution:

### Transaction Security
- **2-step redemption**: Server builds the transaction, user signs with their wallet. Neither party can execute alone.
- **Treasury partial signing**: The server (fee payer) signs first, then the user signs. The transaction cannot be altered after signing.
- **Anti-replay protection**: QR codes contain a unique nonce that can only be claimed once. Used nonces are tracked server-side.
- **Block height expiry**: Transactions automatically expire if not confirmed within the valid block height window.

### Input Validation
- **Wallet address format**: All endpoints validate Base58 Solana address format before processing.
- **Rate limiting**: 30 requests per minute per IP to prevent abuse.
- **Request body validation**: All required fields are checked before any on-chain operations.

### Wallet Security
- **Seed Vault SDK**: On Solana Mobile Seeker devices, private keys are stored in the hardware-secured Seed Vault enclave.
- **MWA**: Mobile Wallet Adapter delegates signing to the user's trusted wallet app (Phantom, Solflare).
- **Privy embedded wallet**: For email-authenticated users, keys are managed by Privy's MPC infrastructure.
- **No private keys in the app**: The mobile app never has access to the user's private key.

### Token Security
- **Treasury isolation**: The treasury keypair is loaded from environment variables, never committed to source.
- **Priority fee cap**: Maximum priority fee is capped at 0.001 SOL to prevent excessive fee drain.
- **Compute unit simulation**: Transactions are simulated before submission to prevent failed transactions.

## Reporting Vulnerabilities

If you discover a security vulnerability, please email security@bondum.xyz.
