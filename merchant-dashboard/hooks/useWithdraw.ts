'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { NEXUS_VAULT_ADDRESS, NEXUS_VAULT_ABI } from '@/lib/contracts';
import { parseUnits } from 'viem';

export function useWithdraw() {
  const { writeContractAsync, data: hash } = useWriteContract();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdraw = async (amountUSDC: number) => {
    setIsWithdrawing(true);
    setError(null);

    try {
      // Convert USDC to wei (6 decimals)
      const amount = parseUnits(amountUSDC.toString(), 6);

      const txHash = await writeContractAsync({
        address: NEXUS_VAULT_ADDRESS,
        abi: NEXUS_VAULT_ABI,
        functionName: 'withdraw',
        args: [amount],
      });

      return txHash;
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
      throw err;
    } finally {
      setIsWithdrawing(false);
    }
  };

  return {
    withdraw,
    isWithdrawing,
    isSuccess,
    error,
    hash,
  };
}
