/**
 * Contract addresses and ABIs for NexusPay
 */

export const NEXUS_VAULT_ADDRESS = (process.env.NEXT_PUBLIC_NEXUS_VAULT_ADDRESS || '0x05949CFfCE00B0032194cb7B8f8e72bBF1376012') as `0x${string}`;

export const NEXUS_VAULT_ABI = [
  {
    type: 'function',
    name: 'merchantBalances',
    stateMutability: 'view',
    inputs: [{ name: 'merchant', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'event',
    name: 'CCTPPaymentProcessed',
    inputs: [
      { name: 'merchant', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'orderId', type: 'string', indexed: false },
      { name: 'messageHash', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'FundsWithdrawn',
    inputs: [
      { name: 'merchant', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'createReferralCampaign',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'referrerPct', type: 'uint256' },
      { name: 'rewardLimit', type: 'uint256' },
    ],
    outputs: [{ name: 'campaignId', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'CampaignCreated',
    inputs: [
      { name: 'campaignId', type: 'uint256', indexed: true },
      { name: 'merchant', type: 'address', indexed: true },
      { name: 'referrerPct', type: 'uint256', indexed: false },
      { name: 'rewardLimit', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RewardPaid',
    inputs: [
      { name: 'campaignId', type: 'uint256', indexed: true },
      { name: 'referrer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'campaigns',
    stateMutability: 'view',
    inputs: [{ name: 'campaignId', type: 'uint256' }],
    outputs: [
      { name: 'referrerPct', type: 'uint256' },
      { name: 'merchant', type: 'address' },
      { name: 'rewardLimit', type: 'uint256' },
      { name: 'totalRewarded', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'toggleCampaign',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'updateCampaign',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'referrerPct', type: 'uint256' },
      { name: 'rewardLimit', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

export const ARC_TESTNET_CHAIN_ID = 5042002;

export const ARC_TESTNET = {
  id: ARC_TESTNET_CHAIN_ID,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'] },
    public: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://testnet.arcscan.net' },
  },
} as const;
