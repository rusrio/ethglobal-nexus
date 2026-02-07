import { http, createConfig } from 'wagmi';
import { sepolia, baseSepolia, arbitrumSepolia } from 'wagmi/chains';

// Arc Testnet configuration
export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-arc-testnet.arcs.network'] },
    public: { http: ['https://rpc-arc-testnet.arcs.network'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://testnet.arcscan.com' },
  },
  testnet: true,
} as const;

export const config = createConfig({
  chains: [sepolia, baseSepolia, arbitrumSepolia, arcTestnet],
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [arcTestnet.id]: http(),
  },
});
