/**
 * Returns the request origin if it matches allowed patterns, otherwise null.
 * Allowed: https://www.thecitizen.io, localhost (any port), and any *.vercel.app (preview deployments).
 */
export function getAllowedOrigin(origin: string | undefined): string | null {
  if (!origin || typeof origin !== 'string') return null;
  if (origin === 'https://www.thecitizen.io') return origin;
  if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) return origin;
  if (origin.endsWith('.vercel.app')) return origin;
  return null;
}
