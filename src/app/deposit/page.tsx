"use client";

import { useEffect } from "react";
import { BuyWidget } from "thirdweb/react";
import { base } from "thirdweb/chains";
import Navbar from "../../../components/Navbar";
import PageShell from "@/components/ui/PageShell";
import { client } from "../../client";
import { baseUsdcContractAddress } from "../../../constants/contracts";

export default function DepositPage() {
  useEffect(() => {
    if (window.location.hash === "#buy-usdc-section") {
      setTimeout(() => {
        document.getElementById("buy-usdc-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, []);

  return (
    <div>
      <Navbar />
      <PageShell width="medium" title="Deposit" note="Add USDC on Base to your wallet to start trading">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-6">
            <section id="buy-usdc-section" aria-labelledby="buy-heading">
              <h2 id="buy-heading" className="kicker">
                Buy USDC with Crypto
              </h2>
              <p className="serif mb-6 mt-3 text-lead text-ink-2">
                Purchase USDC directly on Base using crypto. This widget allows you to buy USDC with various payment methods.
              </p>
              <div className="flex justify-center">
                <BuyWidget client={client} chain={base} amount={100n * 1_000_000n} tokenAddress={baseUsdcContractAddress} />
              </div>
            </section>
          </div>

          <aside>
            <h2 className="kicker">How it works</h2>
            <ul className="mt-1 flex flex-col text-small text-ink-2 [&>li]:border-b [&>li]:border-dotted [&>li]:border-rule [&>li]:py-2.5">
              <li>Buy USDC with crypto using the widget above</li>
              <li>Funds are sent to your connected wallet on Base</li>
              <li>You can use these funds to trade on any market</li>
              <li>Purchases are typically reflected within a few seconds</li>
            </ul>
          </aside>
        </div>
      </PageShell>
    </div>
  );
}
