import * as react_jsx_runtime from 'react/jsx-runtime';

/**
 * Payment status enum
 */
type PaymentStatus = 'idle' | 'connecting' | 'approving' | 'burning' | 'attesting' | 'finalizing' | 'success' | 'error';
/**
 * Payment mode - fixed price or variable amount
 */
type PaymentMode = 'fixed' | 'variable';
/**
 * Props for NexusPayment component
 */
interface NexusPaymentProps {
    merchantAddress: `0x${string}`;
    orderId: string;
    operatorPrivateKey: `0x${string}`;
    vaultAddress?: `0x${string}`;
    mode?: PaymentMode;
    amount?: bigint;
    minAmount?: bigint;
    maxAmount?: bigint;
    className?: string;
    buttonText?: string;
    amountLabel?: string;
    onSuccess?: (txHash: string, amount: bigint) => void;
    onError?: (error: Error) => void;
    onStatusChange?: (status: PaymentStatus) => void;
}

/**
 * NexusPayment Component
 *
 * Cross-chain USDC payment component with CCTP integration.
 * Supports payments from Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia to Arc Testnet.
 */
declare function NexusPayment(props: NexusPaymentProps): react_jsx_runtime.JSX.Element;

/**
 * NexusVault contract address on Arc Testnet
 */
declare const NEXUS_VAULT_ADDRESS: `0x${string}`;
/**
 * Arc Testnet chain ID
 */
declare const ARC_TESTNET_CHAIN_ID = 5042002;

export { ARC_TESTNET_CHAIN_ID, NEXUS_VAULT_ADDRESS, NexusPayment, type NexusPaymentProps };
