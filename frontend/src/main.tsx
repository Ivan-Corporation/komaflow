import React from 'react'
import ReactDOM from 'react-dom/client'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { arbitrum, arbitrumSepolia } from '@reown/appkit/networks'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import App from './App'
import { WalletProvider } from './contexts/WalletContext'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID

if (!projectId) {
  console.warn('VITE_REOWN_PROJECT_ID is not set. Wallet connection will not work.')
}

createAppKit({
  adapters: [new EthersAdapter()],
  networks: [arbitrum, arbitrumSepolia],
  projectId,
  metadata: {
    name: 'Koma Token Dashboard',
    description: 'Manage and monitor Koma token on Arbitrum',
    url: 'http://localhost:5173',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  },
  features: {
    analytics: true,
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <App />
      </WalletProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)