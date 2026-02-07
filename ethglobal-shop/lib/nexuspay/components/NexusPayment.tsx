import { useState, useEffect } from 'react';
import type { NexusPaymentProps } from '../types';
import { ARC_TESTNET_CHAIN_ID, CCTP_CONTRACTS } from '../constants/contracts';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { useDirectPayment } from '../hooks/useDirectPayment';
import { useCCTPBridge } from '../hooks/useCCTPBridge';
import { styles } from './NexusPayment.styles';

const PaymentStepper = ({ currentStep, status }: { currentStep: string, status: string }) => {
  const getStepIndex = () => {
    if (status === 'success') return 3; // All done (PAID completed)
    if (status === 'error') return -1;
    if (status === 'approving') return 0; // APPROVE active
    if (currentStep.includes('Burning') || currentStep.includes('attestation') || currentStep.includes('Waiting') || currentStep.includes('Finalizing')) return 1; // TRANSFER active
    return 0;
  };

  const activeIndex = getStepIndex();
  const steps = ['APPROVE', 'TRANSFER', 'PAID'];

  return (
    <div style={styles.stepperContainer}>
       <style>
        {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
      </style>
      <div style={styles.stepperTrack}>
        {steps.map((label, index) => {
          // Logic:
          // isActive: currently processing this step.
          // isCompleted: checked off.
          
          let isActive = false;
          let isCompleted = false;

          if (index < activeIndex) {
             isCompleted = true;
          } else if (index === activeIndex) {
             isActive = true;
             // Special case: If index is last one 'PAID' (2), usually 'activeIndex' 2 means it's active.
             // But if status === 'success', getStepIndex returns 3.
             // So if index is 2 and activeIndex is 3, it's completed.
             // If getStepIndex is 2 (PAID active/processing?? No, paid is instant usually or final state).
             // Actually, 'PAID' shouldn't spin. It's the goal. 
             // If activeIndex is 3, everything is done.
          }
          
          // Refined logic:
          // 0 (APPROVE): active if index 0
          // 1 (TRANSFER): active if index 1
          // 2 (PAID): should never really be "spinning active" unless we consider "Finalizing" as part of Paid?
          // We mapped "Finalizing" to TRANSFER (index 1).
          // So PAID (index 2) only becomes COMPLETED when activeIndex becomes 3.
          
          return (
            <div key={label} style={styles.stepItem}>
              <div style={{
                ...styles.stepDot,
                ...(isActive ? styles.stepDotActive : {}),
                ...(isCompleted ? styles.stepDotCompleted : {}),
              }}>
                {isActive && <div style={styles.stepDotSpinner} />}
                {isCompleted && <span style={styles.checkmark}>✓</span>}
              </div>
              <span style={{
                ...styles.stepLabel,
                ...(isActive || isCompleted ? styles.stepLabelActive : {}),
              }}>{label}</span>
            </div>
          );
        })}
      </div>
      {/* Messages removed as requested */}
    </div>
  );
};

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
    amountLabel = 'PAYMENT AMOUNT',
    onSuccess,
    onError,
    onStatusChange,
    onClose,
    referralCampaignId,
    referrerAddress,
  } = props;

  // EVM Hooks
  const { address, chain } = useAccount();
  const chainId = useChainId();
  const directPayment = useDirectPayment();
  const cctpBridge = useCCTPBridge();

  const [inputAmount, setInputAmount] = useState<string>('');
  const [txHash, setTxHash] = useState<string | null>(null);

  // Active Logic Resolution
  const isDirectPayment = chainId === ARC_TESTNET_CHAIN_ID;
  
  let activeHook: any = cctpBridge;
  if (isDirectPayment) activeHook = directPayment;

  const currentStatus = activeHook.status;
  const currentError = activeHook.error;
  const isLoading = activeHook.isLoading;

  useEffect(() => {
    if (onStatusChange && currentStatus) {
      onStatusChange(currentStatus);
    }
  }, [currentStatus, onStatusChange]);

  const handlePayment = async () => {
    try {
      const amount = mode === 'fixed' ? fixedAmount! : parseUnits(inputAmount, 6);
      if (amount === 0n) throw new Error('Amount must be greater than 0');

      if (!address) throw new Error('Please connect your EVM wallet');
      
       const chainConfig = CCTP_CONTRACTS[chainId as keyof typeof CCTP_CONTRACTS];
       if (!chainConfig) throw new Error('Unsupported EVM chain');

      let resultTxHash: string;
      if (isDirectPayment) {
        resultTxHash = await directPayment.executePayment({
          amount,
          merchant: merchantAddress,
          orderId,
          usdcAddress: chainConfig.usdc,
          userAddress: address,
        });
      } else {
         const result = await cctpBridge.executePayment({
            amount,
            merchant: merchantAddress,
            orderId,
            sourceChainId: chainId,
            operatorPrivateKey,
            campaignId: referralCampaignId,
            referrer: referrerAddress as `0x${string}` | undefined,
         });
         resultTxHash = result.burnTxHash;
      }
      setTxHash(resultTxHash);
      onSuccess?.(resultTxHash, amount);

    } catch (err: any) {
      onError?.(err);
    }
  };

  const getWalletGradient = (addr: string) => {
    const seed = parseInt(addr.slice(0, 8), 16) || 0;
    const c1 = Math.floor(seed % 360);
    const c2 = Math.floor((seed / 360) % 360);
    return `linear-gradient(135deg, hsl(${c1}, 70%, 60%), hsl(${c2}, 70%, 60%))`;
  };

  return (
    <div className={`nexus-payment ${className}`} style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>N</div>
          <span style={styles.logoText}>NexusPay</span>
        </div>
      </div>
      
      {/* Wallet Connection Area */}
      <div style={{marginBottom: '24px', display: 'flex', justifyContent: 'center'}}>
          {address ? (
             <div style={styles.walletBadge}>
               <div style={{...styles.walletAvatar, background: getWalletGradient(address)}} />
               <span style={styles.walletAddress}>
                  {address.slice(0, 6)}...{address.slice(-4)}
               </span>
             </div>
          ) : (
            <div style={styles.disconnectedBadge}>EVM Wallet Not Connected</div>
          )}
      </div>

      <div style={styles.amountSection}>
        <label style={styles.label}>{amountLabel}</label>
        {mode === 'fixed' ? (
          <div style={styles.hugeDisplay}>
            {(Number(fixedAmount) / 1e6).toFixed(2)}
            <span style={styles.currencySymbol}>USDC</span>
          </div>
        ) : (
          <div style={styles.inputWrapper}>
             <span style={styles.currencyPrefix}>$</span>
             <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0.00"
              style={styles.hugeInput}
             />
             <span style={styles.currencySymbol}>USDC</span>
          </div>
        )}
      </div>

      {(activeHook.isLoading || currentStatus === 'success') && (
        <PaymentStepper 
          currentStep={activeHook.currentStep} 
          status={currentStatus} 
        />
      )}

      {currentError && (
        <div style={styles.errorBox}>
           ⚠️ {typeof currentError === 'string' ? currentError : currentError.message}
        </div>
      )}

      {currentStatus === 'success' && txHash && (
        <div style={styles.successBox}>
          ✅ Payment Successful!
           {chain?.blockExplorers?.default && (
              <a href={`${chain.blockExplorers.default.url}/tx/${txHash}`} 
                 target="_blank" rel="noreferrer" style={styles.link}>
                View Receipt
              </a>
           )}
        </div>
      )}

      <div style={styles.actionSection}>
         {chain && (
           <div style={styles.networkInfo}>
             <span style={styles.networkDot} />
             Running on {chain.name}
           </div>
         )}
         {currentStatus === 'success' && onClose ? (
           <button
             onClick={onClose}
             style={{
               ...styles.payButton,
               background: '#fff',
               color: '#111',
               border: '2px solid #e5e7eb',
             }}
           >
             Close
           </button>
         ) : (
           <button
             onClick={handlePayment}
             disabled={!address || isLoading}
             style={{
               ...styles.payButton,
               ...((!address || isLoading) ? styles.payButtonDisabled : {})
             }}
           >
             {isLoading ? (
               <span style={styles.loadingSpinner} /> 
             ) : (
               !address ? 'Connect Wallet' : (buttonText || 'Pay Now')
             )}
           </button>
         )}
      </div>
    </div>
  );
}

