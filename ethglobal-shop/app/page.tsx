'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { NexusPayment } from '@/lib/nexuspay/components/NexusPayment';

const MERCH_PRODUCTS = [
  {
    id: 'sticker-pack',
    name: 'Dev Sticker Pack',
    description: 'High-quality vinyl stickers: "LGTM", "Deploy to Prod", and "Works on my Machine".',
    price: 1000000n, // 1 USDC
    imageColor: 'from-pink-500 to-rose-500',
    icon: '✨',
    popular: false,
  },
  {
    id: 'dev-mug',
    name: 'Coffee -> Code Mug',
    description: 'Matte black ceramic mug. Keeps your coffee hot while you debug race conditions.',
    price: 5000000n, // 5 USDC
    imageColor: 'from-amber-500 to-orange-600',
    icon: '☕',
    popular: true,
  },
  {
    id: 'nexus-hoodie',
    name: 'Nexus Premium Hoodie',
    description: 'Heavyweight cotton blend. Dark mode compatible. Comfort for long coding sessions.',
    price: 10000000n, // 10 USDC
    imageColor: 'from-slate-700 to-slate-900',
    icon: '👕',
    popular: false,
  },
];

export default function Home() {
  const { address, chain } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaign');
  const referrer = searchParams.get('ref');

  const selectedProduct = MERCH_PRODUCTS.find(p => p.id === selectedProductId);

  const handleBuyNow = (productId: string) => {
    setSelectedProductId(productId);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = (txHash: string, amount: bigint) => {
    console.log(`Purchase successful! Transaction: ${txHash}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-lg">
              N
            </div>
            <span className="font-bold text-lg tracking-tight">Nexus Merch</span>
          </div>

          <div className="flex items-center gap-4">
            {address ? (
              <div className="flex items-center gap-3 bg-gray-100 pl-3 pr-1 py-1 rounded-full border border-gray-200">
                {chain && (
                  <span className="hidden sm:block px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {chain.name}
                  </span>
                )}
                <span className="text-xs font-medium text-gray-600 font-mono">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="px-3 py-1.5 bg-white text-xs font-semibold rounded-full shadow-sm hover:text-red-600 transition"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition shadow-sm"
                >
                  Connect Wallet
                </button>
              ))
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-white border-b border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col items-center text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wider mb-6">
            NEW COLLECTION 2026
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-gray-900">
            Gear for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Builders</span>.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Premium merchandise designed for developers. Shipping globally. <br/>
            Pay instantly with USDC on any chain.
          </p>
          <div className="flex gap-4">
             <button onClick={() => document.getElementById('products')?.scrollIntoView({behavior: 'smooth'})} className="px-8 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition transform hover:-translate-y-0.5">
               Shop Now
             </button>
             <button className="px-8 py-3 bg-gray-100 text-gray-900 font-semibold rounded-full hover:bg-gray-200 transition">
               View Lookbook
             </button>
          </div>
        </div>
        
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-30">
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100 rounded-full blur-3xl mix-blend-multiply filter"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-100 rounded-full blur-3xl mix-blend-multiply filter"></div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
           <h2 className="text-3xl font-bold tracking-tight">Latest Arrivals</h2>
           <span className="text-sm text-gray-500 font-medium">3 Items</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {MERCH_PRODUCTS.map((product) => (
            <div 
              key={product.id} 
              className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Product Image Placeholder */}
              <div className={`h-64 bg-gradient-to-br ${product.imageColor} flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500`}>
                <span className="text-8xl drop-shadow-lg filter">{product.icon}</span>
                {product.popular && (
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-black text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    BEST SELLER
                  </span>
                )}
              </div>

              <div className="p-8 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                   <span className="text-lg font-semibold text-gray-900">${Number(product.price) / 1e6}</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">
                  {product.description}
                </p>
                
                <button
                  onClick={() => handleBuyNow(product.id)}
                  disabled={!address}
                  className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {address ? (
                     <>
                       <span>Add to Cart</span>
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                     </>
                  ) : 'Connect Wallet'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Checkout Modal */}
      {showCheckout && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
          
          <div className="relative bg-transparent w-full max-w-md animate-in fade-in zoom-in duration-200">
             <button
              onClick={() => setShowCheckout(false)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition"
            >
              Close
            </button>
            
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
               {/* Product Summary Header */}
               <div className="bg-gray-50 border-b border-gray-100 p-6 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${selectedProduct.imageColor} flex items-center justify-center text-xl`}>
                    {selectedProduct.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-sm text-gray-500">{Number(selectedProduct.price) / 1e6} USDC</p>
                  </div>
               </div>

               {/* Payment Component */}
               <div className="p-2">
                 <NexusPayment
                  merchantAddress={(process.env.NEXT_PUBLIC_MERCHANT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`}
                  orderId={`MERCH-${selectedProduct.id.toUpperCase()}-${Date.now()}`}
                  operatorPrivateKey={(process.env.NEXT_PUBLIC_OPERATOR_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001') as `0x${string}`}
                  mode="fixed"
                  amount={selectedProduct.price}
                  buttonText="Pay Now"
                  onSuccess={handlePaymentSuccess}
                  onError={(error) => {
                    console.error('Payment failed:', error);
                    alert(`Payment failed: ${error.message}`);
                  }}
                  referralCampaignId={campaignId ? BigInt(campaignId) : undefined}
                  referrerAddress={referrer || undefined}
                  onClose={() => {
                    setShowCheckout(false);
                    setSelectedProductId(null);
                  }}
                  className="shadow-none border-0"
                />
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Trust Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <p className="text-gray-400 font-medium text-sm">
             SECURE PAYMENTS POWERED BY <span className="text-gray-900 font-bold">NEXUS PAY</span>
           </p>
        </div>
      </footer>
    </main>
  );
}
