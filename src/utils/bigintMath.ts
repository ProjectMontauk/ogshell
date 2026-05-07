/**
 * Integer square root for bigint.
 * Returns floor(sqrt(n)) for n >= 0.
 */
export function sqrtBigInt(n: bigint): bigint {
  if (n < 0n) throw new Error("sqrtBigInt: n must be >= 0");
  if (n < 2n) return n;

  // Newton-Raphson / Heron's method
  let x0 = n;
  let x1 = (x0 + n / x0) / 2n;
  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + n / x0) / 2n;
  }
  return x0;
}

