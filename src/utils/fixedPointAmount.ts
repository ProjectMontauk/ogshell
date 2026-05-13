/**
 * Format uint256 fixed-point wei to a decimal string without casting the full
 * value through `number` (unsafe above ~9e15, so typical 18-dec outcome balances break).
 */
export function bigintWeiToDecimalString(amountWei: bigint, decimals: number): string {
  if (decimals < 0 || decimals > 36) {
    throw new RangeError("decimals out of supported range");
  }
  const base = 10n ** BigInt(decimals);
  const neg = amountWei < 0n;
  const x = neg ? -amountWei : amountWei;
  const intPart = x / base;
  const frac = x % base;
  if (frac === 0n) {
    return (neg ? "-" : "") + intPart.toString();
  }
  let fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return (neg ? "-" : "") + `${intPart.toString()}.${fracStr}`;
}

/** Parse fixed-point wei to a float for UI (1 decimal places etc.). */
export function bigintWeiToHumanNumber(amountWei: bigint, decimals: number): number {
  return parseFloat(bigintWeiToDecimalString(amountWei, decimals));
}
