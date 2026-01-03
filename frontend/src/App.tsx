import { WalletConnect } from './components/WalletConnect'
import { TokenOverview } from './components/TokenOverview'
import { AdminPanel } from './components/AdminPanel'
import { ActivityChart } from './components/ActivityChart'
import { EventHistory } from './components/EventHistory'
import { useWallet } from './contexts/WalletContext'
import { Coins, Activity, History, Settings, Shield, BarChart3, Users } from 'lucide-react'

function App() {
  const { isConnected } = useWallet()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black p-4 md:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Enhanced Header with Navigation */}
        <header className="glass-card rounded-3xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-lg">
                <Coins className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Koma Token Dashboard
                </h1>
                <p className="text-gray-300 mt-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Monitor and manage KOMA token on Arbitrum
                </p>
              </div>
            </div>
            
            <WalletConnect />
          </div>
          

        </header>

        {!isConnected ? (
          <div className="text-center py-20">
            <div className="inline-block p-12 rounded-3xl glass-card border border-white/20 shadow-2xl">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Coins className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Connect Your Wallet
              </h2>
              <p className="text-gray-300 mb-8 max-w-md mx-auto text-lg">
                Connect your wallet to view token analytics, manage permissions, and interact with the KOMA contract
              </p>
              <div className="inline-block transform hover:scale-105 transition-transform">
                <WalletConnect />
              </div>
            </div>
          </div>
        ) : (
          <main className="space-y-8">
            {/* Stats Overview */}
            <TokenOverview />

            {/* Charts Section - Wider Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="lg:col-span-2">
                <ActivityChart />
              </div>
        
            </div>

            {/* Event History & Admin Panel Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="lg:col-span-2">
                <EventHistory />
              </div>
             
            </div>

            {/* Enhanced System Information */}
            <div className="glass-card rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">System Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <p className="text-sm text-gray-400 mb-2">Contract Address</p>
                  <p className="font-mono text-lg font-semibold">0xD5EA29d17A8...d86B9</p>
                  <a href="https://sepolia.arbiscan.io/token/0xd5ea29d17a8ad6359b64dee8994af9250b4d86b9" target='_blank' className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block">View on Arbiscan →</a>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <p className="text-sm text-gray-400 mb-2">Network</p>
                  <p className="font-semibold text-xl flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Arbitrum Sepolia
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Chain ID: Sepolia</p>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                  <p className="text-sm text-gray-400 mb-2">Token Decimals</p>
                  <p className="font-semibold text-3xl">8</p>
                  <p className="text-sm text-gray-400 mt-2">1 KOMA = 100M units</p>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <p className="text-sm text-gray-400 mb-2">Last Updated</p>
                  <p className="font-semibold text-lg">Just now</p>
                  <p className="text-sm text-gray-400 mt-2">Refreshes every 30s</p>
                </div>
              </div>
            </div>

             <div>
                <AdminPanel />
              </div>
          </main>
        )}

        {/* Enhanced Footer */}
        <footer className="mt-12 pt-8 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Koma Dashboard</h4>
              <p className="text-gray-400">Advanced monitoring and management interface for the KOMA token ecosystem.</p>
            </div>
           
            <div className='md:text-right'>
              <h4 className="text-lg font-semibold mb-4">Built With</h4>
              <div className="flex flex-wrap justify-end gap-2">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">React</span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Ethers v6</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">TailwindCSS</span>
                <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">Recharts</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center text-gray-500 text-sm">
            <p>Koma Token Dashboard v2.0 • Built with React, Ethers v6, and TailwindCSS</p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <a href="https://sepolia.arbiscan.io/token/0xd5ea29d17a8ad6359b64dee8994af9250b4d86b9" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="hover:text-blue-400 transition-colors">
                View on Arbiscan
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">Documentation</a>
              <a href="#" className="hover:text-blue-400 transition-colors">GitHub</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App