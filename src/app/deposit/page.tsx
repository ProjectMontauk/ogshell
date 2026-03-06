'use client';

import { useEffect } from 'react';
import { BuyWidget, useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { prepareContractCall } from 'thirdweb';
import { base } from 'thirdweb/chains';
import Navbar from '../../../components/Navbar';
import { client } from '../../client';
import { tokenContract } from '../../../constants/contracts';

export default function DepositPage() {
  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();

  const handleMintTestTokens = () => {
    if (!account?.address) return;

    const transaction = prepareContractCall({
      contract: tokenContract,
      method: "function mint(address account, uint256 amount)",
      params: [account.address, BigInt("10000000000000000000000")],
    });

    sendTransaction(transaction);
  };

  // Handle hash-based scrolling to Buy USDC section
  useEffect(() => {
    if (window.location.hash === '#buy-usdc-section') {
      setTimeout(() => {
        const element = document.getElementById('buy-usdc-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, []);

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Deposit</h1>
            <p className="text-gray-600 mb-8">Add funds to your account to start trading</p>

            {/* Mint test tokens */}
            <div className="mb-6">
              <button
                onClick={handleMintTestTokens}
                disabled={!account?.address}
                className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mint 10,000 test tokens
              </button>
            </div>

            {/* Buy USDC with Crypto */}
            <div id="buy-usdc-section" className="mb-6 mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Buy USDC with Crypto</h3>
              <p className="text-gray-600 text-sm mb-4">
                Purchase USDC directly on Base using crypto. This widget allows you to buy USDC with various payment methods.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex justify-center">
                <BuyWidget
                  client={client}
                  chain={base}
                  amount={(100n).toString()} // 100 USDC (6 decimals)
                  tokenAddress="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // USDC on Base
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How it works</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Buy USDC with crypto using the widget above</p>
                <p>• Funds will be deposited to your account and added to your balance</p>
                <p>• You can use these funds to trade on any market</p>
                <p>• Deposits are typically processed within a few seconds</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}