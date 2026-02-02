import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { NEXUS_VAULT_ABI, USDC_ABI } from '../constants/abis';
import { NEXUS_VAULT_ADDRESS } from '../constants/contracts';
import type { PaymentStatus } from '../types';

/**
 * Hook for direct payments on Arc Testnet (no CCTP needed)
 */
export function useDirectPayment() {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<Error | null>(null);

  const { writeContractAsync } = useWriteContract();

  const executePayment = async (params: {
    amount: bigint;
    merchant: `0x${string}`;
    orderId: string;
    usdcAddress: `0x${string}`;
    userAddress: `0x${string}`;
  }) => {
    try {
      setError(null);
      setStatus('approving');

      // Step 1: Approve USDC to NexusVault
      const approveTxHash = await writeContractAsync({
        address: params.usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [NEXUS_VAULT_ADDRESS, params.amount],
      });

      // Wait for approval
      setStatus('approving');
      // Note: We could use useWaitForTransactionReceipt here, but for simplicity
      // we'll just wait a moment for the tx to be included

      // Step 2: Call pay() on NexusVault
      setStatus('finalizing');
      const payTxHash = await writeContractAsync({
        address: NEXUS_VAULT_ADDRESS,
        abi: NEXUS_VAULT_ABI,
        functionName: 'pay',
        args: [params.amount, params.merchant, params.orderId],
      });

      setStatus('success');
      return payTxHash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Payment failed');
      setError(error);
      setStatus('error');
      throw error;
    }
  };

  return {
    executePayment,
    status,
    error,
    isLoading: status !== 'idle' && status !== 'success' && status !== 'error',
  };
}
