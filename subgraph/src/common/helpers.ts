import { BigInt, BigDecimal, Bytes } from "@graphprotocol/graph-ts";

// Koma token has 8 decimals
export function toDecimal(amount: BigInt): BigDecimal {
  const amountDecimal = amount.toBigDecimal();
  const divisor = BigDecimal.fromString("100000000"); // 10^8
  return amountDecimal.div(divisor);
}

// Generate unique ID for entities
export function generateId(prefix: string, hash: Bytes, logIndex: BigInt): string {
  return prefix + "-" + hash.toHexString() + "-" + logIndex.toString();
}