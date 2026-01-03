import { useQuery } from '@tanstack/react-query'
import { tokenAPI } from '../api/client'

export const useTokenOverview = (timeframe?: string) => {
  return useQuery({
    queryKey: ['token', 'overview', timeframe],
    queryFn: () => tokenAPI.getOverview(timeframe).then(res => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export const useMintHistory = (limit?: number, offset?: number) => {
  return useQuery({
    queryKey: ['token', 'mints', limit, offset],
    queryFn: () => tokenAPI.getMintHistory(limit, offset).then(res => res.data),
  })
}

export const useBurnHistory = (limit?: number, offset?: number) => {
  return useQuery({
    queryKey: ['token', 'burns', limit, offset],
    queryFn: () => tokenAPI.getBurnHistory(limit, offset).then(res => res.data),
  })
}

export const useTransferHistory = (limit?: number, offset?: number) => {
  return useQuery({
    queryKey: ['token', 'transfers', limit, offset],
    queryFn: () => tokenAPI.getTransferHistory(limit, offset).then(res => res.data),
  })
}

export const useBlacklistStatus = () => {
  return useQuery({
    queryKey: ['token', 'blacklist'],
    queryFn: () => tokenAPI.getBlacklistStatus().then(res => res.data),
  })
}

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => tokenAPI.getSystemHealth().then(res => res.data),
    refetchInterval: 60000, // Refresh every minute
  })
}