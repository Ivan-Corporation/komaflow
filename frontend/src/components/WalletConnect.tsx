import React from 'react'
import { useWallet } from '../contexts/WalletContext'
import { Shield, Coins, UserCheck, LogOut } from 'lucide-react'

export const WalletConnect: React.FC = () => {
  const { 
    isConnected, 
    address, 
    isAdmin, 
    isMinter, 
    isDeployer, 
    connect, 
    disconnect 
  } = useWallet()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
      >
        <Shield className="w-5 h-5" />
        Connect Wallet
      </button>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-4 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            {(isAdmin || isMinter) && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <UserCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          <div>
            <p className="font-medium">{formatAddress(address!)}</p>
            <div className="flex gap-2 mt-1">
              {isAdmin && (
                <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">
                  Admin
                </span>
              )}
              {isMinter && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                  Minter
                </span>
              )}
              {isDeployer && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                  Deployer
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={connect}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Disconnect"
        >
          <LogOut className="w-5 h-5 text-gray-400 hover:text-white" />
        </button>
      </div>
    </div>
  )
}