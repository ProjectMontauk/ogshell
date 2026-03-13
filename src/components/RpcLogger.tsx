'use client';

import { useEffect } from "react";

/**
 * Known EVM function selectors (first 4 bytes of keccak256(functionSignature)).
 * Add more as needed; see https://www.4byte.directory/
 */
const KNOWN_SELECTORS: Record<string, string> = {
  "0x70a08231": "balanceOf(address)",           // ERC20 balanceOf
  "0xdd62ed3e": "allowance(address,address)",   // ERC20 allowance
  "0x095ea7b3": "approve(address,uint256)",    // ERC20 approve
  "0x00fdd58e": "balanceOf(address,uint256)",  // ERC1155 / CT balanceOf(account, id)
  "0x18160ddd": "totalSupply()",                // ERC20 totalSupply
  "0x06fdde03": "name()",
  "0x95d89b41": "symbol()",
  "0x313ce567": "decimals()",
  "0x0f28c97d": "calcBuyAmount(uint256,uint256)",   // common FPMM
  "0xf55c79d0": "calcBuyAmount(uint256,uint256)",   // FPMM (alternate selector)
  "0x7e273289": "calcMarginalPrice(uint256)",      // marginal price (uint256)
  "0xfcfff16f": "calcMarginalPrice(uint8)",       // marginal price (uint8)
  "0xb20f8e7f": "calcMarginalPrice(uint8)",       // alternate FPMM marginal price
  "0xadf59f99": "calcNetCost(int256,int256,int256)", // net cost
};

function decodeEthCallPayload(params: unknown): { selector: string; name: string; to?: string } | null {
  if (!Array.isArray(params) || params.length === 0) return null;
  const tx = params[0];
  if (!tx || typeof tx !== "object" || typeof (tx as any).data !== "string") return null;
  const data = (tx as any).data as string;
  const to = (tx as any).to;
  const selector = data.length >= 10 ? data.slice(0, 10).toLowerCase() : data;
  const name = KNOWN_SELECTORS[selector] ?? `selector ${selector}`;
  return { selector, name, to };
}

/**
 * Simple client-side logger that instruments fetch calls to Thirdweb's RPC.
 * Logs every JSON-RPC request hitting 84532.rpc.thirdweb.com and prints the
 * RPC method (e.g. eth_call), and for eth_call the decoded function being read.
 */
export default function RpcLogger() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const anyWindow = window as any;
    if (anyWindow.__thirdwebRpcPatched) return;
    anyWindow.__thirdwebRpcPatched = true;

    anyWindow.__thirdwebRpcCount = anyWindow.__thirdwebRpcCount ?? 0;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
            ? input.toString()
            : input instanceof Request
            ? input.url
            : "";

        if (url.includes("84532.rpc.thirdweb.com")) {
          anyWindow.__thirdwebRpcCount += 1;
          let methodName = "unknown";
          let body: any = init?.body;
          const ethCallDetails: { selector: string; name: string; to?: string }[] = [];

          if (!body && input instanceof Request) {
            body = input.bodyUsed ? undefined : input.body;
          }

          if (typeof body === "string") {
            try {
              const parsed = JSON.parse(body);
              const requests = Array.isArray(parsed) ? parsed : [parsed];
              for (const req of requests) {
                if (req?.method) {
                  methodName = req.method;
                  if (req.method === "eth_call" && Array.isArray(req.params)) {
                    const decoded = decodeEthCallPayload(req.params);
                    if (decoded) ethCallDetails.push(decoded);
                  }
                }
              }
            } catch {
              // ignore
            }
          }

          const payload: Record<string, unknown> = {
            url,
            method: methodName,
            sessionCount: anyWindow.__thirdwebRpcCount,
          };
          if (ethCallDetails.length > 0) {
            payload.eth_call = ethCallDetails.length === 1
              ? ethCallDetails[0]
              : ethCallDetails;
          }

          // eslint-disable-next-line no-console
          console.log("[RPC DEBUG] Thirdweb fetch ->", payload);
        }

        return await originalFetch(input as any, init as any);
      } catch (err) {
        return originalFetch(input as any, init as any);
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}

