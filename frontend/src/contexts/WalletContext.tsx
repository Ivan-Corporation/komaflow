import React, { createContext, useContext, useState, useEffect } from 'react'
import { BrowserProvider, Contract, JsonRpcProvider, ethers } from 'ethers'
import { useAppKitProvider, useAppKitAccount, useAppKit } from '@reown/appkit/react'
import { CONTRACT_ADDRESSES, CHAIN_CONFIG, ROLE_ADDRESSES } from '../config/constants'
import KomaABI from '../abis/Koma.json'

interface WalletContextType {
  isConnected: boolean
  address: string | null
  chainId: number | null
  provider: ethers.Provider | null
  signer: ethers.Signer | null
  komaContract: Contract | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  isAdmin: boolean
  isMinter: boolean
  isDeployer: boolean
  isLoading: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

// Read RPC (Arbitrum Sepolia)
const READ_RPC = 'https://sepolia-rollup.arbitrum.io/rpc'

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { walletProvider }: any = useAppKitProvider("eip155") || {}
  const { address, isConnected }:any = useAppKitAccount()
  const { open } = useAppKit()
  
  const [chainId, setChainId] = useState<number | null>(null)
  const [provider, setProvider] = useState<ethers.Provider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [komaContract, setKomaContract] = useState<Contract | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMinter, setIsMinter] = useState(false)
  const [isDeployer, setIsDeployer] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Read provider for contract calls
  const readProvider = new JsonRpcProvider(READ_RPC)

  const updateRoles = () => {
    if (!address) {
      setIsAdmin(false)
      setIsMinter(false)
      setIsDeployer(false)
      return
    }

    const lowerAddress = address.toLowerCase()
    const { ADMIN, MINTER, DEPLOYER } = {
      ADMIN: ROLE_ADDRESSES.ADMIN.toLowerCase(),
      MINTER: ROLE_ADDRESSES.MINTER.toLowerCase(),
      DEPLOYER: ROLE_ADDRESSES.DEPLOYER.toLowerCase(),
    }

    // Only check based on address matching (no on-chain calls for now)
    setIsDeployer(lowerAddress === DEPLOYER)
    setIsAdmin(lowerAddress === ADMIN)
    setIsMinter(lowerAddress === MINTER)

    console.log('Role check:', {
      address: lowerAddress,
      ADMIN,
      MINTER,
      DEPLOYER,
      isAdmin: lowerAddress === ADMIN,
      isMinter: lowerAddress === MINTER,
      isDeployer: lowerAddress === DEPLOYER
    })
  }

  const connect = async () => {
    try {
      await open()
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const disconnect = async () => {
    try {
      // Reown handles disconnection automatically
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  // Initialize wallet provider
  useEffect(() => {
    const initializeWallet = async () => {
      if (walletProvider && address) {
        try {
          const browserProvider = new BrowserProvider(walletProvider)
          const network = await browserProvider.getNetwork()
          const signer = await browserProvider.getSigner()
          
          // Create contract instance with signer
          const contract = new Contract(
            CONTRACT_ADDRESSES.KOMA_PROXY,
            KomaABI,
            signer
          )

          setProvider(browserProvider)
          setSigner(signer)
          setChainId(Number(network.chainId))
          setKomaContract(contract)
          
          updateRoles()
        } catch (error) {
          console.error('Error initializing wallet:', error)
        }
      } else {
        setProvider(null)
        setSigner(null)
        setKomaContract(null)
        setIsAdmin(false)
        setIsMinter(false)
        setIsDeployer(false)
      }
    }

    initializeWallet()
  }, [walletProvider, address])

  // Create read-only contract for non-connected users
  useEffect(() => {
    if (!isConnected) {
      const readContract = new Contract(
        CONTRACT_ADDRESSES.KOMA_PROXY,
        KomaABI,
        readProvider
      )
      setKomaContract(readContract)
      updateRoles()
    }
  }, [isConnected])

  // Update roles when address changes
  useEffect(() => {
    updateRoles()
  }, [address])

  return (
    <WalletContext.Provider
      value={{
        isConnected: !!isConnected,
        address,
        chainId,
        provider,
        signer,
        komaContract,
        connect,
        disconnect,
        isAdmin,
        isMinter,
        isDeployer,
        isLoading,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}