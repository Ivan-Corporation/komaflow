import React from 'react'
import { useTokenOverview } from '../hooks/useTokenData'
import { TrendingUp, TrendingDown, Package, Flame, ArrowUpDown, Users, BarChart3 } from 'lucide-react'

export const TokenOverview: React.FC = () => {
  const { data, isLoading, error } = useTokenOverview('24h')

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon,
    trend,
    subtitle,
    color
  }: { 
    title: string; 
    value: string; 
    change?: number; 
    icon: React.ElementType;
    trend?: 'up' | 'down';
    subtitle?: string;
    color: string;
  }) => (
    <div className="glass-card rounded-2xl p-6 hover:transform hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-right">
          {change !== undefined && (
            <div className="flex items-center gap-1 justify-end">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {Math.abs(change).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium mb-2">{title}</p>
        <p className="text-3xl font-bold mb-1">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded w-1/3 shimmer"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl shimmer"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="glass-card rounded-3xl p-8">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 text-lg">Failed to load token overview</p>
          <button className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { overview, timeframe_activity } = data

  return (
    <div className="glass-card rounded-3xl p-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              KOMA Token Dashboard
            </h2>
          </div>
          <p className="text-gray-400">Last updated: {new Date(data.as_of).toLocaleTimeString()}</p>
        </div>
        
        <div className="glass-card px-6 py-4 rounded-xl">
          <p className="text-sm text-gray-400">Total Supply</p>
          <p className="text-3xl font-bold gradient-text">{overview.total_supply} KOMA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Minted"
          value={overview.total_minted}
          subtitle="All-time mints"
          icon={Package}
          color="bg-gradient-to-br from-blue-600 to-cyan-600"
        />
        
        <StatCard
          title="Total Burned"
          value={overview.total_burned}
          subtitle="All-time burns"
          icon={Flame}
          color="bg-gradient-to-br from-red-600 to-orange-600"
        />
        
        <StatCard
          title="Net Issuance"
          value={overview.net_issuance}
          subtitle="Current circulation"
          icon={ArrowUpDown}
          color="bg-gradient-to-br from-purple-600 to-pink-600"
        />
        
        <StatCard
          title="Holders"
          value="2"
          subtitle="Active addresses"
          icon={Users}
          color="bg-gradient-to-br from-green-600 to-emerald-600"
        />
      </div>

      {/* 24h Activity Section */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
          24-Hour Activity Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-blue-300">Mint Events</p>
              <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                {timeframe_activity.mints.count}
              </div>
            </div>
            <p className="text-2xl font-bold">{timeframe_activity.mints.amount} KOMA</p>
            <p className={`text-sm mt-2 ${timeframe_activity.mints.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {timeframe_activity.mints.change_pct >= 0 ? '↑' : '↓'} {Math.abs(timeframe_activity.mints.change_pct)}% change
            </p>
          </div>
          
          <div className="p-5 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-red-300">Burn Events</p>
              <div className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
                {timeframe_activity.burns.count}
              </div>
            </div>
            <p className="text-2xl font-bold">{timeframe_activity.burns.amount} KOMA</p>
            <p className={`text-sm mt-2 ${timeframe_activity.burns.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {timeframe_activity.burns.change_pct >= 0 ? '↑' : '↓'} {Math.abs(timeframe_activity.burns.change_pct)}% change
            </p>
          </div>
          
          <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-green-300">Transfer Volume</p>
              <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                {timeframe_activity.transfers.count}
              </div>
            </div>
            <p className="text-2xl font-bold">{timeframe_activity.transfers.volume} KOMA</p>
            <p className="text-sm text-gray-400 mt-2">Across all transfers</p>
          </div>
        </div>
        
        {data.recent_activity?.large_transfers && data.recent_activity.large_transfers.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-lg font-semibold mb-4">Recent Large Transfers</h4>
            <div className="space-y-3">
              {data.recent_activity.large_transfers.slice(0, 3).map((transfer: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="font-mono text-sm">
                        0x{Array.isArray(transfer.to) ? transfer.to.slice(0, 8).join('') : transfer.to.slice(0, 8)}...
                      </span>
                    </div>
                    <span className="font-bold text-green-300">{transfer.amount} KOMA</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {new Date(transfer.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}