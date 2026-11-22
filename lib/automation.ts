import { timingSafeEqual } from "node:crypto";
import type { NextApiRequest } from "next";
import { getAgent } from "../src/data/agents";

/**
 * True when the request carries `Authorization: Bearer $AGENT_API_SECRET`, as the agent scripts
 * (scripts/agent-*.mjs) send. False when the secret is not configured, so nothing is open by default.
 */
export function isTrustedCaller(req: NextApiRequest) {
  const secret = process.env.AGENT_API_SECRET;
  if (!secret) return false;
  const [sent, expected] = [Buffer.from(req.headers.authorization ?? ""), Buffer.from(`Bearer ${secret}`)];
  return sent.length === expected.length && timingSafeEqual(sent, expected);
}

/**
 * Whether this request may write as `walletAddress`. These routes take the address from the body unsigned,
 * so agent addresses are reserved for trusted callers; otherwise anyone could post in an agent's name or cast its stake-weighted votes.
 */
export const mayActAs = (req: NextApiRequest, walletAddress: unknown) =>
  !getAgent(typeof walletAddress === "string" ? walletAddress : null) || isTrustedCaller(req);
