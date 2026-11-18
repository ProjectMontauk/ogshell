#!/usr/bin/env node
/**
 * Buy or sell Yes/No shares on a Citizen market (Base Sepolia) from a thirdweb SERVER WALLET.
 *
 * Read-only by default: it quotes the trade and checks balances/allowance. Nothing is sent
 * unless you pass --execute.
 *
 * Usage:
 *   node --env-file=.env scripts/agent-trade.mjs <marketId> <yes|no> <usd> [--execute]            # BUY, amount in USD
 *   node --env-file=.env scripts/agent-trade.mjs <marketId> <yes|no> <shares|all> --sell [--execute]  # SELL, amount in SHARES
 *
 * Examples:
 *   node --env-file=.env scripts/agent-trade.mjs autism yes 1                # quote only
 *   node --env-file=.env scripts/agent-trade.mjs autism yes 1 --execute      # send $1 buy
 *   node --env-file=.env scripts/agent-trade.mjs autism yes all --sell       # quote selling the whole Yes position
 *   node --env-file=.env scripts/agent-trade.mjs autism yes 2 --sell --execute  # sell 2 Yes shares
 *
 * Market ids: covid19 | glp1-sudden-blindness | talarico-flu-absence | autism | epstein-intelligence-agent
 *
 * Environment (server-side only, NEVER prefix with NEXT_PUBLIC_):
 *   AGENT_WALLET_ADDRESS            Server wallet address (defaults to the one funded for testing)
 *   THIRDWEB_SECRET_KEY             Project secret key  (needed for --execute)
 *   THIRDWEB_VAULT_ACCESS_TOKEN     Vault access token  (needed for --execute)
 *   SITE_URL                        Optional. e.g. http://localhost:3000 (npm run dev) or the deployed
 *                                   site. If set, the trade is also recorded in the app's DB
 *                                   (trade history, odds chart, user position).
 *   AGENT_MAX_TRADE_USD             Optional per-trade safety cap (default 100)
 *   BASE_SEPOLIA_RPC_URL            Optional (default https://sepolia.base.org)
 *   NEXT_PUBLIC_THIRDWEB_CLIENT_ID  Already in .env (used for read-only runs)
 *
 * Safety: chain (84532) is hardcoded; the script cannot trade on a mainnet.
 *
 * NOTE: the MARKETS table below mirrors constants/contracts.ts. Keep them in sync.
 */
import {
  Engine,
  createThirdwebClient,
  defineChain,
  getContract,
  prepareContractCall,
  readContract,
  waitForReceipt,
} from "thirdweb";
import { getWalletBalance } from "thirdweb/wallets";

const CHAIN_ID = 84532; // Base Sepolia
const DECIMALS = 6; // MockUSDC and the outcome tokens on these markets
const MOCK_USDC = "0xDAB56809ac640587b9d6B744f275118e9D989CB5";
const CONDITIONAL_TOKENS = "0x59536aFD96b0Ff1EE61e2BC231706fafBa31f106";
const DEFAULT_WALLET = "0x33DBC62B6c048052938a07ACdF98a3380Dbc90bD";
const MAX_UINT256 = 2n ** 256n - 1n;
const SELL_TARGET_PERCENT = 99n; // sell targets 99% of the requested shares; the contract may use up to 100%
const SLIPPAGE_PERCENT = 95n; // minOutcomeTokensToBuy = 95% of the quote, as in the app

const MARKETS = {
  covid19: {
    title: "Was COVID-19 a Lab Leak?",
    fpmm: "0x2463017C4544E2740481c2bF81E3F890B07FA399",
    yes: "18491180026779688852445200754146634625986627328577625999331212039807961589669",
    no: "3096726023708915958955711171427272686245726027566193352965539889669377361967",
  },
  "glp1-sudden-blindness": {
    title: "Is GLP-1 Use Linked to Sudden Onset Blindness?",
    fpmm: "0x7a104c751c01a8ecc000df26dc5e8c74232198e2",
    yes: "112371803426570343625109056135645948034569679134661643803664426643844574664773",
    no: "16176558606901767471673624156768631000045526997574632813462780501060677331644",
  },
  "talarico-flu-absence": {
    title: "Was Talarico's Campaign Absence Due to the Flu?",
    fpmm: "0x587e06E62E7Af734265cF58Ef7F26Effe468861f",
    yes: "113899525743750345012766316530693353820761353943788289292828182035780888906371",
    no: "8983074433620921250785856512855934358359375267730931564597526386510041579361",
  },
  autism: {
    title: "Is the Childhood Vaccine Schedule Linked to Autism?",
    fpmm: "0x3389a6487821B765A85bAcb293fFBBc0Ad7394FD",
    yes: "16019213470275084107411431650344488459298227099146914939882041010305091126319",
    no: "1238821413182495097622813857235079099411731703041787181926734968277411235054",
  },
  "epstein-intelligence-agent": {
    title: "Was Jeffrey Epstein an Intelligence Agent?",
    fpmm: "0x2bC9F90ab25B5Db00f4F516d10a4c9C517123a0a",
    yes: "40352694931989177420965461551900749005562240191210530332706273811445653427166",
    no: "104514190801690987109507394655496864142758538862663990771207208141683953783385",
  },
};

function fail(message) {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

function toBaseUnits(amountStr, decimals) {
  if (!/^\d+(\.\d+)?$/.test(amountStr)) fail(`Invalid amount "${amountStr}". Use a plain number like 1 or 2.5.`);
  const [whole, frac = ""] = amountStr.split(".");
  if (frac.length > decimals) fail(`Amount has more than ${decimals} decimal places.`);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(frac.padEnd(decimals, "0") || "0");
}
const human = (raw) => Number(raw) / 10 ** DECIMALS;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


// ---- args -----------------------------------------------------------------
const args = process.argv.slice(2);
const execute = args.includes("--execute");
const isSell = args.includes("--sell");
const [marketId, sideArg, amountArg] = args.filter((a) => !a.startsWith("--"));

if (!marketId || !sideArg || !amountArg) {
  fail(
    "Usage: node --env-file=.env scripts/agent-trade.mjs <marketId> <yes|no> <usd | shares|all with --sell> [--sell] [--execute]\n" +
      `Markets: ${Object.keys(MARKETS).join(" | ")}`,
  );
}
const market = MARKETS[marketId];
if (!market) fail(`Unknown market "${marketId}". Choose one of: ${Object.keys(MARKETS).join(", ")}`);
const side = sideArg.toLowerCase();
if (side !== "yes" && side !== "no") fail('Side must be "yes" or "no".');
const outcomeIndex = side === "yes" ? 0n : 1n;
const positionId = side === "yes" ? market.yes : market.no;
const maxTradeUsd = Number(process.env.AGENT_MAX_TRADE_USD ?? 100);

let invest = 0n; // BUY: USDC to spend (base units)
let sellRequest = 0n; // SELL: shares requested (base units); 0n means "all"
if (isSell) {
  if (amountArg.toLowerCase() !== "all") {
    if (!(Number(amountArg) > 0)) fail('Share amount must be greater than zero (or "all").');
    sellRequest = toBaseUnits(amountArg, DECIMALS);
  }
} else {
  if (!(Number(amountArg) > 0)) fail("Amount must be greater than zero.");
  if (Number(amountArg) > maxTradeUsd) fail(`$${amountArg} exceeds the per-trade cap of $${maxTradeUsd}. Set AGENT_MAX_TRADE_USD to change it.`);
  invest = toBaseUnits(amountArg, DECIMALS);
}

const walletAddress = process.env.AGENT_WALLET_ADDRESS || DEFAULT_WALLET;
if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) fail("AGENT_WALLET_ADDRESS is not a valid address.");

// ---- client / chain / contracts ------------------------------------------
const secretKey = process.env.THIRDWEB_SECRET_KEY;
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
if (!secretKey && !clientId) fail("Set NEXT_PUBLIC_THIRDWEB_CLIENT_ID (or THIRDWEB_SECRET_KEY) in .env.");
const client = createThirdwebClient(secretKey ? { secretKey } : { clientId });
const chain = defineChain({
  id: CHAIN_ID,
  name: "Base Sepolia",
  rpc: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  testnet: true,
});
const usdc = getContract({ client, chain, address: MOCK_USDC });
const fpmm = getContract({ client, chain, address: market.fpmm });
const ct = getContract({ client, chain, address: CONDITIONAL_TOKENS });

const usdcBalance = () =>
  readContract({ contract: usdc, method: "function balanceOf(address owner) view returns (uint256)", params: [walletAddress] });
const allowanceFor = () =>
  readContract({
    contract: usdc,
    method: "function allowance(address owner, address spender) view returns (uint256)",
    params: [walletAddress, market.fpmm],
  });
const quote = (amount, idx) =>
  readContract({
    contract: fpmm,
    method: "function calcBuyAmount(uint256 investmentAmount, uint256 outcomeIndex) view returns (uint256)",
    params: [amount, idx],
  });
const calcSell = (returnAmount) =>
  readContract({
    contract: fpmm,
    method: "function calcSellAmount(uint256 returnAmount, uint256 outcomeIndex) view returns (uint256)",
    params: [returnAmount, outcomeIndex],
  });
const operatorApproved = () =>
  readContract({
    contract: ct,
    method: "function isApprovedForAll(address owner, address operator) view returns (bool)",
    params: [walletAddress, market.fpmm],
  });
const positionBalance = (id) =>
  readContract({
    contract: ct,
    method: "function balanceOf(address account, uint256 id) view returns (uint256)",
    params: [walletAddress, BigInt(id)],
  });

/** Implied Yes/No probability from $1 quotes, same math as the app. */
async function impliedProbs() {
  const one = 10n ** BigInt(DECIMALS);
  const [sy, sn] = await Promise.all([quote(one, 0n), quote(one, 1n)]);
  if (sy <= 0n || sn <= 0n) return null;
  const oy = 1 / human(sy);
  const on = 1 / human(sn);
  return { yes: oy / (oy + on), no: on / (oy + on) };
}

/**
 * SELL: sell() takes the collateral to RECEIVE, not the shares to give up. Find the largest
 * collateral amount whose required shares (calcSellAmount) fit within `targetShares`.
 * (Collateral and outcome tokens both use 6 decimals here, and a share is worth <= $1, so
 * `targetShares` is a safe upper bound for the search.)
 */
async function calcSellSafe(returnAmount) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return await calcSell(returnAmount);
    } catch (e) {
      // The public RPC rate-limits bursts (429): back off and retry. Anything else is a revert (too much asked).
      if (/429|too many requests|limit reached|rate limit/i.test(String(e?.message))) {
        await sleep(600 * (attempt + 1));
        continue;
      }
      return null;
    }
  }
  throw new Error("RPC kept rate-limiting calcSellAmount; set BASE_SEPOLIA_RPC_URL to a dedicated RPC.");
}

async function findReturnAmount(targetShares) {
  let lo = 0n;
  let hi = targetShares;
  while (lo < hi) {
    const mid = (lo + hi + 1n) / 2n;
    const need = await calcSellSafe(mid);
    if (need !== null && need <= targetShares) lo = mid;
    else hi = mid - 1n;
    await sleep(80);
  }
  return lo;
}

// ---- read-only report -----------------------------------------------------
console.log(`Market:  ${market.title} (${marketId})`);
console.log(`FPMM:    ${market.fpmm}`);
console.log(`Wallet:  ${walletAddress}`);
console.log(`Trade:   ${isSell ? `SELL ${amountArg} ${side.toUpperCase()} shares` : `BUY ${side.toUpperCase()} for $${amountArg}`}\n`);

const eth = await getWalletBalance({ client, chain, address: walletAddress });
const [cash, owned, probs] = await Promise.all([usdcBalance(), positionBalance(positionId), impliedProbs().catch(() => null)]);
console.log(`ETH (gas):          ${eth.displayValue}`);
console.log(`MockUSDC balance:   ${human(cash).toLocaleString()}`);
console.log(`${side.toUpperCase()} shares owned:   ${human(owned).toLocaleString()}`);
if (probs) console.log(`Market price:       Yes ${(probs.yes * 100).toFixed(1)}% / No ${(probs.no * 100).toFixed(1)}%`);

const problems = [];
if (eth.value === 0n) problems.push("wallet has no Base Sepolia ETH for gas");

let sharesToSell = 0n; // SELL: shares we aim to sell (after slippage buffer)
let maxSharesToSell = 0n; // SELL: hard ceiling passed to the contract
let plannedReturn = 0n; // SELL: collateral we ask to receive
let expectedShares = 0n; // BUY: quoted shares
let allowance = 0n;

if (isSell) {
  const requested = sellRequest === 0n ? owned : sellRequest < owned ? sellRequest : owned;
  if (owned === 0n) problems.push(`wallet owns no ${side.toUpperCase()} shares in this market`);
  if (sellRequest > owned) console.log(`(Requested ${human(sellRequest)} shares but only ${human(owned)} owned; selling the owned amount.)`);
  maxSharesToSell = requested;
  sharesToSell = (requested * SELL_TARGET_PERCENT) / 100n; // leave room so price movement doesn't revert the sell
  if (requested > 0n) {
    plannedReturn = await findReturnAmount(sharesToSell);
    if (plannedReturn <= 0n) problems.push("position is too small to sell (would return $0)");
    else
      console.log(
        `Quote:              sell ~${human(sharesToSell).toLocaleString()} ${side.toUpperCase()} shares -> $${human(plannedReturn).toFixed(2)} ` +
          `(avg $${(human(plannedReturn) / human(sharesToSell)).toFixed(4)}/share)`,
      );
  }
} else {
  allowance = await allowanceFor();
  expectedShares = await quote(invest, outcomeIndex).catch((e) => {
    fail(`calcBuyAmount reverted (${e.message.split("\n")[0]}). The pool may have no liquidity.`);
  });
  console.log(`Allowance to FPMM:  ${allowance >= 10n ** 30n ? "unlimited" : human(allowance).toLocaleString()}`);
  console.log(
    `Quote:              $${amountArg} -> ${human(expectedShares).toLocaleString()} ${side.toUpperCase()} shares ` +
      `(avg $${(Number(amountArg) / human(expectedShares)).toFixed(4)}/share)`,
  );
  if (cash < invest) problems.push(`wallet has less than $${amountArg} MockUSDC`);
}
if (problems.length) fail(`Cannot trade: ${problems.join("; ")}.`);

if (!execute) {
  console.log("\nDry run only (no --execute): nothing was sent.");
  if (isSell) console.log((await operatorApproved()) ? "Outcome-token approval is in place; the sell would be sent." : "A one-time setApprovalForAll(FPMM) would be sent first, then the sell.");
  else console.log(allowance < invest ? "A one-time approve(FPMM, unlimited) would be sent first, then the buy." : "Allowance is sufficient; the buy would be sent.");
  process.exit(0);
}

// ---- execute (server wallet via thirdweb Engine) --------------------------
const vaultAccessToken = process.env.THIRDWEB_VAULT_ACCESS_TOKEN;
if (!secretKey) fail("THIRDWEB_SECRET_KEY is not set (server-side only). Required for --execute.");
if (!vaultAccessToken) fail("THIRDWEB_VAULT_ACCESS_TOKEN is not set (server-side only). Required for --execute.");

const wallet = Engine.serverWallet({ client, address: walletAddress, vaultAccessToken, chain });

/**
 * Queue a tx via Engine and wait for it. Engine's own status can lag far behind the chain
 * (Engine.waitForTransactionHash once hung 300s on a tx that mined in seconds), so we poll
 * the status ourselves, log what Engine says, and give up after `timeoutMs`.
 * Returns the tx hash, or null if Engine never reported one. The caller then verifies the
 * outcome from on-chain state (allowance / share balance) instead.
 */
async function sendAndWait(label, transaction, timeoutMs = 90_000) {
  console.log(`\n${label}: queuing via Engine...`);
  const { transactionId } = await wallet.enqueueTransaction({ transaction });
  const started = Date.now();
  let lastStatus = "";
  let transactionHash = null;
  while (Date.now() - started < timeoutMs) {
    const s = await Engine.getTransactionStatus({ client, transactionId }).catch(() => null);
    if (s) {
      if (s.status !== lastStatus) {
        console.log(`  Engine status: ${s.status}${s.transactionHash ? ` (${s.transactionHash})` : ""}`);
        lastStatus = s.status;
      }
      if (s.status === "FAILED") fail(`${label} failed in Engine: ${s.error || "unknown error"}`);
      if (s.transactionHash) {
        transactionHash = s.transactionHash;
        if (s.status === "CONFIRMED") break;
      }
    }
    await sleep(2000);
  }
  if (!transactionHash) {
    console.log(`${label}: Engine reported no tx hash within ${timeoutMs / 1000}s (last status: ${lastStatus || "none"}). Verifying on-chain instead.`);
    return null;
  }
  const receipt = await waitForReceipt({ client, chain, transactionHash, maxBlocksWaitTime: 60 }).catch(() => null);
  if (receipt && receipt.status !== "success") fail(`${label} reverted: https://sepolia.basescan.org/tx/${transactionHash}`);
  console.log(`${label}: ${receipt ? "confirmed" : "submitted"} https://sepolia.basescan.org/tx/${transactionHash}`);
  return transactionHash;
}

let tradeHash = null;
let tradeShares = 0; // shares bought or sold (human)
let tradeUsd = 0; // USD spent (BUY) or received (SELL)

if (isSell) {
  // 1) One-time ERC1155 approval so the FPMM can pull our outcome tokens.
  if (!(await operatorApproved())) {
    await sendAndWait(
      "Approve outcome tokens -> FPMM (one-time)",
      prepareContractCall({
        contract: ct,
        method: "function setApprovalForAll(address operator, bool approved)",
        params: [market.fpmm, true],
      }),
    );
    for (let i = 0; i < 20 && !(await operatorApproved()); i++) await sleep(1500); // RPC lag
    if (!(await operatorApproved())) fail("Outcome-token approval did not show up on-chain.");
  }

  // 2) Re-quote against the live pool right before selling.
  const ownedNow = await positionBalance(positionId);
  const ceiling = ownedNow < maxSharesToSell ? ownedNow : maxSharesToSell;
  const target = (ceiling * SELL_TARGET_PERCENT) / 100n;
  const returnAmount = await findReturnAmount(target);
  if (returnAmount <= 0n) fail("Position is too small to sell.");

  const cashBefore = await usdcBalance();
  const sharesBefore = ownedNow;
  tradeHash = await sendAndWait(
    `Sell ${side.toUpperCase()} (~${human(target).toLocaleString()} shares)`,
    prepareContractCall({
      contract: fpmm,
      method: "function sell(uint256 returnAmount, uint256 outcomeIndex, uint256 maxOutcomeTokensToSell)",
      params: [returnAmount, outcomeIndex, ceiling],
    }),
  );

  // Source of truth: what actually left / arrived in the wallet.
  let sharesAfter = sharesBefore;
  for (let i = 0; i < 40 && sharesAfter >= sharesBefore; i++) {
    await sleep(1500);
    sharesAfter = await positionBalance(positionId);
  }
  if (sharesAfter >= sharesBefore) fail("Sell did not reduce the share balance after ~60s. Check the wallet on Basescan.");
  const cashAfter = await usdcBalance();
  tradeShares = human(sharesBefore - sharesAfter);
  tradeUsd = cashAfter > cashBefore ? human(cashAfter - cashBefore) : human(returnAmount);
  console.log(`\nSold ${tradeShares.toLocaleString()} ${side.toUpperCase()} shares for $${tradeUsd.toFixed(2)} (position now ${human(sharesAfter).toLocaleString()}).`);
} else {
  const sharesBefore = await positionBalance(positionId);

  if (allowance < invest) {
    await sendAndWait(
      "Approve MockUSDC -> FPMM (one-time)",
      prepareContractCall({
        contract: usdc,
        method: "function approve(address spender, uint256 value) returns (bool)",
        params: [market.fpmm, MAX_UINT256],
      }),
    );
    for (let i = 0; i < 10 && (await allowanceFor()) < invest; i++) await sleep(1500); // RPC lag
  }

  // Re-quote right before buying so the slippage floor reflects the live pool.
  const freshShares = await quote(invest, outcomeIndex);
  const minOutcomeTokensToBuy = (freshShares * SLIPPAGE_PERCENT) / 100n;
  tradeHash = await sendAndWait(
    `Buy ${side.toUpperCase()} $${amountArg}`,
    prepareContractCall({
      contract: fpmm,
      method: "function buy(uint256 investmentAmount, uint256 outcomeIndex, uint256 minOutcomeTokensToBuy)",
      params: [invest, outcomeIndex, minOutcomeTokensToBuy],
    }),
  );

  // Source of truth for what we got: the wallet's share balance change.
  let sharesAfter = sharesBefore;
  for (let i = 0; i < 40 && sharesAfter <= sharesBefore; i++) {
    await sleep(1500);
    sharesAfter = await positionBalance(positionId);
  }
  if (sharesAfter <= sharesBefore) fail("Buy did not increase the share balance after ~60s. Check the wallet on Basescan.");
  tradeShares = human(sharesAfter - sharesBefore);
  tradeUsd = Number(amountArg);
  console.log(`\nReceived ${tradeShares.toLocaleString()} ${side.toUpperCase()} shares (position now ${human(sharesAfter).toLocaleString()}).`);
}

// ---- sync the app's DB so The Citizen shows the trade ---------------------
const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
if (!siteUrl) {
  console.log("\nSITE_URL not set: trade is on-chain but not recorded in the app's DB (history/chart).");
  process.exit(0);
}

let research;
try {
  research = process.env.AGENT_RESEARCH_JSON ? JSON.parse(process.env.AGENT_RESEARCH_JSON) : undefined;
} catch {
  console.log("AGENT_RESEARCH_JSON is not valid JSON; recording the trade without research context.");
}

console.log(`\nRecording trade in the app DB via ${siteUrl} ...`);
try {
  const res = await fetch(`${siteUrl}/api/agent/record-trade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress,
      marketId,
      side,
      usd: tradeUsd,
      shares: tradeShares,
      txHash: tradeHash || undefined,
      tradeType: isSell ? "SELL" : "BUY",
      research, // present only for LLM-driven trades (set by agent-evaluate.mjs): shows on the Research tab
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.ok) {
    console.log(`OK   recorded (trade history + odds chart + position${json.researchRecorded ? " + research" : ""})${json.alreadyRecorded ? " [already recorded]" : ""}`);
  } else {
    console.log(`FAIL POST /api/agent/record-trade (${res.status}): ${json.details || json.error || "unknown error"}`);
    console.log("The trade is on-chain but was NOT recorded. Re-run the POST with the same body to retry.");
  }
} catch (e) {
  console.log(`FAIL POST /api/agent/record-trade: ${e.message}`);
}
console.log("\nDone.");
