/**
 * Bondum Reward Distribution Server
 *
 * Validates QR scan data, prevents replay attacks,
 * distributes SPL tokens from a funded treasury wallet,
 * supports 2-step redemption with user wallet signing,
 * streak tracking with multipliers, daily challenges,
 * and smart reward recommendations.
 *
 * Environment variables:
 *   TREASURY_KEYPAIR  - Base64-encoded Solana keypair for the treasury wallet
 *   SOLANA_RPC_URL    - Solana RPC endpoint (Helius recommended)
 *   PORT              - Server port (default: 3001)
 *   HMAC_SECRET       - Secret key for QR code signature validation
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import {
  type StreakEntry,
  freshStreak,
  getDateString,
  getMultiplier,
  getNextMilestone,
  updateStreakPure,
  getDailyChallenge,
  generateRecommendation,
  updateChallengeProgress,
  rewardCatalog,
} from './streak.js'
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
// Base58 alphabet for encoding transaction messages (Helius priority fee API)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
function toBase58(buffer: Buffer | Uint8Array): string {
  const bytes = Array.from(buffer)
  const digits = [0]
  for (const byte of bytes) {
    let carry = byte
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8
      digits[j] = carry % 58
      carry = (carry / 58) | 0
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }
  let result = ''
  for (const byte of bytes) {
    if (byte !== 0) break
    result += '1'
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += BASE58_ALPHABET[digits[i]]
  }
  return result
}

// ─── Config ──────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3001')
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
if (!process.env.SOLANA_RPC_URL) {
  console.warn('[WARN] SOLANA_RPC_URL not set — using public RPC. Set a Helius endpoint for production.')
}

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

// Max priority fee cap: 0.001 SOL
const MAX_PRIORITY_FEE_SOL = 0.001

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

// Rate limiting (in-memory, per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 30 // 30 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT_MAX
}

function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

// ─── Priority Fee Helpers (ported from PaniCafe) ────────────────────────────

async function getPriorityFeeEstimate(transaction: Transaction): Promise<number> {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'priority-fee-1',
        method: 'getPriorityFeeEstimate',
        params: [
          {
            transaction: toBase58(transaction.serializeMessage()),
            options: { recommended: true },
          },
        ],
      }),
    })
    const data = await response.json()
    return data.result?.priorityFeeEstimate || 10000
  } catch {
    return 10000
  }
}

async function getComputeUnits(transaction: Transaction): Promise<number> {
  try {
    const response = await connection.simulateTransaction(transaction)
    if (response.value.err) return 50000
    return response.value.unitsConsumed
      ? Math.ceil(response.value.unitsConsumed * 1.2)
      : 50000
  } catch {
    return 50000
  }
}

async function addPriorityFees(transaction: Transaction): Promise<void> {
  const computeUnits = await getComputeUnits(transaction)
  let priorityFeeMicroLamports = await getPriorityFeeEstimate(transaction)

  // Cap priority fee at MAX_PRIORITY_FEE_SOL
  const totalPriorityFeeLamports = (computeUnits * priorityFeeMicroLamports) / 1_000_000
  const maxLamports = MAX_PRIORITY_FEE_SOL * LAMPORTS_PER_SOL
  if (totalPriorityFeeLamports > maxLamports) {
    priorityFeeMicroLamports = Math.floor((maxLamports * 1_000_000) / computeUnits)
  }

  transaction.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFeeMicroLamports }),
  )
}

// ─── Send and Confirm with Retry (ported from PaniCafe) ─────────────────────

async function sendAndConfirmWithRetry(
  transaction: Transaction,
  lastValidBlockHeight: number,
): Promise<string> {
  let attempt = 0
  let blockHeight = await connection.getBlockHeight('confirmed')

  while (blockHeight < lastValidBlockHeight) {
    try {
      attempt++
      const signature = await connection.sendRawTransaction(
        Buffer.from(transaction.serialize()),
        { maxRetries: 0, skipPreflight: true },
      )
      const status = await connection.getSignatureStatus(signature)
      if (
        status.value === null ||
        (status.value.confirmationStatus !== 'confirmed' &&
          status.value.confirmationStatus !== 'finalized')
      ) {
        throw new Error('Signature not confirmed yet')
      }
      if (status.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
      }
      return signature
    } catch (error: any) {
      if (error?.message?.includes('Transaction failed')) throw error
      console.log(`Send attempt #${attempt} failed: ${error?.message}`)
      await new Promise((r) => setTimeout(r, 1000))
      blockHeight = await connection.getBlockHeight('confirmed')
    }
  }
  throw new Error('Transaction expired — block height exceeded')
}

// ─── Token Transfer Helper ──────────────────────────────────────────────────

function findAta(wallet: PublicKey, mint: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM,
  )
  return ata
}

function buildTokenTransferInstructions(
  from: PublicKey,
  to: PublicKey,
  mint: PublicKey,
  amount: number,
  decimals: number,
  toAtaExists: boolean,
): TransactionInstruction[] {
  const fromAta = findAta(from, mint)
  const toAta = findAta(to, mint)
  const instructions: TransactionInstruction[] = []

  if (!toAtaExists) {
    instructions.push(
      new TransactionInstruction({
        keys: [
          { pubkey: from, isSigner: true, isWritable: true },
          { pubkey: toAta, isSigner: false, isWritable: true },
          { pubkey: to, isSigner: false, isWritable: false },
          { pubkey: mint, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: ASSOCIATED_TOKEN_PROGRAM,
        data: Buffer.alloc(0),
      }),
    )
  }

  const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)))
  const data = Buffer.alloc(9)
  data.writeUInt8(3, 0)
  data.writeBigUInt64LE(rawAmount, 1)

  instructions.push(
    new TransactionInstruction({
      keys: [
        { pubkey: fromAta, isSigner: false, isWritable: true },
        { pubkey: toAta, isSigner: false, isWritable: true },
        { pubkey: from, isSigner: true, isWritable: false },
      ],
      programId: TOKEN_PROGRAM_ID,
      data,
    }),
  )

  return instructions
}

async function transferTokens(
  to: string,
  mint: PublicKey,
  amount: number,
  decimals: number,
): Promise<string> {
  const recipient = new PublicKey(to)
  const toAta = findAta(recipient, mint)
  const toAtaInfo = await connection.getAccountInfo(toAta)

  const instructions = buildTokenTransferInstructions(
    treasury.publicKey,
    recipient,
    mint,
    amount,
    decimals,
    !!toAtaInfo,
  )

  const tx = new Transaction().add(...instructions)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  tx.recentBlockhash = blockhash
  tx.feePayer = treasury.publicKey

  await addPriorityFees(tx)
  tx.sign(treasury)

  return sendAndConfirmWithRetry(tx, lastValidBlockHeight)
}

// ─── Streak Tracking (file-persisted) ────────────────────────────────────────

const STREAKS_FILE = path.join(import.meta.dirname || __dirname, 'streaks.json')

const streakStore = new Map<string, StreakEntry>()

// Load persisted streaks on startup
try {
  if (fs.existsSync(STREAKS_FILE)) {
    const data = JSON.parse(fs.readFileSync(STREAKS_FILE, 'utf-8'))
    for (const [key, value] of Object.entries(data)) {
      streakStore.set(key, value as StreakEntry)
    }
    console.log(`[STREAK] Loaded ${streakStore.size} streak entries from disk`)
  }
} catch {
  console.warn('[STREAK] Could not load streaks.json, starting fresh')
}

function persistStreaks() {
  try {
    const obj: Record<string, StreakEntry> = {}
    for (const [key, value] of streakStore) {
      obj[key] = value
    }
    fs.writeFileSync(STREAKS_FILE, JSON.stringify(obj, null, 2))
  } catch {
    console.warn('[STREAK] Could not persist streaks to disk')
  }
}

function getOrCreateStreak(address: string): StreakEntry {
  if (!streakStore.has(address)) {
    streakStore.set(address, freshStreak())
  }
  return streakStore.get(address)!
}

function updateStreak(address: string): { streak: StreakEntry; milestoneReached: string | null; milestoneBonus: number } {
  const streak = getOrCreateStreak(address)
  const today = getDateString(new Date())
  const result = updateStreakPure(streak, today)
  persistStreaks()
  return result
}

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

  // Rate limiting
  const clientIp = req.socket.remoteAddress || 'unknown'
  if (!checkRateLimit(clientIp)) {
    sendJson(res, 429, { message: 'Too many requests. Please try again later.' })
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

      if (!isValidSolanaAddress(walletAddress)) {
        sendJson(res, 400, { message: 'Invalid wallet address format' })
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

      // Update streak
      const { streak, milestoneReached, milestoneBonus } = updateStreak(walletAddress)
      const multiplier = getMultiplier(streak.currentStreak)

      // Update daily challenge progress for scan-type challenges
      const todayChallenge = getDailyChallenge()
      if (todayChallenge.type === 'scan') {
        updateChallengeProgress(streak, 'scan', 1, todayChallenge.target)
        persistStreaks()
      }
      if (todayChallenge.type === 'streak' && streak.currentStreak > 0) {
        updateChallengeProgress(streak, 'streak', 1, todayChallenge.target)
        persistStreaks()
      }

      // Apply multiplier to token amount
      const baseAmount = tokenAmount
      const multipliedAmount = Math.floor(baseAmount * multiplier)
      const totalAmount = multipliedAmount + milestoneBonus

      // Resolve mint for brand
      const brandKey = brand.toLowerCase()
      const mintInfo = BRAND_MINTS[brandKey] || BRAND_MINTS.bondum

      // Transfer tokens from treasury to user
      const txSignature = await transferTokens(
        walletAddress,
        mintInfo.mint,
        totalAmount,
        mintInfo.decimals,
      )

      sendJson(res, 200, {
        success: true,
        txSignature,
        tokenAmount: totalAmount,
        baseAmount,
        mint: mintInfo.mint.toBase58(),
        message: `${totalAmount} ${brand} tokens sent to ${walletAddress.slice(0, 8)}...`,
        streakBonus: multipliedAmount - baseAmount,
        multiplier,
        currentStreak: streak.currentStreak,
        milestoneReached,
        milestoneBonus,
      })
      return
    }

    // ─── POST /redeem/request — Step 1: Build transaction for user to sign ───
    if (req.method === 'POST' && url.pathname === '/redeem/request') {
      const body = await parseBody(req)
      const { walletAddress, rewardId } = body

      if (!walletAddress || !rewardId) {
        sendJson(res, 400, { message: 'Missing required fields: walletAddress, rewardId' })
        return
      }

      if (!isValidSolanaAddress(walletAddress)) {
        sendJson(res, 400, { message: 'Invalid wallet address format' })
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

      // Payment always in BONDUM tokens
      const paymentMint = BRAND_MINTS.bondum
      const userPubkey = new PublicKey(walletAddress)

      // Check user's BONDUM balance
      const userAta = findAta(userPubkey, paymentMint.mint)
      const userAtaInfo = await connection.getAccountInfo(userAta)
      if (!userAtaInfo) {
        sendJson(res, 400, { message: 'No BONDUM token account found for this wallet' })
        return
      }

      // Build transfer: user sends BONDUM to treasury
      const treasuryAta = findAta(treasury.publicKey, paymentMint.mint)
      const treasuryAtaInfo = await connection.getAccountInfo(treasuryAta)

      const instructions = buildTokenTransferInstructions(
        userPubkey,
        treasury.publicKey,
        paymentMint.mint,
        reward.cost,
        paymentMint.decimals,
        !!treasuryAtaInfo,
      )

      const tx = new Transaction().add(...instructions)
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
      tx.recentBlockhash = blockhash
      tx.feePayer = treasury.publicKey

      await addPriorityFees(tx)

      // Treasury partially signs (as fee payer)
      tx.partialSign(treasury)

      const serialized = tx.serialize({ requireAllSignatures: false }).toString('base64')

      sendJson(res, 200, {
        serializedTransaction: serialized,
        rewardId,
        cost: reward.cost,
        lastValidBlockHeight,
      })
      return
    }

    // ─── POST /redeem — Step 2: Accept signed transaction, send to network ───
    if (req.method === 'POST' && url.pathname === '/redeem') {
      const body = await parseBody(req)
      const { signedTransaction, walletAddress, rewardId, brand } = body

      // Support both 2-step (signedTransaction) and legacy (walletAddress + rewardId) flows
      if (signedTransaction) {
        // 2-step flow: user signed the transaction
        const txBuffer = Buffer.from(signedTransaction, 'base64')
        const tx = Transaction.from(txBuffer)

        // Find and decrement the reward
        const targetRewardId = rewardId || body.rewardId
        const reward = targetRewardId ? rewardCatalog.find((r) => r.id === targetRewardId) : null
        if (reward) {
          if (reward.available <= 0) {
            sendJson(res, 410, { message: 'Reward is no longer available' })
            return
          }
          reward.available--
        }

        // Send the fully-signed transaction
        const { lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
        const txSignature = await sendAndConfirmWithRetry(tx, lastValidBlockHeight)

        sendJson(res, 200, {
          success: true,
          txSignature,
          rewardId: targetRewardId,
          message: reward ? `Reward "${reward.title}" redeemed on-chain` : 'Transaction confirmed',
        })
        return
      }

      // Legacy flow (backward compatible): server-side redemption
      if (!walletAddress || !rewardId) {
        sendJson(res, 400, { message: 'Missing required fields: signedTransaction or (walletAddress + rewardId)' })
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

      // For discount/NFT rewards — build a burn tx for user to sign
      // Return a marker so client knows to use 2-step flow
      sendJson(res, 200, {
        success: true,
        txSignature: null,
        rewardId,
        requires2Step: true,
        message: `Reward "${reward.title}" redeemed successfully`,
      })
      return
    }

    // ─── GET /streak/:address ───
    if (req.method === 'GET' && url.pathname.startsWith('/streak/')) {
      const walletAddress = url.pathname.split('/')[2]
      if (!walletAddress) {
        sendJson(res, 400, { message: 'Missing wallet address' })
        return
      }

      const streak = getOrCreateStreak(walletAddress)
      const multiplier = getMultiplier(streak.currentStreak)
      const nextMilestone = getNextMilestone(streak.currentStreak)

      sendJson(res, 200, {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalScans: streak.totalScans,
        multiplier,
        nextMilestone,
      })
      return
    }

    // ─── GET /daily-challenge ───
    if (req.method === 'GET' && url.pathname.startsWith('/daily-challenge')) {
      const challenge = getDailyChallenge()
      // If wallet address is provided as query param, include progress
      const walletAddress = url.searchParams.get('wallet')
      if (walletAddress) {
        const streak = getOrCreateStreak(walletAddress)
        const dateKey = getDateString(new Date())
        const key = `${dateKey}:${challenge.type}`
        const progress = streak.challengeProgress?.[key] || 0
        sendJson(res, 200, { ...challenge, progress, completed: progress >= challenge.target })
      } else {
        sendJson(res, 200, { ...challenge, progress: 0, completed: false })
      }
      return
    }

    // ─── POST /recommend ───
    if (req.method === 'POST' && (url.pathname === '/recommend' || url.pathname === '/ai/recommend')) {
      const body = await parseBody(req)
      const { walletAddress, streak, balance } = body

      if (!walletAddress) {
        sendJson(res, 400, { message: 'Missing walletAddress' })
        return
      }

      const serverStreak = getOrCreateStreak(walletAddress)
      const result = generateRecommendation({
        walletAddress,
        streak: streak ?? serverStreak.currentStreak,
        balance: balance ?? 0,
      }, rewardCatalog)

      sendJson(res, 200, result)
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
  console.log(`RPC: ${RPC_URL.includes('helius') ? 'Helius (priority fees enabled)' : RPC_URL}`)
  console.log(`Endpoints:`)
  console.log(`  GET  /rewards          - Fetch reward catalog`)
  console.log(`  POST /claim            - Claim scan reward (on-chain + streak multiplier)`)
  console.log(`  POST /redeem/request   - Step 1: Build redemption tx for user signing`)
  console.log(`  POST /redeem           - Step 2: Submit signed tx (or legacy redeem)`)
  console.log(`  GET  /streak/:address  - Get streak & multiplier data`)
  console.log(`  GET  /daily-challenge  - Get today's challenge`)
  console.log(`  POST /recommend        - Smart reward recommendation`)
})
