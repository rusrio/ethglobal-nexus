'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect } from 'react';

const MERCHANT_ADDRESS = process.env.NEXT_PUBLIC_MERCHANT_ADDRESS?.toLowerCase();

interface AuthGuardProps {
  children: React.ReactNode;
  requireMerchant?: boolean;
}

export function AuthGuard({ children, requireMerchant = true }: AuthGuardProps) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Removed auto-disconnect to allow non-merchant users to stay connected
  // and view allowed pages (like Referrals)

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-800 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Merchant Access Required</h1>
            <p className="text-gray-400 mb-6">
              Connect your merchant wallet to access the dashboard
            </p>
            
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (requireMerchant && address?.toLowerCase() !== MERCHANT_ADDRESS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-red-800/50 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-red-500/20 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-gray-400 mb-6">
              This area is restricted to authorized merchant wallets only.
            </p>
            <button
              onClick={() => disconnect()}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
