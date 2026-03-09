import { useState, useEffect } from 'react'
import { getSwapQuote, type SwapQuote, SOL_MINT } from '../services/jupiter'
import { BONDUM_MINT, USDC_MINT, PANICAFE_MINT, SKR_MINT } from '../services/solana'
import { useAuth } from '../contexts/AuthContext'

export type TokenSymbol = 'SOL' | 'USDC' | 'BONDUM' | 'PANICAFE' | 'SKR'

export interface TokenInfo {
  symbol: TokenSymbol
  name: string
  mint: string
  decimals: number
}

export const TOKENS: Record<TokenSymbol, TokenInfo> = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    mint: SOL_MINT,
    decimals: 9,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: USDC_MINT,
    decimals: 6,
  },
  BONDUM: {
    symbol: 'BONDUM',
    name: 'Bondum',
    mint: BONDUM_MINT,
    decimals: 6,
  },
  PANICAFE: {
    symbol: 'PANICAFE',
    name: 'PaniCafe',
    mint: PANICAFE_MINT,
    decimals: 6,
  },
  SKR: {
    symbol: 'SKR',
    name: 'Seeker',
    mint: SKR_MINT,
    decimals: 6,
  },
}

/**
 * Converts a human-readable token amount to the smallest unit (lamports/atoms)
 * @param amount - The amount as a string (e.g., "1.5")
 * @param decimals - The number of decimals for the token
 */
function toSmallestUnit(amount: string, decimals: number): string {
  if (!amount || amount === '0' || amount === '') return '0'
  const num = parseFloat(amount)
  if (isNaN(num) || num <= 0) return '0'
  return Math.floor(num * Math.pow(10, decimals)).toString()
}

/**
 * Converts from smallest unit to human-readable amount
 * @param amount - The amount in smallest unit (string)
 * @param decimals - The number of decimals for the token
 */
function fromSmallestUnit(amount: string, decimals: number): string {
  if (!amount || amount === '0') return '0'
  const num = BigInt(amount)
  const divisor = BigInt(Math.pow(10, decimals))
  const whole = num / divisor
  const remainder = num % divisor
  if (remainder === BigInt(0)) {
    return whole.toString()
  }
  const remainderStr = remainder.toString().padStart(decimals, '0')
  const trimmed = remainderStr.replace(/0+$/, '')
  return `${whole}.${trimmed}`
}

export interface UseSwapQuoteResult {
  quote: SwapQuote | null
  toAmount: string // Human-readable amount
  priceImpact: number
  isLoading: boolean
  error: string | null
}

/**
 * Hook to fetch swap quotes from Jupiter API with debouncing
 * @param fromToken - The token symbol to sell
 * @param toToken - The token symbol to buy
 * @param fromAmount - The amount to sell (human-readable string, e.g., "1.5")
 */
export function useSwapQuote(
  fromToken: TokenSymbol | null,
  toToken: TokenSymbol | null,
  fromAmount: string,
): UseSwapQuoteResult {
  const { provider } = useAuth()
  const isDemo = provider === 'guest'

  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isDemo) return

    // Reset state when inputs change
    setQuote(null)
    setError(null)

    if (
      !fromToken ||
      !toToken ||
      fromToken === toToken ||
      !fromAmount ||
      fromAmount === '0' ||
      fromAmount === '' ||
      isNaN(parseFloat(fromAmount)) ||
      parseFloat(fromAmount) <= 0
    ) {
      setIsLoading(false)
      return
    }

    const fromTokenInfo = TOKENS[fromToken]
    const toTokenInfo = TOKENS[toToken]

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const amountInSmallestUnit = toSmallestUnit(fromAmount, fromTokenInfo.decimals)
        if (amountInSmallestUnit === '0') {
          setIsLoading(false)
          return
        }

        const result = await getSwapQuote(
          fromTokenInfo.mint,
          toTokenInfo.mint,
          amountInSmallestUnit,
          50,
        )

        setQuote(result)
        setError(null)
      } catch (err: any) {
        const message = err?.message || 'Failed to get quote. Please try again.'
        setError(message)
        setQuote(null)
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [fromToken, toToken, fromAmount, isDemo])

  // Demo mode: return fake quote
  if (isDemo) {
    const amount = parseFloat(fromAmount) || 0
    if (!fromToken || !toToken || fromToken === toToken || amount <= 0) {
      return { quote: null, toAmount: '0', priceImpact: 0, isLoading: false, error: null }
    }
    const rates: Record<string, number> = {
      'SOL-USDC': 180, 'SOL-BONDUM': 50000, 'USDC-SOL': 0.0055, 'USDC-BONDUM': 277,
      'BONDUM-SOL': 0.00002, 'BONDUM-USDC': 0.0036, 'PANICAFE-USDC': 0.001, 'USDC-PANICAFE': 1000,
    }
    const rate = rates[`${fromToken}-${toToken}`] || 1
    const out = (amount * rate).toFixed(toToken === 'SOL' ? 4 : 2)
    return {
      quote: { outAmount: '0', priceImpact: 0.12, rawQuoteResponse: {} },
      toAmount: out,
      priceImpact: 0.12,
      isLoading: false,
      error: null,
    }
  }

  const toAmount = quote && toToken
    ? fromSmallestUnit(quote.outAmount, TOKENS[toToken].decimals)
    : '0'

  return {
    quote,
    toAmount,
    priceImpact: quote?.priceImpact || 0,
    isLoading,
    error,
  }
}
