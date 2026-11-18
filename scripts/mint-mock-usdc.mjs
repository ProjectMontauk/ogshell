#!/usr/bin/env node
/**
 * Mint MockUSDC (Base Sepolia testnet) to any wallet address.
 *
 * MockUSDC.mint(address,uint256) has no access control, so ANY wallet with a little
 * Base Sepolia ETH can send this transaction. The minter pays gas; the recipient
 * only receives tokens (it needs no ETH to be minted to).
 *
 * Usage:
 *   node --env-file=.env scripts/mint-mock-usdc.mjs <recipientAddress> [amountUsdc] [--dry-run]
 *
 * Examples:
 *   node --env-file=.env scripts/mint-mock-usdc.mjs 0x33DBC62B6c048052938a07ACdF98a3380Dbc90bD
 *   node --env-file=.env scripts/mint-mock-usdc.mjs 0x33DB... 25000
 *   node --env-file=.env scripts/mint-mock-usdc.mjs 0x33DB... 100000 --dry-run
 *
 * Environment (server-side only, never prefix with NEXT_PUBLIC_):
 *   MINTER_PRIVATE_KEY               0x-prefixed key of a Base Sepolia wallet that holds a little ETH.
 *                                    Use a dedicated funder wallet, not a wallet that holds real funds.
 *                                    Not needed for --dry-run.
 *   NEXT_PUBLIC_THIRDWEB_CLIENT_ID   Already in .env; the thirdweb SDK requires a client.
 *   THIRDWEB_SECRET_KEY              Optional; used instead of the client id if set.
 *   BASE_SEPOLIA_RPC_URL             Optional; defaults to https://sepolia.base.org
 *
 * Safety: the chain (84532) and token contract are hardcoded, so this can never
 * send a transaction on a mainnet.
 */
import {
  createThirdwebClient,
  defineChain,
  getContract,
  prepareContractCall,
  readContract,
  sendAndConfirmTransaction,
} from "thirdweb";
import { getWalletBalance, privateKeyToAccount } from "thirdweb/wallets";

const MOCK_USDC_ADDRESS = "0xDAB56809ac640587b9d6B744f275118e9D989CB5";
const CHAIN_ID = 84532; // Base Sepolia
const DECIMALS = 6;
const DEFAULT_AMOUNT = "100000";
const MAX_AMOUNT = 1_000_000; // guard against typos like an extra zero

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function fail(message) {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

/** "100000" or "2500.5" -> bigint base units, with no floating-point rounding. */
function toBaseUnits(amountStr, decimals) {
  if (!/^\d+(\.\d+)?$/.test(amountStr)) fail(`Invalid amount "${amountStr}". Use a plain number like 100000.`);
  const [whole, frac = ""] = amountStr.split(".");
  if (frac.length > decimals) fail(`Amount has more than ${decimals} decimal places.`);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(frac.padEnd(decimals, "0") || "0");
}

const fmt = (raw) => (Number(raw) / 10 ** DECIMALS).toLocaleString(undefined, { maximumFractionDigits: DECIMALS });

// ---- args -----------------------------------------------------------------
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const positional = args.filter((a) => !a.startsWith("--"));
const [recipient, amountArg = DEFAULT_AMOUNT] = positional;

if (!recipient) {
  fail("Missing recipient address.\nUsage: node --env-file=.env scripts/mint-mock-usdc.mjs <recipientAddress> [amountUsdc] [--dry-run]");
}
if (!ADDRESS_RE.test(recipient)) fail(`"${recipient}" is not a valid 0x address.`);
if (Number(amountArg) > MAX_AMOUNT) fail(`Amount exceeds the ${MAX_AMOUNT.toLocaleString()} safety cap. Edit MAX_AMOUNT if intended.`);
const amount = toBaseUnits(amountArg, DECIMALS);
if (amount <= 0n) fail("Amount must be greater than zero.");

// ---- client / chain / contract -------------------------------------------
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
const token = getContract({ client, chain, address: MOCK_USDC_ADDRESS });

async function usdcBalanceOf(address) {
  return readContract({
    contract: token,
    method: "function balanceOf(address owner) view returns (uint256)",
    params: [address],
  });
}

// ---- run -------------------------------------------------------------------
console.log(`Network:   Base Sepolia (${CHAIN_ID})`);
console.log(`Token:     MockUSDC ${MOCK_USDC_ADDRESS}`);
console.log(`Recipient: ${recipient}`);
console.log(`Amount:    ${fmt(amount)} USDC (${amount} base units)`);

const before = await usdcBalanceOf(recipient);
console.log(`\nRecipient MockUSDC balance before: ${fmt(before)}`);

if (dryRun) {
  console.log("\n--dry-run: no transaction sent.");
  console.log(`Would call mint("${recipient}", ${amount}) on ${MOCK_USDC_ADDRESS}.`);
  process.exit(0);
}

const privateKey = process.env.MINTER_PRIVATE_KEY;
if (!privateKey) fail("MINTER_PRIVATE_KEY is not set. Add it to .env (server-side only), or use --dry-run.");
if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) fail("MINTER_PRIVATE_KEY must be a 0x-prefixed 32-byte hex key.");

const minter = privateKeyToAccount({ client, privateKey });
console.log(`Minter (pays gas): ${minter.address}`);

const gas = await getWalletBalance({ client, chain, address: minter.address });
console.log(`Minter ETH balance: ${gas.displayValue} ${gas.symbol}`);
if (gas.value === 0n) fail(`Minter ${minter.address} has no Base Sepolia ETH to pay gas. Send it a little first.`);

const transaction = prepareContractCall({
  contract: token,
  method: "function mint(address to, uint256 amount)",
  params: [recipient, amount],
});

console.log("\nSending mint transaction...");
const receipt = await sendAndConfirmTransaction({ transaction, account: minter });
console.log(`Confirmed in block ${receipt.blockNumber}`);
console.log(`Tx: https://sepolia.basescan.org/tx/${receipt.transactionHash}`);

// RPC nodes can lag a block behind the receipt; poll briefly for the new balance.
let after = before;
for (let i = 0; i < 6; i++) {
  after = await usdcBalanceOf(recipient);
  if (after >= before + amount) break;
  await new Promise((r) => setTimeout(r, 1500));
}
console.log(`\nRecipient MockUSDC balance after: ${fmt(after)}`);
if (after < before + amount) {
  console.warn("Balance has not updated yet; check the explorer link above in a moment.");
}
