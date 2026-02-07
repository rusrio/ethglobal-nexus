'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AuthGuard } from '@/components/AuthGuard';
import { BalanceCard } from '@/components/BalanceCard';
import { PaymentHistory } from '@/components/PaymentHistory';
import { CreateCampaignForm } from '@/components/CreateCampaignForm';
import { CampaignList } from '@/components/CampaignList';
import { TotalStatsCard } from '@/components/TotalStatsCard';
import { Navbar } from '@/components/Navbar';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Header */}
        {/* Header */}
        <Navbar />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back!</h2>
            <p className="text-gray-400">Here's what's happening with your payments today.</p>
          </div>

          {/* Balance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <BalanceCard />
            </div>
            <div className="lg:col-span-1 h-full">
               <TotalStatsCard />
            </div>
          </div>

           {/* Campaigns Section */}
           <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Referral Campaigns</h3>
                <p className="text-gray-400 text-sm">Create and manage your referral programs.</p>
              </div>
              <CreateCampaignForm />
           </div>
           
           <div className="mb-12">
              <CampaignList />
           </div>

          {/* Payment History */}
          <PaymentHistory />
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>© 2026 NexusPay. Powered by Circle CCTP.</p>
              <div className="flex items-center gap-4">
                <a href="https://testnet.arcscan.net" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
                  Arc Explorer
                </a>
                <span>•</span>
                <a href="https://docs.circle.com/stablecoins/cctp" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
                  Docs
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}
