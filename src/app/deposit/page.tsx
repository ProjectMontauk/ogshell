'use client';

import { useEffect } from 'react';
import { BuyWidget } from 'thirdweb/react';
import { base } from 'thirdweb/chains';
import Navbar from '../../../components/Navbar';
import { client } from '../../client';
import { baseUsdcContractAddress } from '../../../constants/contracts';

export default function DepositPage() {
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
            <p className="text-gray-600 mb-8">Add USDC on Base to your wallet to start trading</p>

            {/* Buy USDC with Crypto */}
            <div id="buy-usdc-section" className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Buy USDC with Crypto</h3>
              <p className="text-gray-600 text-sm mb-4">
                Purchase USDC directly on Base using crypto. This widget allows you to buy USDC with various payment methods.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex justify-center">
                <BuyWidget
                  client={client}
                  chain={base}
                  amount={100n * 1_000_000n}
                  tokenAddress={baseUsdcContractAddress}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How it works</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Buy USDC with crypto using the widget above</p>
                <p>• Funds are sent to your connected wallet on Base</p>
                <p>• You can use these funds to trade on any market</p>
                <p>• Purchases are typically reflected within a few seconds</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
