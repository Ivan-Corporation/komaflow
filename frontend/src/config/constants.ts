// Development API URL
export const API_BASE_URL = 'http://localhost:4000/api'

// Production API URL (uncomment when deploying)
// export const API_BASE_URL = 'https://your-production-api.com/api'

// Contract addresses
export const CONTRACT_ADDRESSES = {
  KOMA_PROXY: '0xD5EA29d17A8ad6359b64Dee8994AF9250B4d86B9' as const,
} as const

// Role addresses from your environment
export const ROLE_ADDRESSES = {
  DEPLOYER: '0xAbafdb7DeAE484Bc7C7F8fF8792e6EAf5fF9a431',
  ADMIN: '0xAbafdb7DeAE484Bc7C7F8fF8792e6EAf5fF9a431',
  MINTER: '0xde0CAF7c03FE6f590f35f065981536fBf53232fA',
} as const

// RPC URLs
export const RPC_URLS = {
  ARBITRUM_ONE: 'https://arb1.arbitrum.io/rpc',
  ARBITRUM_SEPOLIA: 'https://sepolia-rollup.arbitrum.io/rpc',
} as const

// Token decimals
export const TOKEN_DECIMALS = 8

// Role constants
export const ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6', // keccak256("MINTER_ROLE")
} as const

// Chain configurations
export const CHAIN_CONFIG = {
  arbitrumOne: {
    id: 42161,
    name: 'Arbitrum One',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [RPC_URLS.ARBITRUM_ONE] },
    },
  },
  arbitrumSepolia: {
    id: 421614,
    name: 'Arbitrum Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [RPC_URLS.ARBITRUM_SEPOLIA] },
    },
  },
} as const