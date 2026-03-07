export interface ParsedQrReward {
  brand: string
  type: 'discount' | 'token' | 'nft'
  value: string
  title: string
  tokenAmount?: number
}

export function parseQrCode(data: string): ParsedQrReward | null {
  if (!data || typeof data !== 'string') return null

  // Try JSON parse first
  try {
    const json = JSON.parse(data)
    if (json.brand && json.type && json.value) {
      return {
        brand: json.brand,
        type: json.type,
        value: json.value,
        title: json.title || `${json.brand} Reward`,
        tokenAmount: json.tokenAmount,
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
      return { brand, type, value, title, tokenAmount }
    } catch {
      // Invalid URL, continue
    }
  }

  // Fallback: treat any scanned data as a generic Bondum reward
  return {
    brand: 'Bondum',
    type: 'token',
    value: '100 $BONDUM',
    title: 'Product Scan Reward',
    tokenAmount: 100,
  }
}
