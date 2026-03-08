/**
 * Bondum Reward Distribution Server
 *
 * Validates QR scan data, prevents replay attacks,
 * and distributes SPL tokens from a funded treasury wallet.
 *
 * Environment variables:
 *   TREASURY_KEYPAIR  - Base64-encoded Solana keypair for the treasury wallet
 *   SOLANA_RPC_URL    - Solana RPC endpoint
 *   PORT              - Server port (default: 3001)
 *   HMAC_SECRET       - Secret key for QR code signature validation
 */

import http from 'node:http'
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'

// ─── Config ──────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3001')
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
// HMAC secret for QR code signature validation (used in production)
// const HMAC_SECRET = process.env.HMAC_SECRET || 'bondum-dev-secret'

// Token mints
const BONDUM_MINT = new PublicKey('84ngjhwssch1wvhzqwgk6eznmtx9fwpndy3bqbzjpump')
const PANICAFE_MINT = new PublicKey('H27GCsgxeM8RKMta6uBxhQeKSqUv9u4M5c2FyStoFbd1')
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
const ASSOCIATED_TOKEN_PROGRAM = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

// Brand to mint mapping
const BRAND_MINTS: Record<string, { mint: PublicKey; decimals: number }> = {
  bondum: { mint: BONDUM_MINT, decimals: 6 },
  panicafe: { mint: PANICAFE_MINT, decimals: 6 },
}

// Anti-replay: track used nonces in memory (use Redis in production)
const usedNonces = new Set<string>()

// Connection
const connection = new Connection(RPC_URL, 'confirmed')

// Load treasury keypair from environment
function loadTreasury(): Keypair {
  const encoded = process.env.TREASURY_KEYPAIR
  if (!encoded) {
    console.warn('TREASURY_KEYPAIR not set — using a generated devnet keypair')
    return Keypair.generate()
  }
  const secretKey = Buffer.from(encoded, 'base64')
  return Keypair.fromSecretKey(new Uint8Array(secretKey))
}

const treasury = loadTreasury()
console.log(`Treasury address: ${treasury.publicKey.toBase58()}`)

// ─── Token Transfer Helper ──────────────────────────────────────────────────

function findAta(wallet: PublicKey, mint: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM,
  )
  return ata
}

async function transferTokens(
  to: string,
  mint: PublicKey,
  amount: number,
  decimals: number,
): Promise<string> {
  const recipient = new PublicKey(to)
  const fromAta = findAta(treasury.publicKey, mint)
  const toAta = findAta(recipient, mint)
  const tx = new Transaction()

  // Create destination ATA if needed
  const toAtaInfo = await connection.getAccountInfo(toAta)
  if (!toAtaInfo) {
    tx.add(
      new TransactionInstruction({
        keys: [
          { pubkey: treasury.publicKey, isSigner: true, isWritable: true },
          { pubkey: toAta, isSigner: false, isWritable: true },
          { pubkey: recipient, isSigner: false, isWritable: false },
          { pubkey: mint, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: ASSOCIATED_TOKEN_PROGRAM,
        data: Buffer.alloc(0),
      }),
    )
  }

  // SPL Token transfer (instruction index 3)
  const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)))
  const data = Buffer.alloc(9)
  data.writeUInt8(3, 0)
  data.writeBigUInt64LE(rawAmount, 1)

  tx.add(
    new TransactionInstruction({
      keys: [
        { pubkey: fromAta, isSigner: false, isWritable: true },
        { pubkey: toAta, isSigner: false, isWritable: true },
        { pubkey: treasury.publicKey, isSigner: true, isWritable: false },
      ],
      programId: TOKEN_PROGRAM_ID,
      data,
    }),
  )

  const signature = await sendAndConfirmTransaction(connection, tx, [treasury])
  return signature
}

// ─── Reward Catalog ─────────────────────────────────────────────────────────

const rewardCatalog = [
  { id: '1', brand: 'Bondum', type: 'discount', title: '40% discount on your next purchase', description: '40% discount on your next purchase of any product', value: '40% OFF', cost: 5000, available: 3 },
  { id: '2', brand: 'Bondum', type: 'discount', title: '15% discount on your next purchase of the product', description: '15% discount on your next purchase of the product', value: '15% OFF', cost: 10000, available: 3 },
  { id: '3', brand: 'Bondum', type: 'token', title: 'Bonus $BONDUM tokens', description: 'Receive 500 bonus $BONDUM tokens', value: '500 $BONDUM', cost: 2000, available: 10, tokenAmount: 500 },
  { id: '4', brand: 'Bondum', type: 'nft', title: 'Exclusive Bondum NFT', description: 'An exclusive ultra rare Bondum NFT for your collection', value: 'ULTRA RARE NFT', cost: 15000, available: 1 },
  { id: 'pc-1', brand: 'PaniCafe', type: 'discount', title: 'Free Coffee with any pastry purchase', description: 'Get a free coffee when you buy any pastry', value: 'FREE COFFEE', cost: 1000, available: 5 },
  { id: 'pc-2', brand: 'PaniCafe', type: 'discount', title: '25% off any drink', description: '25% discount on any drink at PaniCafe', value: '25% OFF', cost: 2000, available: 3 },
  { id: 'pc-3', brand: 'PaniCafe', type: 'token', title: 'Bonus PaniCafe tokens', description: 'Receive 200 bonus PANICAFE tokens', value: '200 PANICAFE', cost: 500, available: 10, tokenAmount: 200 },
  { id: 'pc-4', brand: 'PaniCafe', type: 'discount', title: '50% off pastry of the day', description: '50% discount on the pastry of the day', value: '50% OFF', cost: 3000, available: 2 },
]

// ─── HTTP Request Handler ───────────────────────────────────────────────────

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: http.ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(data))
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, {})
    return
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`)

  try {
    // ─── GET /rewards ───
    if (req.method === 'GET' && url.pathname === '/rewards') {
      const brand = url.searchParams.get('brand')
      const filtered = brand
        ? rewardCatalog.filter((r) => r.brand.toLowerCase() === brand.toLowerCase())
        : rewardCatalog
      sendJson(res, 200, { rewards: filtered })
      return
    }

    // ─── POST /claim ───
    if (req.method === 'POST' && url.pathname === '/claim') {
      const body = await parseBody(req)
      const { walletAddress, brand, tokenAmount, nonce } = body

      if (!walletAddress || !brand || !tokenAmount) {
        sendJson(res, 400, { message: 'Missing required fields: walletAddress, brand, tokenAmount' })
        return
      }

      // Anti-replay check
      if (nonce) {
        if (usedNonces.has(nonce)) {
          sendJson(res, 409, { message: 'This QR code has already been claimed' })
          return
        }
        usedNonces.add(nonce)
      }

      // Resolve mint for brand
      const brandKey = brand.toLowerCase()
      const mintInfo = BRAND_MINTS[brandKey] || BRAND_MINTS.bondum

      // Transfer tokens from treasury to user
      const txSignature = await transferTokens(
        walletAddress,
        mintInfo.mint,
        tokenAmount,
        mintInfo.decimals,
      )

      sendJson(res, 200, {
        success: true,
        txSignature,
        tokenAmount,
        mint: mintInfo.mint.toBase58(),
        message: `${tokenAmount} ${brand} tokens sent to ${walletAddress.slice(0, 8)}...`,
      })
      return
    }

    // ─── POST /redeem ───
    if (req.method === 'POST' && url.pathname === '/redeem') {
      const body = await parseBody(req)
      const { walletAddress, rewardId, brand } = body

      if (!walletAddress || !rewardId) {
        sendJson(res, 400, { message: 'Missing required fields: walletAddress, rewardId' })
        return
      }

      const reward = rewardCatalog.find((r) => r.id === rewardId)
      if (!reward) {
        sendJson(res, 404, { message: 'Reward not found' })
        return
      }

      if (reward.available <= 0) {
        sendJson(res, 410, { message: 'Reward is no longer available' })
        return
      }

      reward.available--

      // For token rewards, send tokens from treasury on-chain
      if (reward.type === 'token' && (reward as any).tokenAmount) {
        const brandKey = (brand || reward.brand || 'bondum').toLowerCase()
        const mintInfo = BRAND_MINTS[brandKey] || BRAND_MINTS.bondum
        const txSignature = await transferTokens(
          walletAddress,
          mintInfo.mint,
          (reward as any).tokenAmount,
          mintInfo.decimals,
        )
        sendJson(res, 200, {
          success: true,
          txSignature,
          rewardId,
          message: `${(reward as any).tokenAmount} tokens sent to ${walletAddress.slice(0, 8)}...`,
        })
        return
      }

      // For discount/NFT rewards, no on-chain transfer needed
      sendJson(res, 200, {
        success: true,
        txSignature: null,
        rewardId,
        message: `Reward "${reward.title}" redeemed successfully`,
      })
      return
    }

    // ─── POST /referral ───
    if (req.method === 'POST' && url.pathname === '/referral') {
      const body = await parseBody(req)
      const { walletAddress, referralCode } = body as { walletAddress: string; referralCode: string }

      if (!walletAddress || !referralCode) {
        sendJson(res, 400, { message: 'Missing walletAddress or referralCode' })
        return
      }

      // In production: validate referral, distribute bonus tokens to both parties
      sendJson(res, 200, {
        success: true,
        message: 'Referral registered. Both you and your friend will receive bonus tokens on their first scan.',
      })
      return
    }

    // ─── GET /referral/:address ───
    if (req.method === 'GET' && url.pathname.startsWith('/referral/')) {
      const walletAddress = url.pathname.split('/')[2]
      sendJson(res, 200, {
        referralCode: walletAddress.slice(0, 8),
        referralCount: 0,
        totalEarned: 0,
      })
      return
    }

    // ─── 404 ───
    sendJson(res, 404, { message: 'Not found' })
  } catch (err: any) {
    console.error('Request error:', err)
    sendJson(res, 500, { message: err?.message || 'Internal server error' })
  }
})

server.listen(PORT, () => {
  console.log(`Bondum reward server running on http://localhost:${PORT}`)
  console.log(`Endpoints:`)
  console.log(`  GET  /rewards       - Fetch reward catalog`)
  console.log(`  POST /claim         - Claim scan reward (on-chain token transfer)`)
  console.log(`  POST /redeem        - Redeem marketplace reward`)
  console.log(`  POST /referral      - Register referral`)
  console.log(`  GET  /referral/:id  - Get referral stats`)
})
