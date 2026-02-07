# @nexuspay/react

**The Premium Cross-Chain Payment Component for EVM & Solana.**

Accept USDC payments from any chain seamlessly. Integrated with Circle CCTP for native cross-chain transfers and Nexus Vault for direct settlement.

## Features

- **Cross-Chain Ready**: Accept USDC from Ethereum, Base, Arbitrum, Optimism, and more via Circle CCTP.
- **Direct Integration**: Native support for Arc Testnet (Nexus Chain) direct payments.
- **Premium UI**: Beautiful, responsive payment modal with built-in progress stepper.
- **Secure**: Non-custodial, client-side transaction signing.
- **Plug & Play**: simple React component implementation.

## Installation

Install the package and its peer dependencies:

```bash
npm install @nexuspay/react wagmi viem @tanstack/react-query
# or
pnpm add @nexuspay/react wagmi viem @tanstack/react-query
# or
yarn add @nexuspay/react wagmi viem @tanstack/react-query
```

## Setup

Ensure your application is wrapped with `WagmiProvider` and `QueryClientProvider` as usual for any Wagmi-based dApp.

## Usage

Import and use the `NexusPayment` component:

```tsx
import { NexusPayment } from '@nexuspay/react';
import { useAccount } from 'wagmi';

function Checkout() {
  const { address } = useAccount();

  return (
    <NexusPayment
      // Merchant Configuration
      merchantAddress="0xYourMerchantAddressHere"
      orderId={`ORDER-${Date.now()}`}
      
      // Payment Amount (in USDC atomic units, eg. 1000000 = 1 USDC)
      amount={1000000n} 
      mode="fixed" // or 'variable' to let user type amount
      
      // Operator Wallet (for CCTP relaying on destination)
      // In production, this should be handled by a backend service, 
      // but provided here for serverless/demo implementations.
      operatorPrivateKey={process.env.NEXT_PUBLIC_OPERATOR_KEY}
      
      // Callbacks
      onSuccess={(txHash, amount) => {
        console.log('Payment success:', txHash);
      }}
      onClose={() => {
        console.log('User closed the modal');
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
      }}
    />
  );
}
```

## API Reference

### `NexusPaymentProps`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `merchantAddress` | `0x${string}` | Yes | Destination address for the merchant on Arc Testnet. |
| `orderId` | `string` | Yes | Unique identifier for the order/invoice. |
| `amount` | `bigint` | Yes* | Amount in USDC atomic units (6 decimals). *Required if mode is 'fixed'. |
| `mode` | `'fixed' \| 'variable'` | No | Default: `'variable'`. In variable mode, user inputs amount. |
| `operatorPrivateKey` | `0x${string}` | Yes | Private key of the operator wallet to relay the CCTP message on the destination chain. |
| `onSuccess` | `(tx, amount) => void` | No | Callback fired when payment is confirmed. |
| `onClose` | `() => void` | No | Callback fired when user clicks "Close" after success. |
| `onError` | `(error) => void` | No | Callback fired on failure. |
| `buttonText` | `string` | No | Custom text for the pay button (default: "Pay Now"). |
| `className` | `string` | No | Additional CSS classes for the container. |

## Supported Networks

- **Arc Testnet** (Direct Settlement)
- **Sepolia** (via CCTP)
- **Base Sepolia** (via CCTP)
- **Arbitrum Sepolia** (via CCTP)
You can add any network supported by Circle CCTP.

## License

MIT
