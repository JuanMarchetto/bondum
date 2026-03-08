export interface ParsedQrReward {
  brand: string
  type: 'discount' | 'token' | 'nft'
  value: string
  title: string
  tokenAmount?: number
  nonce?: string
  exp?: number
  sig?: string
}

/**
 * Parses QR code data into a reward object.
 * Supports three formats:
 *   1. JSON: { brand, type, value, title?, tokenAmount?, nonce?, exp?, sig? }
 *   2. Deep link: bondum://?brand=X&type=X&value=X&tokens=X&nonce=X&exp=X&sig=X
 *   3. PaniCafe URL: https://panicafe.bondum.xyz/box?token={boxId}:{hmac}
 * When nonce/exp/sig are present, the reward server validates them
 * to prevent replay attacks and expired QR codes.
 * Unrecognized formats return null (no fallback rewards).
 */
export function parseQrCode(data: string): ParsedQrReward | null {
  if (!data || typeof data !== 'string') return null

  // Try JSON parse first
  try {
    const json = JSON.parse(data)
    if (json.brand && json.type && json.value) {
      // Check expiry if present
      if (json.exp && Date.now() > json.exp * 1000) {
        return null // Expired QR code
      }
      return {
        brand: json.brand,
        type: json.type,
        value: json.value,
        title: json.title || `${json.brand} Reward`,
        tokenAmount: json.tokenAmount,
        nonce: json.nonce,
        exp: json.exp,
        sig: json.sig,
      }
    }
  } catch {
    // Not JSON, continue
  }

  // Try bondum:// deep link
  if (data.startsWith('bondum://')) {
    try {
      const url = new URL(data)
      const brand = url.searchParams.get('brand') || 'Bondum'
      const type = (url.searchParams.get('type') as ParsedQrReward['type']) || 'discount'
      const value = url.searchParams.get('value') || '10% OFF'
      const title = url.searchParams.get('title') || `${brand} Reward`
      const tokenAmount = url.searchParams.get('tokens') ? Number(url.searchParams.get('tokens')) : undefined
      const nonce = url.searchParams.get('nonce') || undefined
      const exp = url.searchParams.get('exp') ? Number(url.searchParams.get('exp')) : undefined
      const sig = url.searchParams.get('sig') || undefined

      // Check expiry if present
      if (exp && Date.now() > exp * 1000) {
        return null
      }

      return { brand, type, value, title, tokenAmount, nonce, exp, sig }
    } catch {
      // Invalid URL, continue
    }
  }

  // Try PaniCafe box URL: https://panicafe.bondum.xyz/box?token={boxId}:{hmac}
  // The token may be double-URL-encoded (e.g. %253A instead of %3A for the colon)
  if (data.includes('panicafe') && data.includes('/box')) {
    try {
      const url = new URL(data)
      let token = url.searchParams.get('token')
      if (token) {
        // Decode any remaining percent-encoding (handles double-encoded tokens)
        try { token = decodeURIComponent(token) } catch { /* already decoded */ }
        return {
          brand: 'PaniCafe',
          type: 'token',
          value: 'PANICAFE REWARD',
          title: 'PaniCafe Box Reward',
          tokenAmount: 10000,
          nonce: token,
        }
      }
    } catch {
      // Invalid URL, continue
    }
  }

  // Unrecognized QR format — reject
  return null
}
