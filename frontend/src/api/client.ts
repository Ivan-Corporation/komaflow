import axios from 'axios'
import { API_BASE_URL } from '../config/constants'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token API
export const tokenAPI = {
  getOverview: (timeframe?: string) =>
    apiClient.get('/token/overview', { params: { timeframe } }),
  
  getMintHistory: (limit?: number, offset?: number) =>
    apiClient.get('/token/mints', { params: { limit, offset } }),
  
  getBurnHistory: (limit?: number, offset?: number) =>
    apiClient.get('/token/burns', { params: { limit, offset } }),
  
  getTransferHistory: (limit?: number, offset?: number) =>
    apiClient.get('/token/transfers', { params: { limit, offset } }),
  
  getBlacklistStatus: () =>
    apiClient.get('/token/blacklist'),
  
  getSystemHealth: () =>
    apiClient.get('/system/health'),
}

// Contract interaction helpers
export const formatKomaAmount = (amount: bigint | string): string => {
  const value = typeof amount === 'string' ? BigInt(amount) : amount
  return (Number(value) / 100000000).toFixed(8)
}

export const parseKomaAmount = (amount: string): bigint => {
  return BigInt(Math.floor(parseFloat(amount) * 100000000))
}