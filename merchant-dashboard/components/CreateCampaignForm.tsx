'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { NEXUS_VAULT_ADDRESS, NEXUS_VAULT_ABI } from '../lib/contracts';

export function CreateCampaignForm() {
  const [referrerPct, setReferrerPct] = useState<string>('');
  const [rewardLimit, setRewardLimit] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referrerPct || !rewardLimit) return;

    try {
      await writeContract({
        address: NEXUS_VAULT_ADDRESS,
        abi: NEXUS_VAULT_ABI,
        functionName: 'createReferralCampaign',
        args: [
          BigInt(referrerPct), // Percentage (e.g. 10 for 10%)
          parseUnits(rewardLimit, 6) // Limit in USDC (6 decimals)
        ],
      });
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setReferrerPct('');
    setRewardLimit('');
    setIsModalOpen(false);
  };

  if (isSuccess && isModalOpen) {
    // Optionally close modal automatically or show success message there
    // For now keeping it simple
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        New Campaign
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={resetForm}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Create Referral Campaign</h3>
            <p className="text-gray-400 text-sm mb-6">Incentivize referrers to drive sales.</p>

            {isSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Campaign Created!</h4>
                <p className="text-gray-400 mb-6">Your campaign is now active on the blockchain.</p>
                <div className="bg-gray-800 rounded-lg p-3 mb-6 break-all">
                  <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
                  <p className="text-sm text-blue-400 font-mono">{hash}</p>
                </div>
                <button
                  onClick={resetForm}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Referral Fee (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={referrerPct}
                      onChange={(e) => setReferrerPct(e.target.value)}
                      placeholder="10"
                      min="1"
                      max="100"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    />
                    <span className="absolute right-4 top-3.5 text-gray-500">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Percentage of each sale paid to the referrer.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Total Reward Limit (USDC)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={rewardLimit}
                      onChange={(e) => setRewardLimit(e.target.value)}
                      placeholder="1000"
                      min="1"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    />
                    <span className="absolute right-4 top-3.5 text-gray-500">USDC</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Campaign pauses automatically when this limit is reached.</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {(error as any).shortMessage || error.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending || isConfirming}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending || isConfirming ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isPending ? 'Confirm in Wallet...' : 'Creating...'}
                    </>
                  ) : (
                    'Create Campaign'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
