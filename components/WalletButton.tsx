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
  "btn btn-primary !h-full !min-h-0 !min-w-0 !rounded-none !bg-ink !px-4 !py-0 !text-small !font-normal !text-ground hover:!opacity-85";
const detailsClass = "btn btn-outline !h-full !min-h-0 !min-w-0 !rounded-none !border-0 !border-l !border-ink !bg-transparent !px-4 !py-0 !text-small !text-ink !shadow-none";

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
