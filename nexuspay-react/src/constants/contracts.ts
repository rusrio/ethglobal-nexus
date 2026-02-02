/**
 * Contract addresses for CCTP and NexusVault across supported chains
 */

export const CCTP_CONTRACTS = {
  // Ethereum Sepolia
  11155111: {
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5' as `0x${string}`,
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD' as `0x${string}`,
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`,
    domain: 0,
    name: 'Ethereum Sepolia',
  },
  // Base Sepolia
  84532: {
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5' as `0x${string}`,
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD' as `0x${string}`,
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
    domain: 6,
    name: 'Base Sepolia',
  },
  // Arbitrum Sepolia
  421614: {
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5' as `0x${string}`,
    messageTransmitter: '0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872' as `0x${string}`,
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
export const NEXUS_VAULT_ADDRESS = '0xa043E3380B32FDB0F9BBD225D71ab2811600b56C' as `0x${string}`;

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
