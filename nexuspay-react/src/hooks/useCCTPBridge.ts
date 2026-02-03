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

      // Circle requires a minimum fee for fast attestation (~0.02 USDC)
      // This fee is mandatory to avoid "insufficient_fee" delay
      // The fee will be deducted in NexusVault before crediting merchant
      const protocolFee = 20000n; // 0.02 USDC
      const totalAmountToBurn = params.amount + protocolFee;

      const burnTxHash = await writeContractAsync({
        address: chainConfig.tokenMessenger,
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurnWithHook',
        args: [
          totalAmountToBurn, // Payment + protocol fee
          destinationDomain,
          mintRecipient,
          chainConfig.usdc,
          '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // destinationCaller = 0
          protocolFee, // maxFee for Circle protocol fee
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

      setCurrentStep('Finalizing payment on Arc (automatic)...');
      
      // Automatic relay using operator wallet (no user interaction needed)
      // User doesn't need Arc Testnet in their wallet - merchant pays the gas
      const operatorPrivateKey = params.operatorPrivateKey;
      
      if (!operatorPrivateKey || operatorPrivateKey === '0x') {
        throw new Error('Operator private key not configured');
      }

      // Create operator account from private key
      const operatorAccount = privateKeyToAccount(operatorPrivateKey);
      
      // Create wallet client for Arc Testnet with operator account
      const { createWalletClient, http } = await import('viem');
      const arcWalletClient = createWalletClient({
        account: operatorAccount,
        chain: {
          id: ARC_TESTNET_CHAIN_ID,
          name: 'Arc Testnet',
          network: 'arc-testnet',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://rpc.testnet.arc.network'] },
            public: { http: ['https://rpc.testnet.arc.network'] },
          },
        } as any,
        transport: http('https://rpc.testnet.arc.network'),
      });

      // Call relayPayment on NexusPayRelay (merchant/operator pays Arc gas)
      const receiveTxHash = await arcWalletClient.writeContract({
        address: NEXUS_PAY_RELAY_ADDRESS,
        abi: NEXUS_PAY_RELAY_ABI,
        functionName: 'relayPayment',
        args: [attestation.message, attestation.attestation],
        gas: 500000n,
      });

      console.log('Receive tx:', receiveTxHash);

      setStatus('success');
      setCurrentStep('Payment completed! Merchant balance updated automatically.');
      
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
