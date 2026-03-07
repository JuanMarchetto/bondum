/**
 * Jupiter Aggregator API integration for token swaps on Solana
 * Uses the free lite-api.jup.ag endpoint (no API key required)
 * Documentation: https://dev.jup.ag/docs/swap-api/
 */

// Native SOL mint address (wrapped SOL for Jupiter)
export const SOL_MINT = 'So11111111111111111111111111111111111111112'

export interface JupiterSwapResponse {
  swapTransaction: string // base64 encoded transaction
  lastValidBlockHeight: number
  prioritizationFeeLamports?: number
}

/**
 * A swap quote from Jupiter.
 * `rawQuoteResponse` is the full JSON object from the /quote endpoint —
 * it must be passed verbatim to the /swap endpoint.
 */
export interface SwapQuote {
  outAmount: string
  priceImpact: number
  /** The exact JSON object returned by Jupiter's quote endpoint */
  rawQuoteResponse: Record<string, any>
}

/**
 * Fetches a swap quote from Jupiter API
 * @param inputMint - The mint address of the token to sell
 * @param outputMint - The mint address of the token to buy
 * @param amount - The amount to swap (in smallest unit, e.g., lamports for SOL)
 * @param slippageBps - Slippage tolerance in basis points (default: 50 = 0.5%)
 */
export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50,
): Promise<SwapQuote> {
  // Build URL manually — React Native's Hermes engine doesn't fully support URL/URLSearchParams
  const params = [
    `inputMint=${encodeURIComponent(inputMint)}`,
    `outputMint=${encodeURIComponent(outputMint)}`,
    `amount=${encodeURIComponent(amount)}`,
    `slippageBps=${slippageBps}`,
  ].join('&')

  const url = `https://lite-api.jup.ag/swap/v1/quote?${params}`

  const response = await fetch(url)
  const responseText = await response.text()

  if (!response.ok) {
    try {
      const errorData = JSON.parse(responseText)
      const msg = errorData?.error || errorData?.message || errorData?.errorMessage || responseText
      throw new Error(`Jupiter API error: ${msg}`)
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message.startsWith('Jupiter API error:')) throw parseErr
      throw new Error(`Jupiter API error (${response.status}): ${responseText.slice(0, 200)}`)
    }
  }

  // Parse the full raw response — we'll pass it verbatim to /swap later
  const data = JSON.parse(responseText)

  if (!data || !data.outAmount) {
    throw new Error('No route found for this token pair. Try a different amount or pair.')
  }

  return {
    outAmount: data.outAmount,
    priceImpact: parseFloat(data.priceImpactPct || '0'),
    rawQuoteResponse: data,
  }
}

/**
 * Gets a serialized swap transaction from Jupiter API.
 * Passes the raw quote response verbatim as required by Jupiter.
 */
export async function getSwapTransaction(
  quote: SwapQuote,
  userPublicKey: string,
): Promise<string> {
  const swapRequest = {
    quoteResponse: quote.rawQuoteResponse,
    userPublicKey,
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    dynamicSlippage: true,
  }

  const response = await fetch('https://lite-api.jup.ag/swap/v1/swap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(swapRequest),
  })

  const responseText = await response.text()

  if (!response.ok) {
    try {
      const errorData = JSON.parse(responseText)
      const msg = errorData?.error || errorData?.message || errorData?.errorMessage || responseText
      throw new Error(`Swap API error: ${msg}`)
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message.startsWith('Swap API error:')) throw parseErr
      throw new Error(`Swap API error (${response.status}): ${responseText.slice(0, 200)}`)
    }
  }

  const data: JupiterSwapResponse = JSON.parse(responseText)

  if (!data.swapTransaction) {
    throw new Error('Jupiter returned empty swap transaction')
  }

  return data.swapTransaction
}
