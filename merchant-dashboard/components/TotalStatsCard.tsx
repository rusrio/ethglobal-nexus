'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { parseAbiItem, formatUnits } from 'viem';
import { NEXUS_VAULT_ADDRESS } from '../lib/contracts';

export function TotalStatsCard() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [totalVolume, setTotalVolume] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - 9000n > 0n ? currentBlock - 9000n : 0n;

        // Fetch PaymentReceived events for this merchant
        const logs = await publicClient.getLogs({
          address: NEXUS_VAULT_ADDRESS,
          event: parseAbiItem('event PaymentReceived(address indexed merchant, uint256 amount, string orderId)'),
          args: {
            merchant: address
          },
          fromBlock,
        });

        const total = logs.reduce((acc, log) => acc + (log.args.amount || 0n), 0n);
        setTotalVolume(total);

      } catch (err) {
        console.error("Error fetching total stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [address, publicClient]);

  if (!address) return null;

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 h-full flex flex-col justify-center transition hover:border-blue-500/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
           <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
           <p className="text-gray-400 text-sm font-medium">Total Lifetime Sales</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="h-12 bg-gray-800 rounded-lg animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white tracking-tight">
             {Number(formatUnits(totalVolume, 6)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xl font-medium text-gray-500">USDC</span>
        </div>
      )}
    </div>
  );
}
