import { http, createConfig } from 'wagmi';
import { ARC_TESTNET } from './contracts';

export const config = createConfig({
  chains: [ARC_TESTNET as any],
  transports: {
    [ARC_TESTNET.id]: http(),
  },
  ssr: true,
});
