"use client";

import { useEffect, useState } from "react";
import { BuyWidget, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, waitForReceipt } from "thirdweb";
import Navbar, { SignInButton } from "../../../components/Navbar";
import PageShell from "@/components/ui/PageShell";
import { usePortfolio } from "../../contexts/PortfolioContext";
import { client } from "../../client";
import { appChain, baseUsdcContractAddress, tokenContract } from "../../../constants/contracts";
import { CASH_TOKEN_SCALE_BI } from "../../../constants/tokenUnits";

/** Fake deposit size. MockUSDC is a testnet token with an open mint, so this is not real money. */
const FAKE_DEPOSIT_USDC = 10_000n;

export default function DepositPage() {
  const account = useActiveAccount();
  const { requestCashRefresh } = usePortfolio();
  const { mutateAsync: sendTransaction } = useSendTransaction();
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hash === "#buy-usdc-section") {
      setTimeout(() => {
        document.getElementById("buy-usdc-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, []);

  const handleFakeDeposit = async () => {
    if (!account?.address) return;
    setStatus("pending");
    setMessage(null);
    try {
      const transaction = prepareContractCall({
        contract: tokenContract,
        method: "function mint(address to, uint256 amount)",
        params: [account.address, FAKE_DEPOSIT_USDC * CASH_TOKEN_SCALE_BI],
      });
      const result = await sendTransaction(transaction);
      await waitForReceipt({ client, chain: appChain, transactionHash: result.transactionHash });
      requestCashRefresh();
      setStatus("done");
      setMessage(`${FAKE_DEPOSIT_USDC.toLocaleString()} fake USDC added to your wallet.`);
    } catch (e) {
      console.error("[deposit] fake deposit failed:", e);
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "The deposit failed. Please try again.");
    }
  };

  return (
    <div>
      <Navbar />
      <PageShell width="medium" title="Deposit" note="Add USDC on Base Sepolia to your wallet to start trading">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-10">
            <section id="fake-deposit-section" aria-labelledby="fake-deposit-heading">
              <h2 id="fake-deposit-heading" className="kicker">
                Fake Deposit
              </h2>
              <p className="serif mb-6 mt-3 text-lead text-ink-2">
                Add {FAKE_DEPOSIT_USDC.toLocaleString()} test USDC to your wallet in one click. This is play money on Base Sepolia, so
                you can try the markets without paying for anything.
              </p>
              {account?.address ? (
                <button type="button" onClick={handleFakeDeposit} disabled={status === "pending"} className="btn btn-primary btn-lg">
                  {status === "pending" ? "Depositing..." : `Deposit ${FAKE_DEPOSIT_USDC.toLocaleString()} fake USDC`}
                </button>
              ) : (
                <SignInButton />
              )}
              {message && (
                <p role="status" className={`mt-4 text-small ${status === "error" ? "text-danger" : "text-ink-2"}`}>
                  {message}
                </p>
              )}
            </section>

            <section id="buy-usdc-section" aria-labelledby="buy-heading">
              <h2 id="buy-heading" className="kicker">
                Buy USDC with Crypto
              </h2>
              <p className="serif mb-6 mt-3 text-lead text-ink-2">
                Purchase USDC directly on Base Sepolia using crypto. This widget allows you to buy USDC with various payment methods.
              </p>
              <div className="flex justify-center">
                <BuyWidget client={client} chain={appChain} amount={100n * 1_000_000n} tokenAddress={baseUsdcContractAddress} />
              </div>
            </section>
          </div>

          <aside>
            <h2 className="kicker">How it works</h2>
            <ul className="mt-1 flex flex-col text-small text-ink-2 [&>li]:border-b [&>li]:border-dotted [&>li]:border-rule [&>li]:py-2.5">
              <li>Click the fake deposit button to get {FAKE_DEPOSIT_USDC.toLocaleString()} test USDC</li>
              <li>Funds are sent to your connected wallet on Base Sepolia</li>
              <li>You can use these funds to trade on any market</li>
              <li>Deposits are typically reflected within a few seconds</li>
            </ul>
          </aside>
        </div>
      </PageShell>
    </div>
  );
}
