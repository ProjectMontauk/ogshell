/**
 * Returns the request origin if it matches allowed patterns, otherwise null.
 * Allowed: https://www.thecitizen.io, Bitchute (www + apex), localhost (any port),
 * and any *.vercel.app (preview deployments).
 */
export function getAllowedOrigin(origin: string | undefined): string | null {
  if (!origin || typeof origin !== 'string') return null;
  if (origin === 'https://www.thecitizen.io') return origin;
  // Bitchute (partner widget / API calls from browser)
  if (origin === 'https://www.bitchute.com' || origin === 'https://bitchute.com') {
    return origin;
  }
  if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) return origin;
  if (origin.startsWith('http://127.0.0.1:') || origin.startsWith('https://127.0.0.1:')) return origin;
  if (origin.endsWith('.vercel.app')) return origin;
  return null;
}
