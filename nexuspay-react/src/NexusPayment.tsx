import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useWalletClient, usePublicClient } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { BridgeKit, BridgeChain } from '@circle-fin/bridge-kit';
import { ViemAdapter } from '@circle-fin/adapter-viem-v2';
import { createPublicClient, http } from 'viem';
import { ArcTestnet, EthereumSepolia, BaseSepolia } from '@circle-fin/bridge-kit/chains';

// Nexus Vault contract address on Arc Testnet
const NEXUS_VAULT_ADDRESS_ARC = '0x1b8C8b14f2713644018986834c82ae4D7a8841b5';

export interface NexusPaymentProps {
    merchantId: string;
    orderId: string;
    onSuccess?: (txHash: string) => void;
    onError?: (error: any) => void;
}

export function NexusPayment({ merchantId, orderId, onSuccess, onError }: NexusPaymentProps) {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handlePay = async () => {
    if (!address || !amount || !walletClient || !publicClient || !chain) return;
    setLoading(true);
    setStatus('Initializing Bridge Kit...');

    try {
      console.log(`Initiating payment for Merchant: ${merchantId}, Order: ${orderId}`);
      const kit = new BridgeKit();

      // Create Adapter from Wagmi Clients
      const adapter = new ViemAdapter({
        getWalletClient: () => walletClient as any,
        getPublicClient: ({ chain: requestedChain }) => {
            if (publicClient && publicClient.chain?.id === requestedChain.id) {
                return publicClient as any;
            }
            return createPublicClient({
                chain: requestedChain,
                transport: http()
            }) as any;
        }
      }, {
        addressContext: 'user-controlled',
        supportedChains: [ArcTestnet, EthereumSepolia, BaseSepolia]
      });

      // Destination: NexusVault on Arc Testnet
      const destinationAddress = NEXUS_VAULT_ADDRESS_ARC;

      setStatus('Estimating fees...');
      
      // Determine Source Chain
      let sourceChain: string = 'Ethereum_Sepolia'; 
      if (chain.name.includes('Base')) sourceChain = 'Base_Sepolia';
      if (chain.name.includes('Ethereum') && chain.testnet) sourceChain = 'Ethereum_Sepolia';
      
      const bridgeParams = {
        from: { adapter, chain: sourceChain },
        to: { 
          adapter, 
          chain: BridgeChain.Arc_Testnet, 
          address: destinationAddress 
        },
        amount: amount, 
        token: 'USDC' 
      };

      console.log('Bridge Params:', bridgeParams);

      const result = await kit.bridge(bridgeParams as any);

      console.log('Bridge Result:', result);
      const txHash = result.steps[0]?.txHash;
      
      if (txHash) {
          setStatus(`Payment Sent! Tx: ${txHash}`);
          if (onSuccess) onSuccess(txHash);
      } else {
          setStatus('Payment Sent but Tx Hash missing in response.');
      }

    } catch (error: any) {
      console.error('Payment failed:', error);
      setStatus(`Error: ${error.message || error}`);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nexus-payment-container p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4 border border-gray-100 font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">NexusPay</h2>
        <div className="text-xs font-mono text-gray-400">Powered by BridgeKit</div>
      </div>
      
      {!isConnected ? (
        <div className="text-center py-8">
            <p className="mb-4 text-gray-600">Connect wallet to pay</p>
            <button
            onClick={() => connect({ connector: injected() })}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
            Connect Wallet
            </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg text-sm flex justify-between">
            <span className="text-gray-500">Wallet</span>
            <span className="font-mono text-gray-800">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg text-sm flex justify-between">
            <span className="text-gray-500">Network</span>
            <span className="font-medium text-gray-800">{chain?.name || 'Unknown'}</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USDC)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2 border"
              placeholder="0.00"
            />
          </div>

          <button
            onClick={handlePay}
            disabled={loading || !amount}
            className={`w-full py-3 rounded-lg text-white font-medium transition ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing...' : 'Pay with BridgeKit'}
          </button>
          
          {status && (
            <div className={`text-xs text-center mt-2 p-2 rounded border break-all ${status.includes('Error') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-yellow-50 text-gray-600 border-yellow-100'}`}>
              {status}
            </div>
          )}

          <div className="text-center">
             <button onClick={() => disconnect()} className="text-xs text-red-500 hover:text-red-700 underline">
                Disconnect
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
