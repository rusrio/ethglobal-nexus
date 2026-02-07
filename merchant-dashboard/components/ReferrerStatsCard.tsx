'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { parseAbiItem, formatUnits } from 'viem';
import { NEXUS_VAULT_ADDRESS } from '../lib/contracts';

export function ReferrerStatsCard() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [totalRewards, setTotalRewards] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - 9000n > 0n ? currentBlock - 9000n : 0n;

        // Fetch RewardPaid events where referrer is the current user
        const logs = await publicClient.getLogs({
          address: NEXUS_VAULT_ADDRESS,
          event: parseAbiItem('event RewardPaid(uint256 indexed campaignId, address indexed referrer, uint256 amount)'),
          args: {
            referrer: address
          },
          fromBlock,
        });

        const total = logs.reduce((acc, log) => acc + (log.args.amount || 0n), 0n);
        setTotalRewards(total);

      } catch (err) {
        console.error("Error fetching referral stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [address, publicClient]);

  if (!address) return null;

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 h-full flex flex-col justify-center transition hover:border-green-500/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
           <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
           <p className="text-gray-400 text-sm font-medium">Total Rewards Earned</p>
           <p className="text-xs text-green-400/80">From Referrals</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="h-12 bg-gray-800 rounded-lg animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white tracking-tight">
             {Number(formatUnits(totalRewards, 6)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xl font-medium text-gray-500">USDC</span>
        </div>
      )}
    </div>
  );
}
