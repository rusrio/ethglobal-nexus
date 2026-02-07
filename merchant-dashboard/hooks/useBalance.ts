'use client';

import { useReadContract, useAccount } from 'wagmi';
import { NEXUS_VAULT_ADDRESS, NEXUS_VAULT_ABI } from '@/lib/contracts';

export function useBalance() {
  const { address } = useAccount();
  
  const { data: balance, isLoading, refetch } = useReadContract({
    address: NEXUS_VAULT_ADDRESS,
    abi: NEXUS_VAULT_ABI,
    functionName: 'merchantBalances',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refresh every 5 seconds
    },
  });

  // Convert from wei (6 decimals) to USDC
  const balanceUSDC = balance ? Number(balance) / 1_000_000 : 0;

  return {
    balance: balanceUSDC,
    rawBalance: balance,
    isLoading,
    refetch,
  };
}
