export type QuadraticRoots =
  | { kind: "two-real"; z1: number; z2: number; discriminant: number }
  | { kind: "one-real"; z: number; discriminant: number }
  | { kind: "no-real"; discriminant: number };

/**
 * Solves (a - z) * (b - z) = c for z.
 *
 * Expands to: z^2 - (a + b) z + (a*b - c) = 0
 *
 * Returns real roots only (if any).
 */
export function solveProductShiftedForZ(a: number, b: number, c: number): QuadraticRoots {
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) {
    throw new Error("Inputs must be finite numbers.");
  }

  const A = 1;
  const B = -(a + b);
  const C = a * b - c;

  const disc = B * B - 4 * A * C;
  if (disc < 0) return { kind: "no-real", discriminant: disc };

  const sqrtDisc = Math.sqrt(disc);
  const z1 = (-B + sqrtDisc) / (2 * A);
  const z2 = (-B - sqrtDisc) / (2 * A);

  if (Object.is(z1, z2)) return { kind: "one-real", z: z1, discriminant: disc };
  return { kind: "two-real", z1, z2, discriminant: disc };
}

/**
 * Convenience for the specific equation:
 * (7437.52 - z) * (14010.45 - z) = 100000000.000
 */
export function solveLabLeakQuadraticExample(): QuadraticRoots {
  return solveProductShiftedForZ(7437.52, 14010.45, 100000000.0);
}

/**
 * Calls solveProductShiftedForZ(a,b,c) and returns the smaller positive real root.
 * Returns null if there is no positive real root.
 */
export function smallerPositiveRootForProductShifted(
  a: number,
  b: number,
  c: number,
  epsilon: number = 1e-12
): number | null {
  const roots = solveProductShiftedForZ(a, b, c);
  const candidates: number[] =
    roots.kind === "two-real" ? [roots.z1, roots.z2] : roots.kind === "one-real" ? [roots.z] : [];

  const positives = candidates
    .filter((z) => Number.isFinite(z) && z > epsilon)
    .sort((x, y) => x - y);

  return positives.length ? positives[0] : null;
}

