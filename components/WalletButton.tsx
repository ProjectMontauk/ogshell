"use client";

import React from "react";
import { ConnectButton } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { client } from "../src/client";
import { appChain, baseUsdcContractAddress } from "../constants/contracts";

// The wallet picker is the heaviest thing in the app (every wallet's connect flow, QR codes,
// the in-app auth). It lives in its own module so pages load without it and it arrives after
// first paint; see the dynamic imports in Navbar and the portfolio page.
const wallets = [
  inAppWallet({
    auth: { options: ["google", "apple", "email", "phone", "passkey"] as const },
    smartAccount: { chain: appChain, sponsorGas: true },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

const connectClass =
  "btn btn-primary !h-full !min-h-0 !min-w-0 !rounded-none !bg-ink !px-4 !py-0 !text-small !font-normal !text-ground hover:!opacity-85";
const detailsClass = "btn btn-outline !h-full !min-h-0 !min-w-0 !rounded-none !border !border-ink !bg-transparent !px-4 !py-0 !text-small !text-ink !shadow-none";

/** `large`: the in-page version, used where a page asks the reader to sign in. */
export default function WalletButton({ large = false }: { large?: boolean }) {
  return (
    <ConnectButton
      client={client}
      chain={appChain}
      wallets={wallets}
      connectButton={{ label: "Sign In", className: large ? "btn btn-primary btn-lg" : connectClass }}
      detailsButton={{
        className: detailsClass,
        // Show MockUSDC instead of native ETH in the connected wallet chip.
        displayBalanceToken: {
          [appChain.id]: baseUsdcContractAddress,
        },
      }}
      supportedTokens={{
        [appChain.id]: [
          {
            address: baseUsdcContractAddress,
            name: "Mock USDC",
            symbol: "USDC",
          },
        ],
      }}
    />
  );
}
