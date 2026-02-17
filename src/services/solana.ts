import { createSolanaRpc, address, type Address } from '@solana/kit'

// Bondum token mint address
export const BONDUM_MINT = address('84ngjhwssch1wvhzqwgk6eznmtx9fwpndy3bqbzjpump')

// RPC endpoint from env variable (use paid RPC for production)
const RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

const rpc = createSolanaRpc(RPC_URL as Parameters<typeof createSolanaRpc>[0])

/**
 * Fetches the SPL token balance for a given wallet address and token mint.
 * Returns the balance as a human-readable number (UI amount with decimals applied).
 */
export async function getTokenBalance(
  walletAddress: string,
  mintAddress: Address = BONDUM_MINT,
): Promise<number> {
  try {
    const owner = address(walletAddress)

    const response = await rpc
      .getTokenAccountsByOwner(
        owner,
        { mint: mintAddress },
        { encoding: 'jsonParsed' },
      )
      .send()

    const accounts = response.value

    if (!accounts || accounts.length === 0) {
      return 0
    }

    // Sum up balances from all token accounts for this mint
    let totalBalance = 0
    for (const account of accounts) {
      const parsed = account.account.data as any
      const info = parsed?.parsed?.info
      if (info?.tokenAmount?.uiAmount != null) {
        totalBalance += info.tokenAmount.uiAmount
      }
    }

    return totalBalance
  } catch (error) {
    console.error('Error fetching token balance:', error)
    return 0
  }
}

/**
 * Fetches the native SOL balance for a given wallet address.
 * Returns the balance in SOL (lamports / 1e9).
 */
export async function getSolBalance(walletAddress: string): Promise<number> {
  try {
    const owner = address(walletAddress)
    const response = await rpc.getBalance(owner).send()
    return Number(response.value) / 1e9
  } catch (error) {
    console.error('Error fetching SOL balance:', error)
    return 0
  }
}

