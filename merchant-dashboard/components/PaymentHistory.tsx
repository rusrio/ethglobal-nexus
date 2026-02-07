'use client';

import { useEffect, useState } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { parseAbiItem, formatUnits } from 'viem';
import { NEXUS_VAULT_ADDRESS, NEXUS_VAULT_ABI } from '@/lib/contracts';

interface Payment {
  orderId: string;
  amount: string;
  timestamp: number;
  txHash: string;
  blockNumber: bigint;
}

export function PaymentHistory() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!publicClient || !address) return;

    const fetchPayments = async () => {
      try {
        // Get current block number
        const currentBlock = await publicClient.getBlockNumber();
        
        // Arc Testnet RPC limits eth_getLogs to 10,000 blocks
        // Search from current block minus 10,000 (or 0 if less than 10,000)
        const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;

        const logs = await publicClient.getLogs({
          address: NEXUS_VAULT_ADDRESS,
          event: parseAbiItem('event CCTPPaymentProcessed(address indexed merchant, uint256 amount, string orderId, bytes32 messageHash)'),
          args: { merchant: address },
          fromBlock,
          toBlock: 'latest' as any,
        });

        const paymentsData = await Promise.all(
          logs.map(async (log) => {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber! });
            return {
              orderId: log.args.orderId || 'Unknown',
              amount: formatUnits(log.args.amount || 0n, 6),
              timestamp: Number(block.timestamp),
              txHash: log.transactionHash || '',
              blockNumber: log.blockNumber!,
            };
          })
        );

        setPayments(paymentsData.sort((a, b) => b.timestamp - a.timestamp));
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [publicClient, address]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6">Payment History</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6">Payment History</h2>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-800 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400">No payments received yet</p>
          <p className="text-gray-600 text-sm mt-1">Payments will appear here once customers make purchases</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Payment History</h2>
        <span className="text-sm text-gray-400">{payments.length} transaction{payments.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-800">
              <th className="pb-3 text-sm font-medium text-gray-400">Date</th>
              <th className="pb-3 text-sm font-medium text-gray-400">Order ID</th>
              <th className="pb-3 text-sm font-medium text-gray-400 text-right">Amount</th>
              <th className="pb-3 text-sm font-medium text-gray-400">Transaction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {payments.map((payment, idx) => (
              <tr key={idx} className="group hover:bg-gray-800/30 transition-colors">
                <td className="py-4 text-sm text-gray-300">{formatDate(payment.timestamp)}</td>
                <td className="py-4">
                  <span className="text-sm font-mono text-white bg-gray-800 px-2 py-1 rounded">
                    #{payment.orderId}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <span className="text-sm font-semibold text-green-400">
                    +{parseFloat(payment.amount).toFixed(2)} USDC
                  </span>
                </td>
                <td className="py-4">
                  <a
                    href={`https://testnet.arcscan.net/tx/${payment.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 group-hover:underline"
                  >
                    <span className="font-mono">{payment.txHash.slice(0, 6)}...{payment.txHash.slice(-4)}</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
