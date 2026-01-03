export const SATS_TO_KOMA = 100000000 // Koma has 8 decimals like BTC

export function formatKomaFromSats(sats: bigint | number): number {
  const satsNum = typeof sats === 'bigint' ? Number(sats) : sats
  return satsNum / SATS_TO_KOMA
}

export function formatSatsFromKoma(koma: number): bigint {
  return BigInt(Math.floor(koma * SATS_TO_KOMA))
}

export function formatAddress(address: Buffer | string): string {
  if (address instanceof Buffer) {
    return '0x' + address.toString('hex');
  }
  return address.toString();
}

export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export interface TimeframeRange {
  from: Date
  to: Date
}

export function getTimeframeRange(timeframe: string): TimeframeRange {
  const now = new Date()
  let from = new Date()
  
  switch (timeframe) {
    case '1h':
      from.setHours(now.getHours() - 1)
      break
    case '24h':
      from.setDate(now.getDate() - 1)
      break
    case '7d':
      from.setDate(now.getDate() - 7)
      break
    case '30d':
      from.setDate(now.getDate() - 30)
      break
    case '90d':
      from.setDate(now.getDate() - 90)
      break
    default:
      from.setDate(now.getDate() - 1) // Default to 24h
  }
  
  return { from, to: now }
}