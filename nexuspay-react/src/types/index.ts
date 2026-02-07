/**
 * Payment status enum
 */
export type PaymentStatus =
  | 'idle'
  | 'connecting'
  | 'approving'
  | 'burning'
  | 'attesting'
  | 'finalizing'
  | 'success'
  | 'error';

/**
 * Payment mode - fixed price or variable amount
 */
export type PaymentMode = 'fixed' | 'variable';

/**
 * CCTP attestation response from Circle API
 */
export interface AttestationResponse {
  status: 'pending' | 'complete';
  attestation?: string;
}

/**
 * Props for NexusPayment component
 */
export interface NexusPaymentProps {
  // Merchant configuration
  merchantAddress: `0x${string}`;
  orderId: string;

  // Operator wallet for payment finalization
  operatorPrivateKey: `0x${string}`;

  // Contract configuration
  vaultAddress?: `0x${string}`; // Default: NEXUS_VAULT_ADDRESS

  // Payment configuration
  mode?: PaymentMode; // Default: 'variable'
  amount?: bigint; // Required if mode='fixed'
  minAmount?: bigint; // Optional minimum for variable mode
  maxAmount?: bigint; // Optional maximum for variable mode

  // UI customization
  className?: string;
  buttonText?: string; // Default: "Pay" or "Donate"
  amountLabel?: string; // Default: "Amount"

  // Callbacks
  onSuccess?: (txHash: string, amount: bigint) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: PaymentStatus) => void;
  /** Optional callback when user closes the success view */
  onClose?: () => void;
  // Referral
  referralCampaignId?: number | bigint;
  referrerAddress?: string;
}

/**
 * Return type for useNexusPayment hook
 */
export interface UseNexusPaymentReturn {
  executePayment: (amount?: bigint) => Promise<void>;
  status: PaymentStatus;
  error: Error | null;
  isLoading: boolean;
  txHash: string | null;
}
