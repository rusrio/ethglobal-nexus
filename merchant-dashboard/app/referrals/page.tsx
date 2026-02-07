'use client';

import { AuthGuard } from '@/components/AuthGuard';
import { ReferrerStatsCard } from '@/components/ReferrerStatsCard';
import { Navbar } from '@/components/Navbar';

export default function ReferralsPage() {
  return (
    <AuthGuard requireMerchant={false}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Referral Rewards</h2>
            <p className="text-gray-400">Track your referral earnings.</p>
          </div>

          <div className="max-w-md mx-auto mb-12">
             <ReferrerStatsCard />
          </div>

          <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800 text-center">
             <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </div>
             <h3 className="text-xl font-bold text-white mb-2">How it works?</h3>
             <p className="text-gray-400 max-w-2xl mx-auto">
               When you refer users to a merchant campaign, rewards are <strong>automatically transferred to your wallet</strong> instantly. 
               This dashboard lets you track your total lifetime earnings.
             </p>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="border-t border-gray-800 mt-12 bg-gray-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>© 2026 NexusPay. Powered by Circle CCTP.</p>
            </div>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}
