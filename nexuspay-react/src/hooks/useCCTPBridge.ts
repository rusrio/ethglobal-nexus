import { useState } from 'react';
import { useWriteContract, usePublicClient, useWalletClient, useSwitchChain, useAccount } from 'wagmi';
import { encodePacked, keccak256, parseAbiParameters, encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { TOKEN_MESSENGER_ABI, USDC_ABI, NEXUS_VAULT_ABI } from '../constants/abis';
import { 
  CCTP_CONTRACTS, 
  NEXUS_VAULT_ADDRESS, 
  ARC_TESTNET_CHAIN_ID,
  NEXUS_PAY_RELAY_ADDRESS,
  NEXUS_PAY_RELAY_ABI 
} from '../constants/contracts';
import { waitForAttestation, addressToBytes32 } from '../utils/cctp';
import type { PaymentStatus } from '../types';

/**
 * Hook for cross-chain payments via CCTP with hooks
 */
export function useCCTPBridge() {
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const [status, setStatus] = useState<'idle' | 'approving' | 'burning' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string>('');
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

      setStatus('burning');
      setCurrentStep('Preparing hook data...');
      
      // Encode merchant and orderId into hookData (no Forwarding Service prefix needed)
      const hookData = encodeAbiParameters(
        parseAbiParameters('address, string'),
        [params.merchant, params.orderId]
      );

      setCurrentStep('Burning USDC on source chain...');

      const destinationDomain = CCTP_CONTRACTS[ARC_TESTNET_CHAIN_ID].domain;
      const mintRecipient = addressToBytes32(NEXUS_VAULT_ADDRESS);

      // Circle requires a minimum fee even for manual relay (~0.02 USDC)
      // This is the CCTP protocol fee, NOT Forwarding Service fee
      const protocolFee = 0n; // No fee for standard transfer
      const totalAmountToBurn = params.amount;

      const burnTxHash = await writeContractAsync({
        address: chainConfig.tokenMessenger,
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurnWithHook',
        args: [
          totalAmountToBurn, // Payment only
          destinationDomain,
          mintRecipient,
          chainConfig.usdc,
          '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // destinationCaller = 0
          protocolFee, // maxFee = 0
          1000, // minFinalityThreshold
          hookData, // merchant + orderId
        ],
        gas: 500000n, // Explicit gas limit to avoid Sepolia's 16.777M cap
      });

      console.log('Burn tx:', burnTxHash);

      setCurrentStep('Waiting for Circle attestation (~20 seconds)...');
      
      // Poll Circle API for attestation
      const sourceDomain = chainConfig.domain;
      const attestation = await pollForAttestation(burnTxHash, sourceDomain);
      
      if (!attestation) {
        throw new Error('Failed to get attestation from Circle');
      }

      setCurrentStep('Switching to Arc Testnet...');
      
      // Switch to Arc Test network before calling receiveMessage
      await switchChainAsync({ chainId: ARC_TESTNET_CHAIN_ID });

      setCurrentStep('Calling NexusPayRelay on Arc Testnet...');
      
      // Call relayPayment on NexusPayRelay (instead of MessageTransmitter directly)
      // This ensures both USDC mint AND hook execution happen atomically
      const receiveTxHash = await writeContractAsync({
        address: NEXUS_PAY_RELAY_ADDRESS,
        abi: NEXUS_PAY_RELAY_ABI,
        functionName: 'relayPayment',
        args: [attestation.message, attestation.attestation],
        chain: { id: ARC_TESTNET_CHAIN_ID } as any,
        gas: 500000n, // Explicit gas limit
      });

      console.log('Receive tx:', receiveTxHash);

      setStatus('success');
      setCurrentStep('Payment completed! Merchant balance updated on Arc.');
      
      return {
        burnTxHash,
        receiveTxHash,
        amount: params.amount,
      };
    } catch (error: any) {
      console.error('Bridge error:', error);
      setStatus('error');
      setCurrentStep(error.message || 'Transaction failed');
      setError(error.message || 'Unknown error');
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

// Poll Circle API for attestation
async function pollForAttestation(
  txHash: string,
  sourceDomain: number,
  maxAttempts = 20
): Promise<{ message: `0x${string}`; attestation: `0x${string}` } | null> {
  const apiUrl = `https://iris-api-sandbox.circle.com/v2/messages/${sourceDomain}?transactionHash=${txHash}`;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.messages?.length > 0) {
        const msg = data.messages[0];
        
        // Check that status is complete and we have valid hex data
        if (
          msg.status === 'complete' &&
          msg.attestation && 
          msg.message &&
          typeof msg.attestation === 'string' &&
          typeof msg.message === 'string' &&
          msg.attestation.startsWith('0x') &&
          msg.message.startsWith('0x') &&
          msg.attestation !== '0x' &&
          msg.message !== '0x' &&
          !msg.attestation.includes('PENDING') &&
          !msg.message.includes('PENDING')
        ) {
          return {
            message: msg.message as `0x${string}`,
            attestation: msg.attestation as `0x${string}`,
          };
        }
      }
    } catch (error) {
      console.log(`Attestation attempt ${i + 1}/${maxAttempts} failed, retrying...`);
    }
    
    // Wait 3 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  return null;
}
