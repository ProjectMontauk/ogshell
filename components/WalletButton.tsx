"use client";

import React from "react";
import { ConnectButton } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { base } from "thirdweb/chains";
import { client } from "../src/client";

// The wallet picker is the heaviest thing in the app (every wallet's connect flow, QR codes,
// the in-app auth). It lives in its own module so pages load without it and it arrives after
// first paint; see the dynamic imports in Navbar and the portfolio page.
const wallets = [
  inAppWallet({
    auth: { options: ["google", "apple", "email", "phone", "passkey"] as const },
    smartAccount: { chain: base, sponsorGas: true },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

const connectClass =
  "btn btn-outline !h-8 !min-w-0 !rounded-none !bg-transparent !px-3 !py-0 !text-small !font-medium !text-ink !shadow-[inset_0_0_0_1px_var(--ink)] hover:!bg-ink hover:!text-ground";
const detailsClass = "btn btn-outline !h-8 !min-w-0 !rounded-none !bg-transparent !px-3 !py-0 !text-small !text-ink !shadow-[inset_0_0_0_1px_var(--ink)]";

/** `large`: the in-page version, used where a page asks the reader to sign in. */
export default function WalletButton({ large = false }: { large?: boolean }) {
  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      connectButton={{ label: "Sign In", className: large ? "btn btn-primary btn-lg" : connectClass }}
      detailsButton={{ className: detailsClass }}
    />
  );
}
