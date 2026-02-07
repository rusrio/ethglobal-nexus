import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react', 
    'react-dom', 
    'wagmi', 
    'viem',
    '@solana/web3.js',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-wallets',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-base'
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
});
