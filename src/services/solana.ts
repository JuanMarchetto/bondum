import { address, getProgramDerivedAddress, getAddressEncoder } from '@solana/kit'
import { Buffer } from 'buffer'
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  ComputeBudgetProgram,
} from '@solana/web3.js'

// Token mint addresses
export const BONDUM_MINT = '84ngjhwssch1wvhzqwgk6eznmtx9fwpndy3bqbzjpump'
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
export const PANICAFE_MINT = 'H27GCsgxeM8RKMta6uBxhQeKSqUv9u4M5c2FyStoFbd1'
export const SKR_MINT = 'SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3'

// Program IDs
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

// RPC endpoint from env variable (use paid RPC for production)
const RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

/** NFT asset with metadata */
export interface NftAsset {
  id: string
  name: string
  imageUrl: string | null
}

/**
 * Converts non-HTTP URI schemes to HTTP URLs that React Native can load.
 * - ipfs://Qm... → https://ipfs.io/ipfs/Qm...
 * - ar://xxx     → https://arweave.net/xxx
 * Returns null for empty/invalid URIs.
 */
function resolveMediaUrl(uri: string | null | undefined): string | null {
  if (!uri || typeof uri !== 'string') return null
  const trimmed = uri.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${trimmed.slice(7)}`
  }
  if (trimmed.startsWith('ar://')) {
    return `https://arweave.net/${trimmed.slice(5)}`
  }
  return trimmed
}

// ─── Raw JSON-RPC helpers ───────────────────────────────────────────────────

let rpcRequestId = 0

/**
 * Standard Solana RPC call — uses positional params (array).
 */
async function rpcCall(method: string, params: unknown[]): Promise<any> {
  rpcRequestId++
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: rpcRequestId,
      method,
      params,
    }),
  })

  const json = await response.json()
  if (json.error) {
    return null
  }
  return json.result
}

/**
 * DAS API call — uses named params (object), not positional params.
 * DAS methods like getAssetsByOwner expect { ownerAddress, ... } not [ownerAddress, ...].
 */
async function dasCall(method: string, params: Record<string, unknown>): Promise<any> {
  rpcRequestId++
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `das-${rpcRequestId}`,
      method,
      params,
    }),
  })

  const json = await response.json()
  if (json.error) {
    return null
  }
  return json.result
}

// ─── Token Balances ─────────────────────────────────────────────────────────

/**
 * Fetches token balance by querying with { mint } filter.
 * According to Solana RPC spec, { mint } searches across ALL token programs.
 */
async function getBalanceByMint(
  ownerAddress: string,
  mintAddress: string,
): Promise<number> {
  try {
    const result = await rpcCall('getTokenAccountsByOwner', [
      ownerAddress,
      { mint: mintAddress },
      { encoding: 'jsonParsed' },
    ])

    const accounts = result?.value
    if (!accounts || accounts.length === 0) return 0

    let total = 0
    for (const account of accounts) {
      const uiAmount = account?.account?.data?.parsed?.info?.tokenAmount?.uiAmount
      if (uiAmount != null) {
        total += uiAmount
      }
    }
    return total
  } catch {
    return 0
  }
}

/**
 * Fetches token balance by querying a specific program with { programId },
 * then filtering by mint. Fallback when { mint } filter doesn't work.
 */
async function getBalanceByProgram(
  ownerAddress: string,
  mintAddress: string,
  programId: string,
): Promise<number> {
  try {
    const result = await rpcCall('getTokenAccountsByOwner', [
      ownerAddress,
      { programId },
      { encoding: 'jsonParsed' },
    ])

    const accounts = result?.value
    if (!accounts || accounts.length === 0) return 0

    let total = 0
    for (const account of accounts) {
      const info = account?.account?.data?.parsed?.info
      if (info?.mint === mintAddress && info?.tokenAmount?.uiAmount != null) {
        total += info.tokenAmount.uiAmount
      }
    }
    return total
  } catch {
    return 0
  }
}

/**
 * Fetches the SPL token balance for a given wallet and mint.
 * First tries { mint } filter (works across all programs).
 * If that returns 0, falls back to querying Token-2022 by { programId }.
 */
export async function getTokenBalance(
  walletAddress: string,
  mintAddress: string = BONDUM_MINT,
): Promise<number> {
  try {
    // Try { mint } filter first — should work for both Token and Token-2022
    const balance = await getBalanceByMint(walletAddress, mintAddress)

    if (balance > 0) {
      return balance
    }

    // Fallback: explicitly query Token-2022 program
    const t22Balance = await getBalanceByProgram(walletAddress, mintAddress, TOKEN_2022_PROGRAM_ID)
    if (t22Balance > 0) {
      return t22Balance
    }

    // Final fallback: explicitly query standard Token program
    return await getBalanceByProgram(walletAddress, mintAddress, TOKEN_PROGRAM_ID)
  } catch {
    return 0
  }
}

/**
 * Fetches the native SOL balance for a given wallet address.
 */
export async function getSolBalance(walletAddress: string): Promise<number> {
  try {
    const result = await rpcCall('getBalance', [walletAddress])
    if (result?.value == null) return 0
    return Number(result.value) / 1e9
  } catch {
    return 0
  }
}

// ─── NFT Metadata (on-chain Metaplex fallback) ──────────────────────────────

const METADATA_PROGRAM = address('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

async function deriveMetadataPda(mintAddr: string): Promise<string> {
  const addressEncoder = getAddressEncoder()
  const [pda] = await getProgramDerivedAddress({
    programAddress: METADATA_PROGRAM,
    seeds: [
      new TextEncoder().encode('metadata'),
      addressEncoder.encode(METADATA_PROGRAM),
      addressEncoder.encode(address(mintAddr)),
    ],
  })
  return pda as string
}

function readBorshString(data: Buffer, offset: number): { value: string; offset: number } {
  if (offset + 4 > data.length) return { value: '', offset }
  const len = data.readUInt32LE(offset)
  offset += 4
  if (len > 500 || offset + len > data.length) return { value: '', offset }
  const value = data.slice(offset, offset + len).toString('utf8').replace(/\0/g, '').trim()
  offset += len
  return { value, offset }
}

function parseMetaplexMetadata(base64Data: string): { name: string; uri: string } {
  try {
    const data = Buffer.from(base64Data, 'base64')
    let offset = 1 + 32 + 32 // key(1) + update_authority(32) + mint(32)

    const name = readBorshString(data, offset)
    offset = name.offset

    const symbol = readBorshString(data, offset)
    offset = symbol.offset

    const uri = readBorshString(data, offset)

    return { name: name.value, uri: uri.value }
  } catch {
    return { name: '', uri: '' }
  }
}

async function enrichNftsWithMetadata(nfts: NftAsset[], maxEnrich: number): Promise<void> {
  const toEnrich = Math.min(maxEnrich, nfts.length)

  const enrichPromises = nfts.slice(0, toEnrich).map(async (nft, i) => {
    try {
      const metadataPda = await deriveMetadataPda(nft.id)
      const result = await rpcCall('getAccountInfo', [metadataPda, { encoding: 'base64' }])

      if (result?.value?.data) {
        const rawData = result.value.data
        const base64Str = Array.isArray(rawData) ? rawData[0] : rawData
        const metadata = parseMetaplexMetadata(base64Str)

        nfts[i].name = metadata.name || 'NFT'

        if (metadata.uri) {
          const httpUri = resolveMediaUrl(metadata.uri)
          if (httpUri) {
            try {
              const offChainRes = await fetch(httpUri)
              if (offChainRes.ok) {
                const offChainData = await offChainRes.json()
                const rawImage = offChainData.image || offChainData.image_uri || null
                nfts[i].imageUrl = resolveMediaUrl(rawImage)
              }
            } catch {
              // Off-chain metadata fetch failed; image stays null
            }
          }
        }
      }
    } catch {
      // Enrichment failed for this NFT; skip
    }
  })

  await Promise.all(enrichPromises)
}

// ─── NFT Fetching ───────────────────────────────────────────────────────────

async function getNftMintsFromProgram(ownerAddress: string, programId: string): Promise<string[]> {
  try {
    const result = await rpcCall('getTokenAccountsByOwner', [
      ownerAddress,
      { programId },
      { encoding: 'jsonParsed' },
    ])

    const accounts = result?.value || []
    const mints: string[] = []

    for (const account of accounts) {
      const info = account?.account?.data?.parsed?.info
      if (info?.tokenAmount?.decimals === 0 && info?.tokenAmount?.amount === '1') {
        mints.push(info.mint as string)
      }
    }

    return mints
  } catch {
    return []
  }
}

const FUNGIBLE_INTERFACES = new Set(['FungibleToken', 'FungibleAsset'])

/**
 * Fetches NFTs using the DAS API (getAssetsByOwner).
 * DAS methods use named params (object), not positional params (array).
 */
async function getDasNfts(walletAddress: string): Promise<NftAsset[]> {
  try {
    const result = await dasCall('getAssetsByOwner', {
      ownerAddress: walletAddress,
      page: 1,
      limit: 50,
      displayOptions: {
        showFungible: false,
        showNativeBalance: false,
      },
    })

    if (!result?.items) {
      return []
    }

    const assets: NftAsset[] = []

    for (const item of result.items) {
      if (FUNGIBLE_INTERFACES.has(item.interface)) continue

      // Try all known image paths from DAS (prefer cdn_uri, then links.image, then raw uri)
      const rawImageUrl =
        item.content?.links?.image ||
        item.content?.files?.[0]?.cdn_uri ||
        item.content?.files?.[0]?.uri ||
        item.content?.json?.image ||
        item.content?.metadata?.image ||
        null

      assets.push({
        id: item.id,
        name: item.content?.metadata?.name || item.content?.json?.name || 'NFT',
        imageUrl: resolveMediaUrl(rawImageUrl),
      })
    }

    return assets
  } catch {
    return []
  }
}

/**
 * Fetches all NFTs owned by the wallet.
 * DAS API is primary (returns metadata + images). On-chain scanning is fallback.
 */
export async function getWalletNfts(walletAddress: string): Promise<NftAsset[]> {
  try {
    const [standardMints, token2022Mints, dasNfts] = await Promise.all([
      getNftMintsFromProgram(walletAddress, TOKEN_PROGRAM_ID),
      getNftMintsFromProgram(walletAddress, TOKEN_2022_PROGRAM_ID),
      getDasNfts(walletAddress),
    ])

    const onChainNfts: NftAsset[] = [...standardMints, ...token2022Mints].map((mint) => ({
      id: mint,
      name: 'NFT',
      imageUrl: null,
    }))

    // Only enrich on-chain NFTs that DAS didn't already find
    const dasIds = new Set(dasNfts.map((n) => n.id))
    const nftsNeedingEnrichment = onChainNfts.filter((n) => !dasIds.has(n.id))

    if (nftsNeedingEnrichment.length > 0) {
      await enrichNftsWithMetadata(nftsNeedingEnrichment, 6)
    }

    // DAS results first (they have images), then enriched on-chain ones
    const allNfts = [...dasNfts, ...nftsNeedingEnrichment]
    const seen = new Set<string>()
    const deduped: NftAsset[] = []
    for (const nft of allNfts) {
      if (!seen.has(nft.id)) {
        seen.add(nft.id)
        deduped.push(nft)
      }
    }

    return deduped
  } catch {
    return []
  }
}

// ─── Shared Connection (singleton) ──────────────────────────────────────────

const sharedConnection = new Connection(RPC_URL, 'confirmed')

// ─── Transfer Transaction Builder ────────────────────────────────────────────

const SPL_TOKEN_PROGRAM = new PublicKey(TOKEN_PROGRAM_ID)

const ASSOCIATED_TOKEN_PROGRAM = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

function findAssociatedTokenAddress(wallet: PublicKey, mint: PublicKey, programId: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [wallet.toBuffer(), programId.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM,
  )
  return ata
}

/**
 * Builds a base64-encoded transaction for transferring SOL or SPL tokens.
 * For SOL: uses SystemProgram.transfer
 * For SPL: uses raw Token Program transfer instruction
 */
export async function buildTransferTransaction(
  from: string,
  to: string,
  mint: string | null,
  amount: number,
  decimals: number,
): Promise<string> {
  const fromPubkey = new PublicKey(from)
  const toPubkey = new PublicKey(to)
  const transaction = new Transaction()

  // Priority fee for faster inclusion during network congestion
  transaction.add(
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5000 }),
  )

  if (!mint) {
    // SOL transfer
    transaction.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: Math.floor(amount * 1e9),
      }),
    )
  } else {
    // SPL token transfer
    const mintPubkey = new PublicKey(mint)
    const tokenProgramId = SPL_TOKEN_PROGRAM // default to standard program
    const fromAta = findAssociatedTokenAddress(fromPubkey, mintPubkey, tokenProgramId)
    const toAta = findAssociatedTokenAddress(toPubkey, mintPubkey, tokenProgramId)

    // Check if destination ATA exists; if not, create it
    const toAtaInfo = await sharedConnection.getAccountInfo(toAta)
    if (!toAtaInfo) {
      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: fromPubkey, isSigner: true, isWritable: true },
            { pubkey: toAta, isSigner: false, isWritable: true },
            { pubkey: toPubkey, isSigner: false, isWritable: false },
            { pubkey: mintPubkey, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: tokenProgramId, isSigner: false, isWritable: false },
          ],
          programId: ASSOCIATED_TOKEN_PROGRAM,
          data: Buffer.alloc(0),
        }),
      )
    }

    // SPL Token transfer instruction (instruction index 3)
    const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)))
    const data = Buffer.alloc(9)
    data.writeUInt8(3, 0) // Transfer instruction
    data.writeBigUInt64LE(rawAmount, 1)

    transaction.add(
      new TransactionInstruction({
        keys: [
          { pubkey: fromAta, isSigner: false, isWritable: true },
          { pubkey: toAta, isSigner: false, isWritable: true },
          { pubkey: fromPubkey, isSigner: true, isWritable: false },
        ],
        programId: tokenProgramId,
        data,
      }),
    )
  }

  const { blockhash } = await sharedConnection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = fromPubkey

  return transaction.serialize({ requireAllSignatures: false }).toString('base64')
}
