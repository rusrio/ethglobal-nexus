import { useState } from 'react';
import type { NexusPaymentProps } from '../types';
import { ARC_TESTNET_CHAIN_ID, CCTP_CONTRACTS } from '../constants/contracts';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { useDirectPayment } from '../hooks/useDirectPayment';
import { useCCTPBridge } from '../hooks/useCCTPBridge';

/**
 * NexusPayment Component
 * 
 * Cross-chain USDC payment component with CCTP integration.
 * Supports payments from Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia to Arc Testnet.
 */
export function NexusPayment(props: NexusPaymentProps) {
  const {
    merchantAddress,
    orderId,
    operatorPrivateKey,
    mode = 'variable',
    amount: fixedAmount,
    minAmount,
    maxAmount,
    className = '',
    buttonText,
    amountLabel = 'Amount (USDC)',
    onSuccess,
    onError,
    onStatusChange,
  } = props;

  const { address, chain } = useAccount();
  const chainId = useChainId();
  const [inputAmount, setInputAmount] = useState<string>('');
  const [txHash, setTxHash] = useState<string | null>(null);

  // Payment hooks
  const directPayment = useDirectPayment();
  const cctpBridge = useCCTPBridge();

  // Determine which payment method to use
  const isDirectPayment = chainId === ARC_TESTNET_CHAIN_ID;
  const activeHook = isDirectPayment ? directPayment : cctpBridge;

  // Update parent component when status changes
  const currentStatus = activeHook.status;
  const currentError = activeHook.error;

  const handlePayment = async () => {
    try {
      if (!address || !chain) {
        throw new Error('Please connect your wallet');
      }

      // Get amount
      const amount = mode === 'fixed' 
        ? fixedAmount! 
        : parseUnits(inputAmount, 6); // USDC has 6 decimals

      // Validate amount
      if (amount === 0n) {
        throw new Error('Amount must be greater than 0');
      }

      if (minAmount && amount < minAmount) {
        throw new Error(`Amount must be at least ${Number(minAmount) / 1e6} USDC`);
      }

      if (maxAmount && amount > maxAmount) {
        throw new Error(`Amount must not exceed ${Number(maxAmount) / 1e6} USDC`);
      }

      // Get USDC address for current chain
      const chainConfig = CCTP_CONTRACTS[chainId as keyof typeof CCTP_CONTRACTS];
      if (!chainConfig) {
        throw new Error('Unsupported chain. Please switch to a supported network.');
      }

      let resultTxHash: string;

      if (isDirectPayment) {
        // Direct payment on Arc Testnet
        resultTxHash = await directPayment.executePayment({
          amount,
          merchant: merchantAddress,
          orderId,
          usdcAddress: chainConfig.usdc,
          userAddress: address,
        });
      } else {
        // Cross-chain payment via CCTP
        const result = await cctpBridge.executePayment({
          amount,
          merchant: merchantAddress,
          orderId,
          sourceChainId: chainId,
          operatorPrivateKey,
        });
        resultTxHash = result.burnTxHash;
      }

      setTxHash(resultTxHash);
      onSuccess?.(resultTxHash, amount);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);
    }
  };

  // Notify parent of status changes
  if (onStatusChange && currentStatus) {
    onStatusChange(currentStatus);
  }

  // Get button state
  const isLoading = activeHook.isLoading;
  const isDisabled = !address || isLoading;
  const paymentType = isDirectPayment ? 'Direct' : 'Cross-chain';

  return (
    <div className={`nexus-payment ${className}`} style={defaultStyles.container}>
      <div className="nexus-payment-content" style={defaultStyles.content}>
        <h3 style={defaultStyles.title}>Payment</h3>
        
        {/* Amount Input/Display */}
        {mode === 'fixed' ? (
          <div className="amount-display" style={defaultStyles.amountDisplay}>
            <label style={defaultStyles.label}>{amountLabel}</label>
            <div className="fixed-amount" style={defaultStyles.fixedAmount}>
              {fixedAmount ? (Number(fixedAmount) / 1e6).toFixed(2) : '0.00'} USDC
            </div>
          </div>
        ) : (
          <div className="amount-input" style={defaultStyles.inputGroup}>
            <label htmlFor="amount" style={defaultStyles.label}>{amountLabel}</label>
            <div style={defaultStyles.inputWrapper}>
              <input
                id="amount"
                type="number"
                step="0.01"
                min={minAmount ? Number(minAmount) / 1e6 : 0}
                max={maxAmount ? Number(maxAmount) / 1e6 : undefined}
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0.00"
                style={defaultStyles.input}
              />
              <span className="currency" style={defaultStyles.currency}>USDC</span>
            </div>
          </div>
        )}

        {/* Chain Info */}
        <div className="chain-info" style={defaultStyles.chainInfo}>
          <small>
            {chain ? (
              <>
                <strong>{chain.name}</strong>
                <span style={defaultStyles.badge}>
                  {paymentType}
                </span>
              </>
            ) : (
              'Connect your wallet to continue'
            )}
          </small>
        </div>

        {/* Status Display */}
        {currentStatus && currentStatus !== 'idle' && currentStatus !== 'error' && (
          <div className="status-message" style={defaultStyles.statusMessage}>
            <div style={defaultStyles.spinner} />
            <span>
              {!isDirectPayment && cctpBridge.currentStep 
                ? cctpBridge.currentStep 
                : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1) + '...'}
            </span>
          </div>
        )}


        {/* Error Display */}
        {currentError && (
          <div className="error-message" style={defaultStyles.errorMessage}>
            {typeof currentError === 'string' ? currentError : currentError.message}
          </div>
        )}

        {/* Success Display */}
        {currentStatus === 'success' && txHash && (
          <div className="success-message" style={defaultStyles.successMessage}>
            Payment successful! 
            {chain?.blockExplorers?.default && (
              <a 
                href={`${chain.blockExplorers.default.url}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={defaultStyles.link}
              >
                View transaction
              </a>
            )}
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={isDisabled}
          className="payment-button"
          style={{
            ...defaultStyles.button,
            ...(isDisabled ? defaultStyles.buttonDisabled : {}),
          }}
        >
          {!address 
            ? 'Connect Wallet' 
            : isLoading 
            ? 'Processing...' 
            : (buttonText || (mode === 'fixed' ? 'Pay Now' : 'Send Payment'))}
        </button>
      </div>
    </div>
  );
}

// Default inline styles (can be overridden with className)
const defaultStyles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '400px',
    margin: '0 auto',
  } as React.CSSProperties,
  content: {
    padding: '24px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
  } as React.CSSProperties,
  title: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
  } as React.CSSProperties,
  amountDisplay: {
    marginBottom: '16px',
  } as React.CSSProperties,
  inputGroup: {
    marginBottom: '16px',
  } as React.CSSProperties,
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  } as React.CSSProperties,
  fixedAmount: {
    padding: '12px 16px',
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    textAlign: 'center',
  } as React.CSSProperties,
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '12px 70px 12px 16px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
  } as React.CSSProperties,
  currency: {
    position: 'absolute',
    right: '16px',
    color: '#6b7280',
    fontWeight: '500',
  } as React.CSSProperties,
  chainInfo: {
    marginBottom: '16px',
    padding: '8px 12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#4b5563',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  badge: {
    marginLeft: '8px',
    padding: '2px 8px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  statusMessage: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    color: '#1e40af',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  errorMessage: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#991b1b',
    fontSize: '14px',
  } as React.CSSProperties,
  successMessage: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    color: '#166534',
    fontSize: '14px',
  } as React.CSSProperties,
  link: {
    marginLeft: '8px',
    color: '#2563eb',
    textDecoration: 'underline',
  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  } as React.CSSProperties,
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid #bfdbfe',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
};
