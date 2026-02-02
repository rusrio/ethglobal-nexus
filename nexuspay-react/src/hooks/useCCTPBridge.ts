import { useState } from 'react';
import { useWriteContract, usePublicClient, useWalletClient } from 'wagmi';
import { encodePacked, keccak256, parseAbiParameters, encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { TOKEN_MESSENGER_ABI, USDC_ABI, NEXUS_VAULT_ABI } from '../constants/abis';
import { CCTP_CONTRACTS, NEXUS_VAULT_ADDRESS, ARC_TESTNET_CHAIN_ID } from '../constants/contracts';
import { waitForAttestation, addressToBytes32 } from '../utils/cctp';
import type { PaymentStatus } from '../types';

/**
 * Hook for cross-chain payments via CCTP with hooks
 */
export function useCCTPBridge() {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const executePayment = async (params: {
    amount: bigint;
    merchant: `0x${string}`;
    orderId: string;
    sourceChainId: number;
    operatorPrivateKey: `0x${string}`;
  }) => {
    try {
      setError(null);
      const chainConfig = CCTP_CONTRACTS[params.sourceChainId as keyof typeof CCTP_CONTRACTS];
      
      if (!chainConfig) {
        throw new Error(`Unsupported chain: ${params.sourceChainId}`);
      }

      setStatus('approving');
      setCurrentStep('Approving USDC...');
      
      const approveTxHash = await writeContractAsync({
        address: chainConfig.usdc,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [chainConfig.tokenMessenger, params.amount],
      });

      console.log('Approval tx:', approveTxHash);

      setCurrentStep('Preparing hook data...');
      
      const hookData = encodeAbiParameters(
        parseAbiParameters('address, string'),
        [params.merchant, params.orderId]
      );

      setStatus('burning');
      setCurrentStep('Burning USDC on source chain...');

      const destinationDomain = CCTP_CONTRACTS[ARC_TESTNET_CHAIN_ID].domain;
      const mintRecipient = addressToBytes32(NEXUS_VAULT_ADDRESS);
      const destinationCaller = addressToBytes32(NEXUS_VAULT_ADDRESS); // Only NexusVault can receive

      const burnTxHash = await writeContractAsync({
        address: chainConfig.tokenMessenger,
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurnWithHook',
        args: [
          params.amount,
          destinationDomain,
          mintRecipient,
          chainConfig.usdc,
          destinationCaller,
          hookData,
        ],
      });

      console.log('Burn tx:', burnTxHash);

      setCurrentStep('Fetching transaction receipt...');
      
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: burnTxHash,
        confirmations: 1,
      });

      setStatus('attesting');
      setCurrentStep('Waiting for Circle attestation (~20 seconds)...');

      // For CCTP, we need to extract the message from logs
      // The MessageSent event contains the message bytes
      // For simplicity, we'll use the messageHash which is the tx hash
      const messageHash = burnTxHash;

      const attestation = await waitForAttestation(messageHash);
      console.log('Attestation received');

      // Step 6: Finalize payment on Arc Testnet using operator wallet
      setStatus('finalizing');
      setCurrentStep('Finalizing payment on Arc Testnet...');

      // Create operator wallet client
      const operatorAccount = privateKeyToAccount(params.operatorPrivateKey);
      
      // Get Arc Testnet public client
      const arcPublicClient = await import('viem').then(m => 
        m.createPublicClient({
          chain: {
            id: ARC_TESTNET_CHAIN_ID,
            name: 'Arc Testnet',
            network: 'arc-testnet',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.ARC_TESTNET_RPC_URL || ''] },
              public: { http: [process.env.ARC_TESTNET_RPC_URL || ''] },
            },
          },
          transport: m.http(),
        })
      );

      const arcWalletClient = await import('viem').then(m =>
        m.createWalletClient({
          account: operatorAccount,
          chain: {
            id: ARC_TESTNET_CHAIN_ID,
            name: 'Arc Testnet',
            network: 'arc-testnet',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.ARC_TESTNET_RPC_URL || ''] },
              public: { http: [process.env.ARC_TESTNET_RPC_URL || ''] },
            },
          },
          transport: m.http(),
        })
      );

      // Extract message bytes from receipt
      // In production, you'd parse the MessageSent event properly
      // For now, we'll construct it based on the burn transaction
      const message = receipt.logs[0]?.data || '0x';

      // Call handleCctpPayment on NexusVault
      const finalizeTxHash = await arcWalletClient.writeContract({
        address: NEXUS_VAULT_ADDRESS,
        abi: NEXUS_VAULT_ABI,
        functionName: 'handleCctpPayment',
        args: [message as `0x${string}`, attestation as `0x${string}`],
      });

      console.log('Finalize tx:', finalizeTxHash);

      setStatus('success');
      setCurrentStep('Payment successful!');
      
      return finalizeTxHash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('CCTP payment failed');
      setError(error);
      setStatus('error');
      setCurrentStep('Payment failed');
      throw error;
    }
  };

  return {
    executePayment,
    status,
    error,
    currentStep,
    isLoading: status !== 'idle' && status !== 'success' && status !== 'error',
  };
}
