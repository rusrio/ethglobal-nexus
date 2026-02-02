# @nexuspay/react

Cross-chain USDC payment component with Circle CCTP integration.

## Installation

```bash
npm install @nexuspay/react wagmi viem
# or
pnpm add @nexuspay/react wagmi viem
```

## Quick Start

```tsx
import { NexusPayment } from '@nexuspay/react';

function App() {
  return (
    <NexusPayment
      merchantAddress="0xYourAddress"
      orderId="ORDER-123"
      operatorPrivateKey={process.env.OPERATOR_PRIVATE_KEY}
      amount={1000000n} // 1 USDC (6 decimals)
      onSuccess={(txHash) => console.log('Payment successful!', txHash)}
    />
  );
}
```

## Documentation

See [implementation_plan.md](../foundry/DEPLOYMENT_GUIDE.md) for detailed documentation.

## License

MIT
