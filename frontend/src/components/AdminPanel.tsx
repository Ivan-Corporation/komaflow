import React, { useState, useEffect } from "react";
import { useWallet } from "../contexts/WalletContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Shield,
  UserX,
  UserCheck,
  Send,
  AlertTriangle,
  Users,
  Info,
  Wallet,
  RefreshCw,
  Key,
  CheckCircle,
  XCircle,
  Flame,
  Package,
  Zap,
  Lock,
  Unlock,
  Copy,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { ethers } from "ethers";

const mintSchema = z.object({
  recipient: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,8})?$/, "Invalid amount (max 8 decimals)")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
});

const burnSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,8})?$/, "Invalid amount (max 8 decimals)")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  from: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
    .optional(),
});

const blacklistSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

type MintFormData = z.infer<typeof mintSchema>;
type BurnFormData = z.infer<typeof burnSchema>;
type BlacklistFormData = z.infer<typeof blacklistSchema>;

export const AdminPanel: React.FC = () => {
  const { isAdmin, isMinter, komaContract, address, signer, provider } =
    useWallet();
  const [isMintLoading, setIsMintLoading] = useState(false);
  const [isBurnLoading, setIsBurnLoading] = useState(false);
  const [isBlacklistLoading, setIsBlacklistLoading] = useState(false);
  const [isGettingAllowance, setIsGettingAllowance] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [hasMinterRole, setHasMinterRole] = useState<boolean | null>(null);
  const [isMinterBlacklisted, setIsMinterBlacklisted] = useState<
    boolean | null
  >(null);
  const [isRecipientBlacklisted, setIsRecipientBlacklisted] = useState<
    boolean | null
  >(null);
  const [balance, setBalance] = useState<string>("0");
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<string>("0");
  const [allowanceInfo, setAllowanceInfo] = useState<{
    address: string;
    allowance: string;
    hasBalance: boolean;
    balance: string;
  } | null>(null);
  const [allowanceStep, setAllowanceStep] = useState<'check' | 'approve' | 'burn'>('check');
  const [isApproving, setIsApproving] = useState(false);
  const [approveTxHash, setApproveTxHash] = useState<string | null>(null);

  const mintForm = useForm<MintFormData>({
    resolver: zodResolver(mintSchema),
    defaultValues: {
      recipient: "0xAbafdb7DeAE484Bc7C7F8fF8792e6EAf5fF9a431",
      amount: "1",
    },
  });

  const burnForm = useForm<BurnFormData>({
    resolver: zodResolver(burnSchema),
    defaultValues: {
      amount: "1",
      from: "",
    },
  });

  const blacklistForm = useForm<BlacklistFormData>({
    resolver: zodResolver(blacklistSchema),
    defaultValues: {
      address: "",
    },
  });

  // Check network, balance, and contract state
  useEffect(() => {
    const checkEverything = async () => {
      if (!komaContract || !address || !provider) return;

      try {
        // Check network
        const network = await provider.getNetwork();
        setNetworkInfo({
          name: network.name,
          chainId: network.chainId,
          isArbitrumSepolia: network.chainId === 421614n,
        });

        // Check ETH balance
        const balanceWei = await provider.getBalance(address);
        setBalance(ethers.formatEther(balanceWei));

        // Check KOMA token balance
        try {
          const tokenBalance = await komaContract.balanceOf(address);
          setUserBalance((Number(tokenBalance) / 100000000).toFixed(8));
        } catch (err) {
          console.warn("Could not fetch token balance:", err);
          setUserBalance("0");
        }

        // Get basic contract info
        const [name, symbol, totalSupply, minterRole] = await Promise.all([
          komaContract.name().catch(() => "Not initialized"),
          komaContract.symbol().catch(() => "N/A"),
          komaContract.totalSupply().catch(() => 0n),
          komaContract.MINTER_ROLE().catch(() => "0x"),
        ]);

        // Check minter status
        const MINTER_ADDRESS = "0xde0CAF7c03FE6f590f35f065981536fBf53232fA";
        let hasRole = false;
        let minterBlacklisted = false;

        try {
          hasRole = await komaContract.hasRole(minterRole, MINTER_ADDRESS);
          minterBlacklisted = await komaContract.isBlacklisted(MINTER_ADDRESS);
        } catch (err) {
          console.warn("Could not check minter status:", err);
        }

        setContractInfo({
          name,
          symbol,
          totalSupply: totalSupply.toString(),
          minterRole,
          isInitialized: name !== "Not initialized",
        });

        setHasMinterRole(hasRole);
        setIsMinterBlacklisted(minterBlacklisted);
      } catch (error) {
        console.error("Error checking state:", error);
      }
    };

    checkEverything();
    const interval = setInterval(checkEverything, 10000);
    return () => clearInterval(interval);
  }, [komaContract, address, provider]);

  // Check recipient blacklist status
  useEffect(() => {
    const checkRecipient = async () => {
      if (!komaContract || !mintForm.watch("recipient")) return;

      const recipient = mintForm.watch("recipient");
      if (!recipient || !recipient.startsWith("0x")) return;

      try {
        const isBlacklisted = await komaContract.isBlacklisted(recipient);
        setIsRecipientBlacklisted(isBlacklisted);
      } catch (err) {
        console.warn("Could not check recipient blacklist:", err);
        setIsRecipientBlacklisted(null);
      }
    };

    const subscription = mintForm.watch((value) => {
      if (value.recipient) checkRecipient();
    });

    return () => subscription.unsubscribe();
  }, [komaContract]);

  const handleMint = async (data: MintFormData) => {
    if (!komaContract || !signer || !provider) {
      setError("Contract, signer, or provider not available");
      return;
    }

    if (networkInfo && !networkInfo.isArbitrumSepolia) {
      setError(`Wrong network. Please switch to Arbitrum Sepolia (Chain ID: 421614)`);
      return;
    }

    const minBalance = ethers.parseEther("0.001");
    const currentBalance = await provider.getBalance(address!);
    if (currentBalance < minBalance) {
      setError(`Insufficient ETH for gas. Balance: ${ethers.formatEther(currentBalance)} ETH`);
      return;
    }

    setIsMintLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const amount = BigInt(Math.floor(parseFloat(data.amount) * 100000000));

      if (amount === 0n) {
        throw new Error("Amount cannot be zero");
      }

      const gasPrice = await provider.getFeeData();
      
      const tx = await komaContract.mint(data.recipient, amount, {
        gasLimit: 300000,
        maxFeePerGas: gasPrice.maxFeePerGas || ethers.parseUnits("0.1", "gwei"),
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas || ethers.parseUnits("0.05", "gwei"),
      });

      setTxHash(tx.hash);
      await tx.wait();

      mintForm.reset();
      setError(null);

      const totalSupply = await komaContract.totalSupply();
      setContractInfo((prev: any) => ({
        ...prev,
        totalSupply: totalSupply.toString(),
      }));

    } catch (err: any) {
      console.error("Mint error details:", err);
      
      let errorMessage = "Failed to mint tokens";
      
      if (err.message.includes("user rejected") || err.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (err.code === "INSUFFICIENT_FUNDS") {
        errorMessage = "Insufficient ETH for transaction gas";
      } else if (err.message.includes("Internal JSON-RPC error")) {
        errorMessage = "Contract error. Possible reasons:\n" +
          "1. Recipient is blacklisted\n" +
          "2. Minter doesn't have MINTER_ROLE\n" +
          "3. Contract not initialized\n" +
          "4. Rate limit reached (wait a few minutes)";
      } else {
        errorMessage = err.message || "Failed to mint tokens";
      }
      
      setError(errorMessage);
    } finally {
      setIsMintLoading(false);
    }
  };

  const handleBurn = async (data: BurnFormData) => {
    if (!komaContract || !signer || !provider) {
      setError("Contract, signer, or provider not available");
      return;
    }

    if (networkInfo && !networkInfo.isArbitrumSepolia) {
      setError(`Wrong network. Please switch to Arbitrum Sepolia (Chain ID: 421614)`);
      return;
    }

    const minBalance = ethers.parseEther("0.001");
    const currentBalance = await provider.getBalance(address!);
    if (currentBalance < minBalance) {
      setError(`Insufficient ETH for gas. Balance: ${ethers.formatEther(currentBalance)} ETH`);
      return;
    }

    setIsBurnLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const amount = BigInt(Math.floor(parseFloat(data.amount) * 100000000));

      if (amount === 0n) {
        throw new Error("Amount cannot be zero");
      }

      const gasPrice = await provider.getFeeData();
      let tx;

      if (data.from?.toLowerCase() === address?.toLowerCase()) {
        // Trying to burn from own wallet - USE burn() function
        console.log("Attempting to burn from own wallet:", {
          amount: amount.toString(),
          amountKoma: data.amount,
          address: address
        });

        // Check balance
        const userTokenBalance = await komaContract.balanceOf(address!);
        console.log("User token balance:", userTokenBalance.toString());
        
        if (userTokenBalance < amount) {
          throw new Error(`Insufficient KOMA balance. You have ${(Number(userTokenBalance) / 100000000).toFixed(8)} KOMA`);
        }

        // Try direct burn - THIS IS THE CORRECT FUNCTION FOR OWN WALLET
        tx = await komaContract.burn(amount, {
          gasLimit: 200000,
          maxFeePerGas: gasPrice.maxFeePerGas || ethers.parseUnits("0.1", "gwei"),
          maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas || ethers.parseUnits("0.05", "gwei"),
        });

      } else {
        // Burn from other address - NEEDS ALLOWANCE using burnFrom()
        if (!data.from) {
          throw new Error("From address is required for burning from other accounts");
        }

        // Check allowance
        const allowance = await komaContract.allowance(data.from, address!);
        console.log("Allowance:", allowance.toString(), "Requested:", amount.toString());
        
        if (allowance < amount) {
          throw new Error(`Insufficient allowance. The account has only allowed ${(Number(allowance) / 100000000).toFixed(8)} KOMA. They need to call approve() first.`);
        }

        // Check target balance
        const targetBalance = await komaContract.balanceOf(data.from);
        if (targetBalance < amount) {
          throw new Error(`Target account has insufficient KOMA balance: ${(Number(targetBalance) / 100000000).toFixed(8)} KOMA`);
        }

        // Use burnFrom for other wallets
        tx = await komaContract.burnFrom(data.from, amount, {
          gasLimit: 250000,
          maxFeePerGas: gasPrice.maxFeePerGas || ethers.parseUnits("0.1", "gwei"),
          maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas || ethers.parseUnits("0.05", "gwei"),
        });
      }

      console.log("Burn transaction submitted:", tx.hash);
      setTxHash(tx.hash);

      const receipt = await tx.wait();
      console.log("Burn transaction confirmed:", receipt);

      // Update state
      burnForm.reset();
      setError(null);
      setAllowanceInfo(null);
      setAllowanceStep('check');

      // Refresh balances
      const [totalSupply, newBalance] = await Promise.all([
        komaContract.totalSupply(),
        komaContract.balanceOf(address!),
      ]);
      
      setContractInfo((prev: any) => ({
        ...prev,
        totalSupply: totalSupply.toString(),
      }));
      
      setUserBalance((Number(newBalance) / 100000000).toFixed(8));
      
    } catch (err: any) {
      console.error("Burn error details:", err);
      
      let errorMessage = "Failed to burn tokens";
      
      if (err.message.includes("user rejected") || err.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (err.code === "INSUFFICIENT_FUNDS") {
        errorMessage = "Insufficient ETH for transaction gas";
      } else if (err.message.includes("Internal JSON-RPC error")) {
        errorMessage = "Contract error. Possible reasons:\n" +
          "1. You are blacklisted\n" +
          "2. Amount exceeds balance\n" +
          "3. Contract restrictions\n" +
          "4. No permission to burn";
      } else {
        errorMessage = err.message || "Failed to burn tokens";
      }
      
      setError(errorMessage);
    } finally {
      setIsBurnLoading(false);
    }
  };

  const handleBlacklist = async (data: BlacklistFormData) => {
    if (!komaContract || !signer) {
      setError("Contract or signer not available");
      return;
    }

    const ADMIN_ADDRESS = "0xAbafdb7DeAE484Bc7C7F8fF8792e6EAf5fF9a431";
    const isConnectedAsAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

    if (!isConnectedAsAdmin) {
      setError(`You must be connected with the admin wallet: ${ADMIN_ADDRESS}`);
      return;
    }

    setIsBlacklistLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const gasPrice = await provider!.getFeeData();
      
      const tx = await komaContract.blacklist(data.address, {
        gasLimit: 200000,
        maxFeePerGas: gasPrice.maxFeePerGas || ethers.parseUnits("0.1", "gwei"),
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas || ethers.parseUnits("0.05", "gwei"),
      });
      
      setTxHash(tx.hash);
      await tx.wait();
      blacklistForm.reset();

      if (data.address.toLowerCase() === "0xde0caf7c03fe6f590f35f065981536fbf53232fa") {
        setIsMinterBlacklisted(true);
      }

      setError(null);
    } catch (err: any) {
      console.error("Blacklist error:", err);
      setError(err.message || "Failed to blacklist address");
    } finally {
      setIsBlacklistLoading(false);
    }
  };

  const handleUnblacklist = async (data: BlacklistFormData) => {
    if (!komaContract || !signer) {
      setError("Contract or signer not available");
      return;
    }

    const ADMIN_ADDRESS = "0xAbafdb7DeAE484Bc7C7F8fF8792e6EAf5fF9a431";
    const isConnectedAsAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

    if (!isConnectedAsAdmin) {
      setError(`You must be connected with the admin wallet: ${ADMIN_ADDRESS}`);
      return;
    }

    setIsBlacklistLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const gasPrice = await provider!.getFeeData();
      
      const tx = await komaContract.unBlacklist(data.address, {
        gasLimit: 200000,
        maxFeePerGas: gasPrice.maxFeePerGas || ethers.parseUnits("0.1", "gwei"),
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas || ethers.parseUnits("0.05", "gwei"),
      });
      
      setTxHash(tx.hash);
      await tx.wait();
      blacklistForm.reset();

      if (data.address.toLowerCase() === "0xde0caf7c03fe6f590f35f065981536fbf53232fa") {
        setIsMinterBlacklisted(false);
      }

      setError(null);
    } catch (err: any) {
      console.error("Unblacklist error:", err);
      setError(err.message || "Failed to unblacklist address");
    } finally {
      setIsBlacklistLoading(false);
    }
  };

  const refreshAll = async () => {
    if (!komaContract || !address || !provider) return;

    try {
      const [balanceWei, tokenBalance] = await Promise.all([
        provider.getBalance(address),
        komaContract.balanceOf(address),
      ]);
      
      setBalance(ethers.formatEther(balanceWei));
      setUserBalance((Number(tokenBalance) / 100000000).toFixed(8));

      if (contractInfo?.isInitialized) {
        const totalSupply = await komaContract.totalSupply();
        setContractInfo((prev: any) => ({
          ...prev,
          totalSupply: totalSupply.toString(),
        }));
      }
    } catch (error) {
      console.error("Refresh error:", error);
    }
  };

  if (!isAdmin && !isMinter) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
          <Key className="w-8 h-8 text-yellow-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Admin Access Required</h3>
        <p className="text-gray-400">
          You need admin or minter privileges to access this panel.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-600 to-orange-600">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Admin Panel</h2>
            <p className="text-gray-400">Manage token permissions and functions</p>
          </div>
        </div>
        <button
          onClick={refreshAll}
          disabled={isMintLoading || isBurnLoading || isBlacklistLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300 font-medium mb-1">Error</p>
              <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
            </div>
          </div>
        </div>
      )}

      {txHash && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
              <Send className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-green-300 font-medium mb-1">Transaction sent!</p>
              <p className="text-sm text-green-400">
                Hash: {txHash.slice(0, 20)}...{txHash.slice(-20)}
              </p>
              <a
                href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-400 hover:text-green-300 underline mt-1 inline-block"
              >
                View on Arbiscan →
              </a>
            </div>
          </div>
        </div>
      )}

      {approveTxHash && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
              <Unlock className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-blue-300 font-medium mb-1">Allowance Approved!</p>
              <p className="text-sm text-blue-400">
                Hash: {approveTxHash.slice(0, 20)}...{approveTxHash.slice(-20)}
              </p>
              <a
                href={`https://sepolia.arbiscan.io/tx/${approveTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 underline mt-1 inline-block"
              >
                View on Arbiscan →
              </a>
              <p className="text-xs text-blue-400 mt-2">
                ✓ Allowance granted. You can now proceed to burn tokens.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Network & Wallet Info */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Wallet Info</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Address:</span>
              <span className="font-mono">{address?.slice(0, 10)}...{address?.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ETH Balance:</span>
              <span className="font-semibold">{parseFloat(balance).toFixed(4)} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">KOMA Balance:</span>
              <span className="font-semibold">{userBalance} KOMA</span>
            </div>
            <div className={`flex justify-between items-center ${parseFloat(balance) < 0.001 ? 'text-red-400' : 'text-green-400'}`}>
              <span>ETH Status:</span>
              <div className="flex items-center gap-1">
                {parseFloat(balance) < 0.001 ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Low balance</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Sufficient</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold">Network Info</h3>
          </div>
          <div className="space-y-2 text-sm">
            {networkInfo ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network:</span>
                  <span className="font-mono">{networkInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Chain ID:</span>
                  <span className="font-mono">{networkInfo.chainId?.toString()}</span>
                </div>
                <div className={`flex justify-between items-center ${networkInfo.isArbitrumSepolia ? 'text-green-400' : 'text-red-400'}`}>
                  <span>Status:</span>
                  <div className="flex items-center gap-1">
                    {networkInfo.isArbitrumSepolia ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Correct</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Wrong</span>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400">Checking network...</p>
            )}
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold">Transaction Status</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Mint:</span>
              {isMintLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-400">Processing...</span>
                </div>
              ) : (
                <span className="text-green-400">Ready</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Burn:</span>
              {isBurnLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-red-400">Processing...</span>
                </div>
              ) : (
                <span className="text-green-400">Ready</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Blacklist:</span>
              {isBlacklistLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-400">Processing...</span>
                </div>
              ) : (
                <span className="text-green-400">Ready</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contract State Info */}
      {contractInfo && (
        <div className="mb-8 p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Contract State</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-gray-400 mb-1">Name:</span>
              <span className="font-semibold">{contractInfo.name}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 mb-1">Symbol:</span>
              <span className="font-semibold">{contractInfo.symbol}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 mb-1">Total Supply:</span>
              <span className="font-semibold">
                {(Number(contractInfo.totalSupply) / 100000000).toFixed(8)} KOMA
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 mb-1">Initialized:</span>
              <span
                className={`font-semibold ${contractInfo.isInitialized ? 'text-green-400' : 'text-red-400'}`}
              >
                {contractInfo.isInitialized ? 'Yes ✓' : 'No ✗'}
              </span>
            </div>
            {hasMinterRole !== null && (
              <div className="flex flex-col">
                <span className="text-gray-400 mb-1">MINTER_ROLE:</span>
                <span
                  className={`font-semibold ${hasMinterRole ? 'text-green-400' : 'text-red-400'}`}
                >
                  {hasMinterRole ? 'Granted ✓' : 'Not Granted ✗'}
                </span>
              </div>
            )}
            {isMinterBlacklisted !== null && (
              <div className="flex flex-col">
                <span className="text-gray-400 mb-1">Minter Status:</span>
                <span
                  className={`font-semibold ${isMinterBlacklisted ? 'text-red-400' : 'text-green-400'}`}
                >
                  {isMinterBlacklisted ? 'Blacklisted ✗' : 'Active ✓'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mint Tokens (for Minters) */}
        {isMinter && contractInfo?.isInitialized && (
          <form
            onSubmit={mintForm.handleSubmit(handleMint)}
            className="space-y-6"
          >
            <div className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Mint Tokens</h3>
                  <p className="text-sm text-gray-400">Create new KOMA tokens</p>
                </div>
                <span className="ml-auto px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                  Minter Only
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Recipient Address
                  </label>
                  <input
                    {...mintForm.register("recipient")}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {mintForm.formState.errors.recipient && (
                    <p className="mt-2 text-sm text-red-400">
                      {mintForm.formState.errors.recipient.message}
                    </p>
                  )}
                  {isRecipientBlacklisted !== null && (
                    <div className={`mt-2 flex items-center gap-2 text-sm ${isRecipientBlacklisted ? 'text-red-400' : 'text-green-400'}`}>
                      {isRecipientBlacklisted ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span>Recipient is blacklisted</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Recipient is not blacklisted</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Amount (KOMA)
                  </label>
                  <input
                    {...mintForm.register("amount")}
                    placeholder="e.g., 1.0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {mintForm.formState.errors.amount && (
                    <p className="mt-2 text-sm text-red-400">
                      {mintForm.formState.errors.amount.message}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    1 KOMA = 100,000,000 units (8 decimals)
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={
                    isMintLoading ||
                    !hasMinterRole ||
                    isMinterBlacklisted ||
                    isRecipientBlacklisted ||
                    parseFloat(balance) < 0.001
                  }
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {isMintLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Minting...
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      {!hasMinterRole
                        ? "MINTER_ROLE Required"
                        : isMinterBlacklisted
                        ? "Minter Blacklisted"
                        : isRecipientBlacklisted
                        ? "Recipient Blacklisted"
                        : parseFloat(balance) < 0.001
                        ? "Insufficient ETH"
                        : "Mint Tokens"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Burn Tokens (for Admins) */}
        {isAdmin && contractInfo?.isInitialized && (
          <form
            onSubmit={burnForm.handleSubmit(handleBurn)}
            className="space-y-6"
          >
            <div className="p-5 bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-600">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Burn Tokens</h3>
                  <p className="text-sm text-gray-400">Permanently destroy KOMA tokens</p>
                </div>
                <span className="ml-auto px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">
                  Admin Only
                </span>
              </div>
              
              <div className="space-y-4">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className={`flex items-center gap-2 ${allowanceStep === 'check' ? 'text-red-400' : 'text-gray-500'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${allowanceStep === 'check' ? 'bg-red-500' : 'bg-gray-700'}`}>
                      1
                    </div>
                    <span className="text-sm">Enter Details</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                  <div className={`flex items-center gap-2 ${allowanceStep === 'approve' ? 'text-yellow-400' : 'text-gray-500'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${allowanceStep === 'approve' ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                      2
                    </div>
                    <span className="text-sm">Get Allowance</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                  <div className={`flex items-center gap-2 ${allowanceStep === 'burn' ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${allowanceStep === 'burn' ? 'bg-green-500' : 'bg-gray-700'}`}>
                      3
                    </div>
                    <span className="text-sm">Execute Burn</span>
                  </div>
                </div>

                {/* Step 1: Enter Address and Amount */}
                {allowanceStep === 'check' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Wallet Address to Burn From
                      </label>
                      <div className="relative">
                        <input
                          {...burnForm.register("from")}
                          placeholder="0x..."
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 pr-24"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (address) {
                              burnForm.setValue('from', address);
                            }
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Use My Wallet
                        </button>
                      </div>
                      {burnForm.formState.errors.from && (
                        <p className="mt-2 text-sm text-red-400">
                          {burnForm.formState.errors.from.message}
                        </p>
                      )}
                      {burnForm.watch("from") === address && (
                        <p className="mt-2 text-xs text-yellow-400">
                          ⚠️ Burning from your own wallet uses the burn() function. Make sure you have the required permissions.
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Amount to Burn (KOMA)
                      </label>
                      <input
                        {...burnForm.register("amount")}
                        placeholder="e.g., 1.0"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      />
                      {burnForm.formState.errors.amount && (
                        <p className="mt-2 text-sm text-red-400">
                          {burnForm.formState.errors.amount.message}
                        </p>
                      )}
                      {burnForm.watch("from") === address && (
                        <p className="mt-2 text-xs text-gray-400">
                          Your KOMA balance: {userBalance} KOMA
                        </p>
                      )}
                    </div>

                    {/* Check Allowance Button */}
                    {burnForm.watch("from") && burnForm.watch("amount") && (
                      <button
                        type="button"
                        onClick={async () => {
                          const fromAddress = burnForm.watch("from")!;
                          const amount = burnForm.watch("amount")!;
                          
                          if (!fromAddress || !amount || !komaContract || !address) return;
                          
                          setIsGettingAllowance(true);
                          try {
                            if (fromAddress.toLowerCase() === address.toLowerCase()) {
                              // For own wallet, check balance only
                              const balance = await komaContract.balanceOf(address);
                              const balanceKoma = (Number(balance) / 100000000).toFixed(8);
                              
                              setAllowanceInfo({
                                address: fromAddress,
                                allowance: "999999999", // Unlimited for own wallet
                                hasBalance: Number(balance) > 0,
                                balance: balanceKoma,
                              });
                              
                              setAllowanceStep('burn');
                            } else {
                              // For other wallet, check allowance
                              const [allowance, balance] = await Promise.all([
                                komaContract.allowance(fromAddress, address),
                                komaContract.balanceOf(fromAddress),
                              ]);
                              
                              const allowanceKoma = (Number(allowance) / 100000000).toFixed(8);
                              const balanceKoma = (Number(balance) / 100000000).toFixed(8);
                              
                              setAllowanceInfo({
                                address: fromAddress,
                                allowance: allowanceKoma,
                                hasBalance: Number(balance) > 0,
                                balance: balanceKoma,
                              });
                              
                              if (parseFloat(allowanceKoma) < parseFloat(amount)) {
                                setAllowanceStep('approve');
                              } else {
                                setAllowanceStep('burn');
                              }
                            }
                          } catch (err) {
                            console.error("Error checking allowance:", err);
                            setError("Failed to check allowance. Make sure the address is valid.");
                          } finally {
                            setIsGettingAllowance(false);
                          }
                        }}
                        disabled={isGettingAllowance}
                        className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isGettingAllowance ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Checking...
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-5 h-5" />
                            Continue to Step 2
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}

                {/* Step 2: Grant Allowance (Only for other wallets) */}
                {allowanceStep === 'approve' && allowanceInfo && burnForm.watch("from") !== address && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
                      <h4 className="font-semibold text-yellow-300 mb-2">Step 2: Get Allowance</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-yellow-400">Target Wallet:</span>
                          <span className="font-mono">{allowanceInfo.address.slice(0, 10)}...{allowanceInfo.address.slice(-8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-400">Current Allowance:</span>
                          <span className={`font-semibold ${parseFloat(allowanceInfo.allowance) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {allowanceInfo.allowance} KOMA
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-400">Wallet Balance:</span>
                          <span className="font-semibold">{allowanceInfo.balance} KOMA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-400">Required Allowance:</span>
                          <span className="font-semibold">{burnForm.watch("amount")} KOMA</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-yellow-500/20">
                          <span className="text-yellow-400">Status:</span>
                          <span className="text-red-400 font-semibold">❌ Insufficient Allowance</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg">
                      <h4 className="font-semibold text-blue-300 mb-2">How to Get Allowance:</h4>
                      <ol className="text-sm text-blue-400 space-y-2 list-decimal list-inside">
                        <li>
                          <span className="font-medium">The wallet owner needs to grant approval:</span>
                          <ul className="ml-4 mt-1 space-y-1 list-disc">
                            <li>Wallet: {allowanceInfo.address.slice(0, 10)}...{allowanceInfo.address.slice(-8)}</li>
                            <li>Must approve your address: {address?.slice(0, 10)}...{address?.slice(-8)}</li>
                            <li>Amount: {burnForm.watch("amount")} KOMA</li>
                          </ul>
                        </li>
                        <li>
                          <span className="font-medium">They need to call:</span>
                          <code className="block mt-1 p-2 bg-black/30 rounded text-xs font-mono break-all">
                            await komaContract.approve("{address}", {Math.floor(parseFloat(burnForm.watch("amount") || "0") * 100000000)})
                          </code>
                        </li>
                        <li>
                          <span className="font-medium">After approval, click "Check Again" below</span>
                        </li>
                      </ol>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAllowanceStep('check')}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setIsGettingAllowance(true);
                          try {
                            const fromAddress = burnForm.watch("from");
                            const amount = burnForm.watch("amount");
                            
                            if (!fromAddress || !amount || !komaContract || !address) return;
                            
                            const [allowance] = await Promise.all([
                              komaContract.allowance(fromAddress, address),
                            ]);
                            
                            const allowanceKoma = (Number(allowance) / 100000000).toFixed(8);
                            
                            setAllowanceInfo(prev => prev ? {
                              ...prev,
                              allowance: allowanceKoma,
                            } : null);
                            
                            if (parseFloat(allowanceKoma) >= parseFloat(amount)) {
                              setAllowanceStep('burn');
                            } else {
                              setError(`Allowance still insufficient. Current: ${allowanceKoma} KOMA, Required: ${amount} KOMA`);
                            }
                          } catch (err) {
                            console.error("Error checking allowance:", err);
                            setError("Failed to check allowance");
                          } finally {
                            setIsGettingAllowance(false);
                          }
                        }}
                        disabled={isGettingAllowance}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isGettingAllowance ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Checking...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-5 h-5" />
                            Check Again
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Execute Burn */}
                {allowanceStep === 'burn' && allowanceInfo && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                      <h4 className="font-semibold text-green-300 mb-2">Step 3: Ready to Burn</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-400">Status:</span>
                          <span className="font-semibold text-green-400">✓ Ready</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-400">Amount:</span>
                          <span className="font-semibold">{burnForm.watch("amount")} KOMA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-400">From Wallet:</span>
                          <span className="font-mono">{allowanceInfo.address.slice(0, 10)}...{allowanceInfo.address.slice(-8)}</span>
                        </div>
                        {burnForm.watch("from") === address ? (
                          <div className="flex justify-between">
                            <span className="text-green-400">Method:</span>
                            <span className="font-semibold">burn() - From Own Wallet</span>
                          </div>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-green-400">Allowed Balance:</span>
                            <span className="font-semibold">{allowanceInfo.allowance} KOMA</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (burnForm.watch("from") === address) {
                            setAllowanceStep('check');
                          } else {
                            setAllowanceStep('approve');
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={
                          isBurnLoading ||
                          parseFloat(balance) < 0.001 ||
                          (burnForm.watch("from") === address && parseFloat(userBalance) < parseFloat(burnForm.watch("amount") || "0"))
                        }
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                      >
                        {isBurnLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Burning...
                          </>
                        ) : (
                          <>
                            <Flame className="w-5 h-5" />
                            {parseFloat(balance) < 0.001
                              ? "Insufficient ETH"
                              : burnForm.watch("from") === address && parseFloat(userBalance) < parseFloat(burnForm.watch("amount") || "0")
                              ? "Insufficient KOMA"
                              : `Burn ${burnForm.watch("from") === address ? 'My' : 'Other'} Tokens`}
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                        <p className="text-xs text-red-400">
                          ⚠️ Warning: Burning is irreversible! Tokens will be permanently destroyed from circulation.
                          {burnForm.watch("from") === address 
                            ? " You are burning from YOUR OWN wallet using burn() function."
                            : " You are burning from another wallet using burnFrom() function."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Blacklist Management (for Admins) */}
        {isAdmin && contractInfo?.isInitialized && (
          <div className="space-y-6">
            <form
              onSubmit={blacklistForm.handleSubmit(handleBlacklist)}
              className="space-y-4"
            >
              <div className="p-5 bg-gradient-to-br from-gray-500/10 to-gray-500/5 border border-gray-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700">
                    <UserX className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Blacklist Address</h3>
                    <p className="text-sm text-gray-400">Prevent an address from transfers</p>
                  </div>
                  <span className="ml-auto px-3 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
                    Admin Only
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Address to Blacklist
                    </label>
                    <input
                      {...blacklistForm.register("address")}
                      placeholder="0x..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20"
                    />
                    {blacklistForm.formState.errors.address && (
                      <p className="mt-2 text-sm text-red-400">
                        {blacklistForm.formState.errors.address.message}
                      </p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isBlacklistLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {isBlacklistLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <UserX className="w-5 h-5" />
                        Blacklist Address
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            <form
              onSubmit={blacklistForm.handleSubmit(handleUnblacklist)}
              className="space-y-4"
            >
              <div className="p-5 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Unblacklist Address</h3>
                    <p className="text-sm text-gray-400">Restore transfer capabilities</p>
                  </div>
                  <span className="ml-auto px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                    Admin Only
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Address to Unblacklist
                    </label>
                    <input
                      {...blacklistForm.register("address")}
                      placeholder="0x..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isBlacklistLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {isBlacklistLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5" />
                        Unblacklist Address
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Permissions Summary */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Your Permissions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <p className="text-sm text-gray-400 mb-1">Minter Role</p>
            <p className={`text-lg font-semibold ${isMinter ? 'text-green-400' : 'text-red-400'}`}>
              {isMinter ? 'Granted ✓' : 'Not Granted ✗'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
            <p className="text-sm text-gray-400 mb-1">Admin Role</p>
            <p className={`text-lg font-semibold ${isAdmin ? 'text-green-400' : 'text-red-400'}`}>
              {isAdmin ? 'Granted ✓' : 'Not Granted ✗'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
            <p className="text-sm text-gray-400 mb-1">Contract Status</p>
            <p className={`text-lg font-semibold ${contractInfo?.isInitialized ? 'text-green-400' : 'text-red-400'}`}>
              {contractInfo?.isInitialized ? 'Initialized ✓' : 'Not Initialized ✗'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
            <p className="text-sm text-gray-400 mb-1">Network</p>
            <p className={`text-lg font-semibold ${networkInfo?.isArbitrumSepolia ? 'text-green-400' : 'text-red-400'}`}>
              {networkInfo?.isArbitrumSepolia ? 'Correct ✓' : 'Wrong ✗'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};