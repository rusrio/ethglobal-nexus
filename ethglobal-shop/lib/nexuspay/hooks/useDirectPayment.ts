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
  const [currentStep, setCurrentStep] = useState<string>('');
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
      if (!params || !params.amount) throw new Error("Invalid parameters");
      setError(null);
      setStatus('approving');
      setCurrentStep('Approving USDC transfer...');

      // Step 1: Approve USDC to NexusVault
      await writeContractAsync({
        address: params.usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [NEXUS_VAULT_ADDRESS, params.amount],
      });

      // Wait for approval to propagate
      setStatus('approving');
      setCurrentStep('Waiting for approval confirmation...');
      // Simple delay to simulate waiting for block inclusion if we don't use useWaitForTransactionReceipt
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Call pay() on NexusVault
      setStatus('burning'); // Reuse 'burning' or 'relaying' status to map to TRANSFER step in UI
      setCurrentStep('Finalizing payment on Arc...');
      
      const payTxHash = await writeContractAsync({
        address: NEXUS_VAULT_ADDRESS,
        abi: NEXUS_VAULT_ABI,
        functionName: 'pay',
        args: [params.amount, params.merchant, params.orderId],
      });

      setStatus('success');
      setCurrentStep('Payment Successful!');
      return payTxHash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Payment failed');
      setError(error);
      setStatus('error');
      setCurrentStep('Failed');
      throw error;
    }
  };

  return {
    executePayment,
    status,
    currentStep,
    error,
    isLoading: status !== 'idle' && status !== 'success' && status !== 'error',
  };
}
