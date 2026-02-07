# Nexus

This repository contains the complete codebase for **Nexus**, a simplified cross-chain payment solution that allows merchants to accept USDC on any chain and settle instantly on the **Arc Testnet**.

## Project Structure

This repository is organized into four main components:

### 1. Payment SDK (`/nexuspay-react`)
The core React library that powers the checkout experience.
- **Purpose**: Provides the `<NexusPayment />` component for easy integration.
- **Features**: Cross-chain USDC payments (Circle CCTP), direct payments on Arc, and a polished UI.
- **Usage**: Typically installed via npm (e.g., `@nexuspay/react`). *(Note: Not published to npm for this MVP. Install manually or use the local reference).*

### 2. Demo Store (`/ethglobal-shop`)
An example e-commerce application demonstrating the SDK integration.
- **Purpose**: Showcase how a merchant would integrate NexusPay.
- **Stack**: Next.js, Tailwind CSS, Wagmi.
- **Use Case**: A developer merch store accepting crypto payments.

### 3. Merchant Dashboard (`/merchant-dashboard`)
The administrative interface for merchants.
- **Purpose**: View transaction history, manage withdrawals, and track earnings.
- **Features**: Real-time sales data and wallet management.
- **Deployment**: [Live Dashboard](https://ethglobal-merchantdashboard.vercel.app/)

### 4. Smart Contracts (`/foundry`)
The protocol logic deployed on-chain.
- **Purpose**: Manage the `NexusVault` for holding funds and processing cross-chain settlements.
- **Tooling**: Built with Foundry.
- **Key Contracts**: `NexusVault.sol` (handles deposits and payouts) and `NexusPayRelay.sol` (handles cross-chain settlements).
- **Arc Testnet Deployment**: [NexusVault.sol](https://testnet.arcscan.app/address/0x05949CFfCE00B0032194cb7B8f8e72bBF1376012) and [NexusPayRelay.sol](https://testnet.arcscan.app/address/0xCDe4188f4bB253dc5f896bDd230B8b56Dff37386)
---

## Local Development Guide

Follow these steps to run the entire NexusPay ecosystem locally and test the payment flow.

### Step 1: Configure Environment Variables

The demo store needs to know your merchant address and an operator key (for relaying CCTP transactions).

1.  Navigate to the shop directory:
    ```bash
    cd ethglobal-shop
    ```

2.  Create or update `.env.local`:
    ```ini
    # Your wallet address where you want to receive payments
    NEXT_PUBLIC_MERCHANT_ADDRESS=YOUR_WALLET_ADDRESS
    
    # Operator private key (can be a fresh burner wallet)
    # Used to relay CCTP messages on the destination chain (Arc Testnet).
    # Generate one with `cast wallet new` or use an existing testnet key.
    # IMPORTANT: This wallet must be funded with USDC on Arc Testnet to pay for gas. USE CIRCLE FAUCET: (https://faucet.circle.com/)
    NEXT_PUBLIC_OPERATOR_PRIVATE_KEY=YOUR_PRIVATE_KEY
    ```

### Step 2: Run the Demo Store

1.  Install dependencies and start the development server:
    ```bash
    pnpm install
    pnpm dev
    ```

2.  Open [http://localhost:3000](http://localhost:3000) in your browser.

3.  **Customize the Component**:
    The main integration logic is in `app/page.tsx`. You can customize the following props:

    ```tsx
    <NexusPayment
       // Essential Configuration
       merchantAddress={process.env.NEXT_PUBLIC_MERCHANT_ADDRESS} // Where funds are sent
       amount={1000000n} // Amount in atomic units (e.g. 1 USDC = 1000000)
       operatorPrivateKey={process.env.NEXT_PUBLIC_OPERATOR_PRIVATE_KEY} // For CCTP relaying
       
       // Payment Mode
       mode="fixed" // 'fixed' (exact amount) or 'variable' (user inputs amount, example: donations)
       
       // Optional Customization
       orderId="ORDER-123" // You can use custom logic to create orderID's
       amountLabel="PAYMENT AMOUNT" // Label above amount display
       buttonText="Pay Now" // Custom button text
       className="my-custom-class" // Add custom CSS classes
       
       // Callbacks
       onSuccess={(tx, amount) => console.log('Paid!', tx)}
       onClose={() => console.log('Closed')}
       onError={(err) => console.error(err)}
    />
    ```

### Step 3: Test the Payment Flow

1.  **Connect Wallet**: On the demo store, connect a wallet (e.g., MetaMask or Coinbase Wallet) with some testnet USDC.
    - Supported Networks: **Arc Testnet**, **Ethereum Sepolia**, **Base Sepolia**, **Arbitrum Sepolia**. (Any chain supported by Circle CCTP can be easily integrated, these four are only for the demo showcase)
2.  **Buy an Item**: Select a product and click "Add to Cart / Pay Now".
3.  **Process Payment**:
    - **Approve**: Confirm the USDC approval transaction.
    - **Transfer/Pay**: Confirm the payment transaction.
    - **Wait**: The UI will show the progress (Spinner -> Success).
4.  **Verify**: Once confirmed, you will see a "Payment Successful" message.

### Step 4: Use the Merchant Dashboard

You can use the dashboard to verify that your merchant address received the funds.

1.  **Option A: Interact with Live Dashboard**
    - Go to [https://ethglobal-merchantdashboard.vercel.app/](https://ethglobal-merchantdashboard.vercel.app/)
    - Connect the **same wallet** you used as `NEXT_PUBLIC_MERCHANT_ADDRESS`.
    - You should see your recent transactions and account balance.

2.  **Option B: Run Locally**
    ```bash
    cd ../merchant-dashboard
    pnpm install
    pnpm dev
    ```
    - Open [http://localhost:3001](http://localhost:3001) (or port 3000 if shop is stopped).
    - Connect your merchant wallet.

## Working on the Library

If you want to modify the internal logic of the NexusPay SDK:

```bash
cd nexuspay-react
pnpm install
pnpm build
```

Any changes made here need to be built and synced to the apps consuming it.

## Growth & Referrals

NexusPay includes a built-in referral system to help merchants grow their sales.

1.  **Create a Campaign**: In the Merchant Dashboard, you can create a referral campaign (with a reward percentage (e.g., 5%).
2.  **Share Links**: Affiliates get a link (e.g., `?campaign=1&ref=0xUserAddress`).
3.  **Automatic Payouts**: When a user buys through that link, the smart contract **automatically splits the payment**: 95% to you, 5% to the referrer. Instantly and on-chain.

To enable this in your app, just pass the params to the component:

```tsx
import { useSearchParams } from 'next/navigation';

const searchParams = useSearchParams();
const campaignId = searchParams.get('campaign');
const referrer = searchParams.get('ref');

<NexusPayment
  // ... other props
  referralCampaignId={campaignId ? BigInt(campaignId) : undefined}
  referrerAddress={referrer || undefined}
/>
```
