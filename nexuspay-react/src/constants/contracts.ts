/**
 * Contract addresses for CCTP and NexusVault across supported chains
 */

export const CCTP_CONTRACTS = {
  // Ethereum Sepolia
  11155111: {
    tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as `0x${string}`,
    messageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as `0x${string}`,
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`,
    domain: 0,
    name: 'Ethereum Sepolia',
  },
  // Base Sepolia
  84532: {
    tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as `0x${string}`,
    messageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as `0x${string}`,
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
    domain: 6,
    name: 'Base Sepolia',
  },
  // Arbitrum Sepolia
  421614: {
    tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as `0x${string}`,
    messageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as `0x${string}`,
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as `0x${string}`,
    domain: 3,
    name: 'Arbitrum Sepolia',
  },
  // Arc Testnet
  5042002: {
    tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA' as `0x${string}`,
    messageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as `0x${string}`,
    usdc: '0x3600000000000000000000000000000000000000' as `0x${string}`,
    domain: 26,
    name: 'Arc Testnet',
  },
} as const;

/**
 * NexusVault contract address on Arc Testnet
 */
export const NEXUS_VAULT_ADDRESS = '0xd212F75CA5592244673C27664A8e8332D45f023E' as `0x${string}`;

/**
 * NexusPayRelay contract address on Arc Testnet
 * @dev This wrapper contract relays CCTP messages and manually invokes hooks
 */
export const NEXUS_PAY_RELAY_ADDRESS = '0xCe4Fdab26E8b8E139cd61dC6E616beAF53266C3c' as `0x${string}`;

/**
 * NexusPayRelay ABI - minimal interface for relaying payments
 */
export const NEXUS_PAY_RELAY_ABI = [
  {
    type: 'function',
    name: 'relayPayment',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getConfiguration',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'messageTransmitter', type: 'address' },
      { name: 'nexusVault', type: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'PaymentRelayed',
    inputs: [
      { name: 'messageHash', type: 'bytes32', indexed: true },
      { name: 'merchant', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'sourceDomain', type: 'uint32', indexed: false },
    ],
  },
] as const;

/**
 * Arc Testnet chain ID
 */
export const ARC_TESTNET_CHAIN_ID = 5042002;

/**
 * Supported source chain IDs for cross-chain payments
 */
export const SUPPORTED_SOURCE_CHAINS = [11155111, 84532, 421614] as const;

/**
 * Circle CCTP API base URL for attestation polling
 */
export const CIRCLE_API_BASE_URL = 'https://iris-api-sandbox.circle.com';

