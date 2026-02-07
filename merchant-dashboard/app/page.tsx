'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white overflow-hidden">

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-cyan-500/20 rounded-full blur-[200px] animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[150px] animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-[700px] h-[700px] bg-purple-500/15 rounded-full blur-[180px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <nav className="relative z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <span className="text-lg font-bold text-white">Nexus</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium hidden md:block">Features</a>
            <a href="#developers" className="text-gray-400 hover:text-white transition-colors text-sm font-medium hidden md:block">Developers</a>
            <Link 
              href="/dashboard"
              className="relative group bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[90vh] flex items-center justify-center px-6 pt-12 pb-24">
        <div className="max-w-5xl mx-auto text-center">
          
          <h1 className="text-7xl md:text-9xl font-black mb-8 leading-[0.9] tracking-tight">
            <span className="block text-white mb-4">Start accepting</span>
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              USDC
            </span>
          </h1>
          
          <p className="text-2xl text-gray-400 mb-16 max-w-2xl mx-auto leading-relaxed">
            Accept USDC payments on any chain with ease.
          </p>
          <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full px-8 py-4 mb-12 group hover:border-cyan-500/30 transition-all">
            <code className="text-cyan-400 font-mono text-lg">npm install nexuspay-react</code>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link
              href="/dashboard"
              className="relative group overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-10 py-4 rounded-full font-bold text-lg transition-all shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60"
            >
              <span className="relative z-10">Launch Dashboard</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
            <a
              href="#developers"
              className="bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 text-white px-10 py-4 rounded-full font-bold text-lg transition-all"
            >
              View Docs
            </a>
          </div>

          {/* Product Preview - Interactive window */}
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              {/* Glow behind */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 blur-[100px] opacity-60 group-hover:opacity-80 transition-opacity"></div>
              
              {/* Window */}
              <div className="relative bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[32px] p-1 shadow-2xl">
                {/* Browser chrome */}
                <div className="bg-white/5 rounded-t-[28px] px-6 py-4 border-b border-white/10 flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="flex-1 mx-8 bg-white/5 rounded-lg px-4 py-1.5 text-xs text-gray-500 font-mono">
                    yourcommerce.com/checkout
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Source */}
                  <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-4 border border-cyan-500/30">
                      <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <div className="text-xs text-cyan-400 font-semibold mb-1">SOURCE</div>
                    <div className="text-xl font-bold text-white mb-2">Sepolia</div>
                    <div className="text-sm text-gray-400">100 USDC</div>
                  </div>

                  {/* Bridge */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 flex flex-col items-center justify-center">
                    <svg className="w-10 h-10 text-purple-400 mb-3 animate-spin" style={{animationDuration: '3s'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <div className="text-xs text-purple-400 font-semibold">CCTP</div>
                  </div>

                  {/* Destination */}
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center mb-4 border border-green-500/30">
                      <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-xs text-green-400 font-semibold mb-1">DESTINATION</div>
                    <div className="text-xl font-bold text-white mb-2">Arc Testnet</div>
                    <div className="text-sm text-gray-400">Received ✓</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Clean cards */}
      <section id="features" className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
              Everything you need
            </h2>
            <p className="text-xl text-gray-400">Enterprise-grade infrastructure for modern payments</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Instant", desc: "Transfers in minutes", color: "cyan" },
              { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", title: "Secure", desc:"Leveraging Circle CCTP" , color: "green" },
              { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", title: "Dashboard", desc: "Track everything", color: "purple" },
              { icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", title: "Developer SDK", desc: "React + TypeScript", color: "blue" }
            ].map((feature, i) => (
              <div key={i} className="relative group">
                <div className={`absolute inset-0 bg-${feature.color}-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-[28px] p-8 transition-all">
                  <div className={`w-12 h-12 rounded-2xl bg-${feature.color}-500/10 border border-${feature.color}-500/20 flex items-center justify-center mb-6`}>
                    <svg className={`w-6 h-6 text-${feature.color}-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section id="developers" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
              Built for developers
            </h2>
            <p className="text-xl text-gray-400">Get started in seconds</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {[
                { num: "1", title: "Install", cmd: "npm install nexuspay-react" },
                { num: "2", title: "Import", cmd: "import { NexusPayment }" },
                { num: "3", title: "Deploy", cmd: "npm run dev" }
              ].map((step, i) => (
                <div key={i} className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xl">
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-3">{step.title}</h4>
                    <code className="block bg-white/5 backdrop-blur-xl border border-white/10 text-cyan-400 px-4 py-3 rounded-xl font-mono text-sm">
                      {step.cmd}
                    </code>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-2xl opacity-60"></div>
              <div className="relative bg-[#1a1a1a] backdrop-blur-xl border border-white/10 rounded-[28px] p-8 shadow-2xl">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-auto text-gray-500 text-xs font-mono">example.tsx</span>
                </div>
                <pre className="text-sm leading-loose font-mono text-gray-300">
{`<NexusPayment
  merchantAddress="0x..."
  productName="Premium"
  amount={99.99}
  orderId="ORD-123"
/>`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Centered */}
      <section className="relative py-40 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl md:text-8xl font-black mb-8 text-white">
            Ready to start?
          </h2>
          <p className="text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Launch your dashboard and accept cross-chain payments today
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-12 py-6 rounded-full font-black text-xl transition-all shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-105"
          >
            Launch Dashboard
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">NexusPay</span>
              </div>
              <p className="text-sm text-gray-500">Cross-chain payments made simple</p>
            </div>

            {[
              { title: "Product", links: ["Features", "Dashboard", "Docs"] },
              { title: "Resources", links: ["Circle CCTP", "Arc Explorer"] },
              { title: "Connect", links: ["GitHub", "Twitter", "Discord"] }
            ].map((section, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4 text-white text-sm">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/5 text-center">
            <p className="text-sm text-gray-600">
              Made with ❤️ for ETHGlobal Hackathon · © 2026 NexusPay
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
