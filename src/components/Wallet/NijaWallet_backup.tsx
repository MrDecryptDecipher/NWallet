import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import { toast } from 'react-toastify';
import axios from 'axios';
import ReceivePanel from './ReceivePanel';
import ParentalControlPanel from '@/components/ParentalControl/ParentalControlPanel';
import TransactionModal from './TransactionModal';
import GeneratePhrase from '@/pages/PhraseGeneration/GeneratePhrase';
import EnterMnemonic from '@/pages/PhraseGeneration/EnterMnemonic';
import { ethers } from 'ethers';
import { mnemonicToSeedSync, generateMnemonic } from 'bip39';
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';
import { fetchPricesWithRetry, formatPrice } from '../../services/cryptoService';
import { BrowserProvider, Eip1193Provider } from 'ethers';

export interface ParentalControlSettings {
  enabled: boolean;
  dailyLimit: number;
  allowedAddresses: string[];
  allowedDApps: string[];
  timeRestrictions: {
    start: string;
    end: string;
  };
}

interface LocalGeneratePhraseProps {
  setPhrase: React.Dispatch<React.SetStateAction<string>>;
  setContinueFlag: React.Dispatch<React.SetStateAction<boolean>>;
  setMode: React.Dispatch<React.SetStateAction<"" | "generate" | "enter">>;
}

const LocalGeneratePhrase: React.FC<LocalGeneratePhraseProps> = ({ setPhrase, setContinueFlag, setMode }) => {
  return (
    <div>
      <GeneratePhrase
        setPhrase={setPhrase}
        setContinueFlag={setContinueFlag}
        setMode={setMode}
      />
    </div>
  );
};

export default function NijaWallet() {
  const [ethAddress, setEthAddress] = useState<string>('');
  const [solAddress, setSolAddress] = useState<string>('');
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [ethBalance, setEthBalance] = useState<string>('');
  const [solBalance, setSolBalance] = useState<string>('');
  const [receivePanelVisible, setReceivePanelVisible] = useState<boolean>(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState<boolean>(false);
  const [currentChain, setCurrentChain] = useState<"ETH" | "SOL">("ETH");
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [isParentalControlEnabled, setIsParentalControlEnabled] = useState<boolean>(false);
  const [parentalControlPanelVisible, setParentalControlPanelVisible] = useState<boolean>(false);
  const [mode, setMode] = useState<"" | "generate" | "enter">("");
  const [phrase, setPhrase] = useState<string>("");
  const [continueFlag, setContinueFlag] = useState<boolean>(false);
  const [selectedEthNetwork, setSelectedEthNetwork] = useState<"mainnet" | "sepolia">("sepolia");
  const [selectedSolNetwork, setSelectedSolNetwork] = useState<"mainnet-beta" | "devnet">("devnet");
  const [subaccountMnemonic, setSubaccountMnemonic] = useState<string>("");
  const [isWalletLoading, setIsWalletLoading] = useState<boolean>(true);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [isPriceLoading, setIsPriceLoading] = useState<boolean>(true);
  const [fundingInProgress, setFundingInProgress] = useState<boolean>(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [confirmResolver, setConfirmResolver] = useState<((result: boolean) => void) | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<Array<{
    hash: string;
    from: string;
    to: string;
    value: string;
    chain: 'ETH' | 'SOL';
    timestamp: number;
    status: 'pending' | 'success' | 'failed';
  }>>([]);
  const [gasEstimates, setGasEstimates] = useState<{
    low: { price: string; time: string };
    medium: { price: string; time: string };
    high: { price: string; time: string };
  } | null>(null);
  const [isGasLoading, setIsGasLoading] = useState<boolean>(false);
  const [selectedGasOption, setSelectedGasOption] = useState<'low' | 'medium' | 'high'>('medium');

  const devMnemonic = "pause siege fall laugh jacket plastic domain become mirror anger scare route";
  const alchemyApiKey = "gRcliAnQ2ysaJacOBBlOCd7eT9NxGLd0";
  const ethMainnetUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
  const ethSepoliaUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
  const solMainnetEndpoint = "https://api.mainnet-beta.solana.com";
  const solDevnetEndpoint = "https://api.devnet.solana.com";

  useEffect(() => {
    fetchPrices();
    fetchWalletInfo();
    const priceInterval = setInterval(fetchPrices, 30000);
    const balanceInterval = setInterval(fetchNetworkBalances, 60000);
    return () => {
      clearInterval(priceInterval);
      clearInterval(balanceInterval);
    };
  }, []);

  useEffect(() => {
    if ((mode === "generate" || mode === "enter") && phrase && continueFlag) {
      generateAndStoreWallets(phrase);
      setPhrase("");
      setMode("");
      setContinueFlag(false);
      fetchWalletInfo();
    }
  }, [phrase, mode, continueFlag]);

  useEffect(() => {
    if (ethAddress && solAddress) {
      fetchNetworkBalances();
    }
  }, [ethAddress, solAddress, selectedEthNetwork, selectedSolNetwork]);

  const fetchPrices = useCallback(() => {
    setIsPriceLoading(true);
    
    fetchPricesWithRetry(
      (price: number) => {
        setEthPrice(price);
      },
      (price: number) => {
        setSolPrice(price);
      },
      undefined,
      (loading: boolean) => {
        setIsPriceLoading(loading);
        if (!loading) {
          setLastPriceUpdate(new Date());
        }
      }
    );
  }, []);

  // Modified to show formatted prices with fallback indicators
  const formatCryptoPrice = useCallback((price: number | null, loading: boolean, currency: string) => {
    if (loading) return "Loading...";
    if (price === null) return "N/A";
    
    let formattedPrice = formatPrice(price);
    
    // Check if we might be using fallback data (using the fact that our
    // fallback prices are likely to be exactly matching the static values)
    const usingFallback = 
      (price === 3450.75 && currency === 'ETH') || 
      (price === 145.32 && currency === 'SOL') ||
      (price === 62500.00 && currency === 'BTC');
    
    if (usingFallback) {
      return `${formattedPrice} (est.)`;
    }
    
    return formattedPrice;
  }, []);

  const fetchWalletInfo = useCallback(() => {
    const ethAddress = localStorage.getItem('eth_address');
    const solAddress = localStorage.getItem('sol_address');
    
    if (ethAddress) {
      setEthAddress(ethAddress);
    }
    
    if (solAddress) {
      setSolAddress(solAddress);
    }
    
    // Check for parental control settings
    const parentalControlSettings = localStorage.getItem('parental_control_settings');
    if (parentalControlSettings) {
      try {
        const settings = JSON.parse(parentalControlSettings);
        setIsParentalControlEnabled(settings.enabled || false);
      } catch (error) {
        console.error('Error parsing parental control settings', error);
      }
    }
  }, []);

  const fetchNetworkBalances = async (retryCount = 0) => {
    console.log('Fetching network balances...');
    
    try {
      // Create an abort controller for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Status updates for better UX
      if (retryCount > 0) {
        toast.info(`Retrying balance fetch (Attempt ${retryCount + 1}/3)...`);
      }
      
      // Ethereum balance fetch
      if (ethAddress) {
        try {
          // Determine the correct provider based on network
          const providerUrl = selectedEthNetwork === "mainnet" 
            ? ethMainnetUrl 
            : ethSepoliaUrl;
          
          if (!providerUrl) {
            throw new Error(`No provider URL for ${selectedEthNetwork} network`);
          }
          
          const provider = new ethers.JsonRpcProvider(providerUrl);
          const balance = await provider.getBalance(ethAddress);
          
          // Format balance to 4 decimal places
          const formattedBalance = ethers.formatEther(balance);
          setEthBalance(parseFloat(formattedBalance).toFixed(4));
          
        } catch (error: any) {
          console.error('Error fetching ETH balance:', error);
          
          // Don't show error toast on first attempt
          if (retryCount > 0) {
            toast.error(`Failed to fetch ETH balance: ${error.message}`);
          }
          
          // Keep the old balance but mark it as potentially stale
          if (ethBalance) {
            setEthBalance(prev => prev ? `${prev} (last known)` : '0');
          } else {
            setEthBalance('0');
          }
        }
      }
      
      // Solana balance fetch
      if (solAddress) {
        try {
          // Determine the correct connection based on network
          const endpoint = selectedSolNetwork === "mainnet-beta"
            ? solMainnetEndpoint
            : solDevnetEndpoint;
          
          const connection = new Connection(endpoint);
          const balance = await connection.getBalance(new PublicKey(solAddress));
          
          // Format SOL balance (convert from lamports)
          const formattedBalance = (balance / LAMPORTS_PER_SOL).toFixed(4);
          setSolBalance(formattedBalance);
          
        } catch (error: any) {
          console.error('Error fetching SOL balance:', error);
          
          // Don't show error toast on first attempt
          if (retryCount > 0) {
            toast.error(`Failed to fetch SOL balance: ${error.message}`);
          }
          
          // Keep the old balance but mark it as potentially stale
          if (solBalance) {
            setSolBalance(prev => prev ? `${prev} (last known)` : '0');
          } else {
            setSolBalance('0');
          }
        }
      }
      
      // Clean up timeout
      clearTimeout(timeoutId);
      
    } catch (error: any) {
      console.error('Network balance fetch error:', error);
      
      // Show toast only on final retry
      if (retryCount >= 2) {
        toast.error(`Failed to update balances: ${error.message}`);
      }
      
      // Implement retry with exponential backoff
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Will retry balance fetch in ${delay/1000}s...`);
        
        setTimeout(() => {
          fetchNetworkBalances(retryCount + 1);
        }, delay);
      }
    }
  };

  const openReceivePanel = useCallback((chain: "ETH" | "SOL", address: string) => {
    setCurrentChain(chain);
    setCurrentAddress(address);
    setReceivePanelVisible(true);
  }, []);

  const openTransactionModal = useCallback((chain: "ETH" | "SOL") => {
    setCurrentChain(chain);
    setTransactionModalVisible(true);
  }, []);

  const toggleParentalControl = useCallback(() => {
    setIsParentalControlEnabled(!isParentalControlEnabled);
    setParentalControlPanelVisible(!isParentalControlEnabled);
  }, [isParentalControlEnabled]);

  const deriveSolanaKeyFromMnemonic = (mnemonic: string, accountIndex: number = 0): Uint8Array => {
    const path = `m/44'/501'/${accountIndex}'/0'`;
    const seed = mnemonicToSeedSync(mnemonic);

    function getMasterKeyFromSeed(seed: Uint8Array) {
      const key = new TextEncoder().encode("ed25519 seed");
      const I = hmac(sha512, key, seed);
      const IL = I.slice(0, 32);
      const IR = I.slice(32);
      return { key: IL, chainCode: IR };
    }

    function pathToIndices(path: string) {
      return path.split("/").slice(1).map(p => {
        const hardened = p.endsWith("'");
        let index = parseInt(p.replace("'", ""), 10);
        if (hardened) index += 0x80000000;
        return index;
      });
    }

    function CKDPriv({ key, chainCode }: { key: Uint8Array; chainCode: Uint8Array }, index: number) {
      const idxBuffer = new Uint8Array(4);
      new DataView(idxBuffer.buffer).setUint32(0, index, false);

      const data = new Uint8Array(1 + key.length + 4);
      data[0] = 0;
      data.set(key, 1);
      data.set(idxBuffer, key.length + 1);

      const I = hmac(sha512, chainCode, data);
      const IL = I.slice(0, 32);
      const IR = I.slice(32);
      return { key: IL, chainCode: IR };
    }

    let { key, chainCode } = getMasterKeyFromSeed(seed);
    for (const index of pathToIndices(path)) {
      ({ key, chainCode } = CKDPriv({ key, chainCode }, index));
    }

    return key;
  };

  const generateAndStoreWallets = (mnemonic: string) => {
    try {
      const ethWallet = ethers.Wallet.fromPhrase(mnemonic);
      const ethAddr = ethWallet.address;
      const ethPrivKey = ethWallet.privateKey;

      const solPrivateKey = deriveSolanaKeyFromMnemonic(mnemonic, 0);
      const solKeypair = Keypair.fromSeed(solPrivateKey);
      const solAddr = solKeypair.publicKey.toBase58();

      localStorage.setItem("ethereumAddress", ethAddr);
      localStorage.setItem("ethereumPrivateKey", ethPrivKey);
      localStorage.setItem("solanaAddress", solAddr);

      toast.success("Ethereum and Solana wallets generated and stored successfully.");
    } catch (error) {
      console.error("Error deriving keys:", error);
      toast.error("Failed to derive keys from mnemonic. Please try again.");
    }
  };

  const generateSubaccount = () => {
    const newMnemonic = generateMnemonic();
    const ethSubWallet = ethers.Wallet.fromPhrase(newMnemonic);
    const ethSubAddr = ethSubWallet.address;
    const solSubPrivateKey = deriveSolanaKeyFromMnemonic(newMnemonic, 1);
    const solSubKeypair = Keypair.fromSeed(solSubPrivateKey);
    const solSubAddr = solSubKeypair.publicKey.toBase58();

    localStorage.setItem("subaccountMnemonic", newMnemonic);
    localStorage.setItem("subaccountEthereumAddress", ethSubAddr);
    localStorage.setItem("subaccountSolanaAddress", solSubAddr);

    setSubaccountMnemonic(newMnemonic);
    toast.success("Subaccount mnemonic and addresses generated. Child can import this mnemonic.");
  };

  const fundTestnetAccounts = async () => {
    setFundingInProgress(true);
    
    try {
      await fundSepoliaAccount();
      await fundSolanaDevnetAccount();
      await fetchNetworkBalances();
      toast.success('Test funds requested successfully!');
    } catch (error) {
      console.error('Error requesting test funds:', error);
      toast.error('Failed to request test funds');
    } finally {
      setFundingInProgress(false);
    }
  };

  const fundSepoliaAccount = async () => {
    try {
      // Use Google Cloud's Sepolia faucet
      const googleCloudFaucetUrl = `https://cloud.google.com/application/web3/faucet/ethereum/sepolia?address=${ethAddress}`;
      window.open(googleCloudFaucetUrl, '_blank');
      toast.info('Please complete the request on Google Cloud Sepolia Faucet');
      
      // Set a reminder to refresh balance
      setTimeout(() => {
        toast.info('Remember to refresh your balance after receiving funds');
      }, 30000);
    } catch (error) {
      console.error('Error opening Sepolia faucet:', error);
      toast.error('Failed to open faucet. Please try again later.');
    }
  };

  const fundSolanaDevnetAccount = async () => {
    try {
      // Use official Solana Foundation faucet
      const solanaFaucetUrl = `https://faucet.solana.com/?address=${solAddress}`;
      window.open(solanaFaucetUrl, '_blank');
      toast.info('Please complete the request on Solana Foundation Faucet');
      
      // Set a reminder to refresh balance
      setTimeout(() => {
        toast.info('Remember to refresh your balance after receiving funds');
      }, 30000);
    } catch (error) {
      console.error('Error opening Solana faucet:', error);
      toast.error('Failed to open faucet. Please try again later.');
    }
  };

  const handleTransactionComplete = useCallback(async (recipient: string, amount: string) => {
    setTransactionModalVisible(false);
    
    toast.success(`Transaction of ${amount} ${currentChain} to ${recipient.substring(0, 6)}... initiated`);
    
    // Wait briefly, then refresh balances
    setTimeout(() => {
      fetchNetworkBalances(0);
    }, 3000);
  }, [currentChain]);

  const handleTransactionRequest = async (transaction: any) => {
    // Show transaction popup
    setTransactionModalVisible(true);
    setCurrentTransaction(transaction);
    
    try {
      // Check parental controls
      if (isParentalControlEnabled) {
        const isAllowed = await checkParentalControlLimits(transaction);
        if (!isAllowed) {
          throw new Error('Transaction exceeds parental control limits');
        }
      }
      
      // Show confirmation popup and wait for user action
      const confirmed = await new Promise((resolve) => {
        setConfirmResolver(() => resolve);
      });
      
      setTransactionModalVisible(false);
      
      if (!confirmed) {
        throw new Error('Transaction rejected by user');
      }
      
      // Process transaction
      const result = await processTransaction(transaction);
      
      // Notify NFTGen about the result
      window.postMessage({
        type: 'NIJA_WALLET_TRANSACTION_COMPLETE',
        data: { hash: result.hash, status: 'success' }
      }, '*');
      
      return result.hash;
    } catch (error: any) {
      console.error('Transaction failed:', error);
      toast.error(error.message || 'Transaction failed');
      
      // Notify NFTGen about the failure
      window.postMessage({
        type: 'NIJA_WALLET_TRANSACTION_FAILED',
        data: { error: error.message }
      }, '*');
      
      throw error;
    }
  };

  // Replace the existing TransactionConfirmationModal with this enhanced version
  const TransactionConfirmationModal: React.FC = () => {
    const transaction = currentTransaction;
    const isSigningRequest = transaction?.type === 'signing';
    
    // Handlers for confirm and reject
    const handleReject = () => {
      console.log('Request rejected');
      if (confirmResolver) {
        confirmResolver(false);
        setConfirmResolver(null);
      }
      setTransactionModalVisible(false);
    };
    
    const handleConfirm = () => {
      console.log('Request confirmed');
      if (confirmResolver) {
        confirmResolver(true);
        setConfirmResolver(null);
      }
      setTransactionModalVisible(false);
    };
    
    // Format data to display to the user
    const renderContent = () => {
      if (!transaction) return null;
      
      if (isSigningRequest) {
        // Signing request display
        return (
          <div className="space-y-3 mb-6">
            <h3 className="text-xl font-semibold text-white">Sign Message</h3>
            <div className="flex justify-between">
              <span className="text-slate-400">From:</span> 
              <span className="text-white font-mono">{transaction.from || 'N/A'}</span>
            </div>
            <div className="mt-2">
              <span className="text-slate-400 block mb-2">Message:</span>
              <div className="bg-slate-900 p-3 rounded-md font-mono text-sm text-white break-all max-h-40 overflow-y-auto">
                {transaction.data || 'N/A'}
              </div>
            </div>
          </div>
        );
      } else {
        // Transaction request display
        return (
          <div className="space-y-3 mb-6">
            <h3 className="text-xl font-semibold text-white">Transaction Details</h3>
            <div className="flex justify-between">
              <span className="text-slate-400">From:</span> 
              <span className="text-white font-mono">{transaction.from || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">To:</span> 
              <span className="text-white font-mono">{transaction.to || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Value:</span> 
              <span className="text-white">{transaction.value ? transaction.value + ' ETH' : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gas Limit:</span> 
              <span className="text-white">{transaction.gas || 'N/A'}</span>
            </div>
            {transaction.data && transaction.data !== '0x' && (
              <div className="mt-2">
                <span className="text-slate-400 block mb-2">Data:</span>
                <div className="bg-slate-900 p-3 rounded-md font-mono text-xs text-white break-all max-h-20 overflow-y-auto">
                  {transaction.data}
                </div>
              </div>
            )}
          </div>
        );
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-xl p-6 max-w-md w-full border border-slate-700">
          <h2 className="text-2xl font-bold mb-4 text-white">
            {isSigningRequest ? 'Confirm Signature' : 'Confirm Transaction'}
          </h2>
          
          {renderContent()}
          
          <div className="flex gap-4">
            <button 
              onClick={handleReject}
              className="flex-1 py-3 px-4 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/40 transition-colors font-medium"
            >
              Reject
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/40 transition-colors font-medium"
            >
              {isSigningRequest ? 'Sign' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const checkParentalControlLimits = async (transaction: any): Promise<boolean> => {
    if (!isParentalControlEnabled) return true;
    
    try {
      const settings = JSON.parse(localStorage.getItem('parental_control_settings') || '{}');
      const { dailyLimit, allowedAddresses } = settings;
      
      // Check if recipient is in allowed addresses
      if (allowedAddresses && !allowedAddresses.includes(transaction.to)) {
        toast.error('Recipient address not in allowed list');
        return false;
      }
      
      // Check daily limit
      if (dailyLimit) {
        const value = parseFloat(transaction.value);
        if (value > dailyLimit) {
          toast.error(`Transaction exceeds daily limit of ${dailyLimit} ETH`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking parental controls:', error);
      return false;
    }
  };

  const addTransactionToHistory = useCallback((tx: {
    hash: string;
    from: string;
    to: string;
    value: string;
    chain: 'ETH' | 'SOL';
    status: 'pending' | 'success' | 'failed';
  }) => {
    setTransactionHistory(prev => {
      // Check if transaction already exists in history
      const exists = prev.some(item => item.hash === tx.hash);
      if (exists) {
        // Update existing transaction
        return prev.map(item => 
          item.hash === tx.hash ? { ...item, ...tx } : item
        );
      } else {
        // Add new transaction
        return [{ ...tx, timestamp: Date.now() }, ...prev.slice(0, 9)]; // Keep last 10
      }
    });
    
    // Save to localStorage for persistence
    setTimeout(() => {
      const history = JSON.stringify(transactionHistory);
      localStorage.setItem('transaction_history', history);
    }, 100);
  }, [transactionHistory]);

  const processTransaction = async (transaction: any) => {
    try {
      // Check if window.ethereum exists
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found');
      }
      
      // Cast window.ethereum to Eip1193Provider type
      const ethereumProvider = window.ethereum as Eip1193Provider;
      
      // Get the appropriate web3 provider based on the network
      const provider = new BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();
      
      // Prepare transaction for history
      const txForHistory = {
        hash: '',
        from: transaction.from || ethAddress,
        to: transaction.to,
        value: transaction.value,
        chain: 'ETH' as 'ETH' | 'SOL',
        timestamp: Date.now(),
        status: 'pending' as 'pending' | 'success' | 'failed'
      };
      
      // Send the transaction
      const tx = await signer.sendTransaction({
        to: transaction.to,
        value: ethers.parseEther(transaction.value.toString()),
        gasLimit: transaction.gas ? BigInt(transaction.gas) : undefined,
        data: transaction.data || "0x"
      });
      
      // Update transaction in history with hash
      txForHistory.hash = tx.hash;
      addTransactionToHistory(txForHistory);
      
      // Show success toast with explorer link
      const explorerUrl = selectedEthNetwork === 'sepolia' 
        ? `https://sepolia.etherscan.io/tx/${tx.hash}`
        : `https://etherscan.io/tx/${tx.hash}`;
      
      toast.success(
        <div>
          Transaction sent!
          <a 
            href={explorerUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block text-blue-300 underline mt-1"
          >
            View on Etherscan
          </a>
        </div>
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Update transaction status in history
      txForHistory.status = receipt ? 'success' : 'failed';
      addTransactionToHistory(txForHistory);
      
      return {
        hash: receipt?.hash || tx.hash,
        status: receipt ? 'success' : 'pending'
      };
    } catch (err: any) {
      toast.error(`Transaction failed: ${err.message}`);
      throw new Error(err.message || 'Transaction processing failed');
    }
  };

  // Add a component to display recent transactions
  const TransactionHistoryPanel = () => {
    if (transactionHistory.length === 0) {
      return (
        <div className="text-center text-gray-400 py-4">
          No recent transactions
        </div>
      );
    }
    
    return (
      <div className="max-h-60 overflow-y-auto">
        <h3 className="font-bold text-lg mb-3">Recent Transactions</h3>
        {transactionHistory.map(tx => {
          // Generate explorer URL based on chain and network
          const explorerUrl = tx.chain === 'ETH'
            ? selectedEthNetwork === 'sepolia'
              ? `https://sepolia.etherscan.io/tx/${tx.hash}`
              : `https://etherscan.io/tx/${tx.hash}`
            : selectedSolNetwork === 'devnet'
              ? `https://solscan.io/tx/${tx.hash}?cluster=devnet`
              : `https://solscan.io/tx/${tx.hash}`;
          
          return (
            <div key={tx.hash} className="flex justify-between items-center py-2">
              <span>{tx.from.substring(0, 6)}...{tx.to.substring(tx.to.length - 6)}</span>
              <span>{tx.value} ETH</span>
              <span>{new Date(tx.timestamp).toLocaleString()}</span>
              <span>{tx.status === 'success' ? 'Completed' : 'Failed'}</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 underline"
              >
                View
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  // Memoize the ethereum formatted balance with price
  const formattedEthBalance = useMemo(() => {
    if (!ethBalance || ethBalance.includes('last known')) return ethBalance;
    if (!ethPrice) return ethBalance + ' ETH';
    
    try {
      const balance = parseFloat(ethBalance);
      const valueInUsd = balance * ethPrice;
      return `${balance.toFixed(4)} ETH ($${valueInUsd.toFixed(2)})`;
    } catch (error) {
      console.error('Error formatting ETH balance:', error);
      return ethBalance + ' ETH';
    }
  }, [ethBalance, ethPrice]);

  // Memoize the solana formatted balance with price
  const formattedSolBalance = useMemo(() => {
    if (!solBalance || solBalance.includes('last known')) return solBalance;
    if (!solPrice) return solBalance + ' SOL';
    
    try {
      const balance = parseFloat(solBalance);
      const valueInUsd = balance * solPrice;
      return `${balance.toFixed(4)} SOL ($${valueInUsd.toFixed(2)})`;
    } catch (error) {
      console.error('Error formatting SOL balance:', error);
      return solBalance + ' SOL';
    }
  }, [solBalance, solPrice]);

  // Add a useEffect for price fetching interval
  useEffect(() => {
    // Initial fetch
    fetchPrices();

    // Set up interval for real-time updates (every 30 seconds)
    const interval = setInterval(fetchPrices, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [fetchPrices]); // Note: Dependencies include fetchPrices

  // Fetch gas estimates for Ethereum transactions
  const fetchGasEstimates = useCallback(async () => {
    if (selectedEthNetwork !== 'mainnet') return;
    
    try {
      setIsGasLoading(true);
      // Get gas price from Etherscan API
      const response = await fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken`);
      const data = await response.json();
      
      if (data.status === '1') {
        const baseFeeWei = parseInt(data.result.suggestBaseFee) * 1e9; // Convert to wei
        
        setGasEstimates({
          low: { 
            price: Math.round(parseInt(data.result.SafeGasPrice)).toString(), 
            time: '5-10'
          },
          medium: { 
            price: Math.round(parseInt(data.result.ProposeGasPrice)).toString(), 
            time: '2-5'
          },
          high: { 
            price: Math.round(parseInt(data.result.FastGasPrice)).toString(), 
            time: '<2'
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch gas estimates:", error);
    } finally {
      setIsGasLoading(false);
    }
  }, [selectedEthNetwork]);

  // Create a test transaction function
  const testTransaction = useCallback(async () => {
    if (!ethAddress) return;
    
    // Create a mock transaction for testing the confirmation flow
    const mockTransaction = {
      from: ethAddress,
      to: "0x1234567890123456789012345678901234567890",
      value: "0.001",
      data: "0x",
      gas: "21000",
      network: selectedEthNetwork
    };
    
    // Set the current transaction and show the confirmation modal
    setCurrentTransaction(mockTransaction);
    setTransactionModalVisible(true);
    
    toast.info("Test transaction created - please confirm or reject");
  }, [ethAddress, selectedEthNetwork]);

  // Add useEffect to fetch gas estimates
  useEffect(() => {
    if (selectedEthNetwork === 'mainnet') {
      fetchGasEstimates();
      
      // Refresh gas prices every 2 minutes
      const interval = setInterval(fetchGasEstimates, 120000);
      return () => clearInterval(interval);
    }
  }, [selectedEthNetwork, fetchGasEstimates]);

  // Create a Gas Price Selector component
  const GasPriceSelector = () => {
    if (!gasEstimates || selectedEthNetwork !== 'mainnet') return null;
    
    return (
      <div className="mt-4 bg-slate-800/40 p-3 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Transaction Fee (Gas)</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            className={`p-2 rounded-lg text-xs transition-colors ${
              selectedGasOption === 'low' 
                ? 'bg-blue-500/30 border border-blue-500' 
                : 'bg-slate-700/50 hover:bg-slate-700'
            }`}
            onClick={() => setSelectedGasOption('low')}
          >
            <div className="font-medium">Low</div>
            <div className="text-gray-300">{gasEstimates.low.price} Gwei</div>
            <div className="text-xs text-gray-400">~{gasEstimates.low.time} min</div>
          </button>
          
          <button
            className={`p-2 rounded-lg text-xs transition-colors ${
              selectedGasOption === 'medium' 
                ? 'bg-blue-500/30 border border-blue-500' 
                : 'bg-slate-700/50 hover:bg-slate-700'
            }`}
            onClick={() => setSelectedGasOption('medium')}
          >
            <div className="font-medium">Medium</div>
            <div className="text-gray-300">{gasEstimates.medium.price} Gwei</div>
            <div className="text-xs text-gray-400">~{gasEstimates.medium.time} min</div>
          </button>
          
          <button
            className={`p-2 rounded-lg text-xs transition-colors ${
              selectedGasOption === 'high' 
                ? 'bg-blue-500/30 border border-blue-500' 
                : 'bg-slate-700/50 hover:bg-slate-700'
            }`}
            onClick={() => setSelectedGasOption('high')}
          >
            <div className="font-medium">High</div>
            <div className="text-gray-300">{gasEstimates.high.price} Gwei</div>
            <div className="text-xs text-gray-400">~{gasEstimates.high.time} min</div>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900">
      <div className="container px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="web3outline" onClick={() => window.open('https://dexscreener.com', '_blank')}>
              Browser
            </Button>
            <Button variant="web3outline" onClick={() => window.open('https://scgen.surge.sh/', '_blank')}>
              SCGen
            </Button>
            <Button variant="web3outline" onClick={() => window.open('https://nftgenrtr.surge.sh/', '_blank')}>
              NFTGen
            </Button>
            <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-4xl font-bold">
              NIJA CUSTODIAN WALLET
            </h1>
          </div>
          <Button
            variant="web3outline"
            onClick={toggleParentalControl}
            className="px-6 py-3 text-sm"
          >
            {isParentalControlEnabled ? "Parental Control: ON" : "Parental Control: OFF"}
          </Button>
        </div>

        <div className="flex gap-4 mb-8">
          <div>
            <label className="text-purple-300 block mb-2">Ethereum Network</label>
            <select
              value={selectedEthNetwork}
              onChange={(e) => setSelectedEthNetwork(e.target.value as "mainnet" | "sepolia")}
              className="bg-slate-700 text-white rounded p-2"
            >
              <option value="mainnet">Mainnet</option>
              <option value="sepolia">Sepolia Testnet</option>
            </select>
          </div>
          <div>
            <label className="text-purple-300 block mb-2">Solana Network</label>
            <select
              value={selectedSolNetwork}
              onChange={(e) => setSelectedSolNetwork(e.target.value as "mainnet-beta" | "devnet")}
              className="bg-slate-700 text-white rounded p-2"
            >
              <option value="mainnet-beta">Mainnet-Beta</option>
              <option value="devnet">Devnet</option>
            </select>
          </div>
        </div>

        {isWalletLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {(!ethAddress && !solAddress) && (
              <div className="bg-slate-800 bg-opacity-20 backdrop-blur-lg rounded-lg p-6 mb-8 text-center border border-white/10 shadow-lg">
                <h2 className="text-2xl text-purple-300 mb-4">Set up your wallet</h2>
                <div className="space-y-4">
                  <Button onClick={() => setMode("generate")} className="w-full">
                    Generate New Mnemonic
                  </Button>
                  <Button onClick={() => setMode("enter")} className="w-full">
                    Enter Existing Passphrase
                  </Button>
                </div>
              </div>
            )}

            {mode === "generate" && (
              <div className="bg-slate-800 bg-opacity-20 backdrop-blur-lg rounded-lg p-6 mb-8 text-center border border-white/10 shadow-lg">
                <LocalGeneratePhrase
                  setPhrase={setPhrase}
                  setContinueFlag={setContinueFlag}
                  setMode={setMode}
                />
              </div>
            )}

            {mode === "enter" && (
              <div className="bg-slate-800 bg-opacity-20 backdrop-blur-lg rounded-lg p-6 mb-8 text-center border border-white/10 shadow-lg">
                <EnterMnemonic
                  setPhrase={setPhrase}
                  setContinueFlag={setContinueFlag}
                  setMode={setMode}
                />
              </div>
            )}

            {(ethAddress && solAddress) && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Ethereum Wallet Card */}
                <div className="p-6 bg-slate-800 bg-opacity-20 backdrop-blur-lg rounded-lg border border-white/10 shadow-lg">
                  <h2 className="text-2xl text-purple-300 mb-4">
                    Ethereum Wallet ({selectedEthNetwork === "mainnet" ? "Mainnet" : "Sepolia"})
                  </h2>
                  <div className="mb-4">
                    {isWalletLoading ? (
                      <div className="animate-pulse bg-slate-700 bg-opacity-20 h-10 rounded-lg"></div>
                    ) : (
                      <Input
                        type="text"
                        value={ethAddress}
                        onChange={() => {}}
                        readOnly
                        className="w-full px-4 py-2 rounded-lg bg-slate-700 bg-opacity-20 border border-white/10 text-white"
                        onClick={async () => {
                          await navigator.clipboard.writeText(ethAddress);
                          toast.success("Address copied to clipboard");
                        }}
                      />
                    )}
                  </div>
                  <p className="text-white mb-4">
                    Balance: {isBalanceLoading ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      formattedEthBalance
                    )}
                  </p>

                  {selectedEthNetwork === "sepolia" && ethAddress && (
                    <div className="bg-slate-700 p-4 rounded mb-4">
                      <p className="text-purple-200 mb-2">Get Sepolia Test ETH:</p>
                      <div className="space-y-2">
                        <Button 
                          variant="web3outline" 
                          onClick={fundSepoliaAccount}
                          className="w-full"
                        >
                          Get ETH from Google Cloud Faucet
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="web3" disabled={!ethAddress} onClick={() => openTransactionModal("ETH")}>
                      Send
                    </Button>
                    <Button variant="web3outline" onClick={testTransaction} disabled={!ethAddress}>
                      Test Transaction
                    </Button>
                    <Button
                      variant="web3outline"
                      disabled={!ethAddress}
                      onClick={() => openReceivePanel("ETH", ethAddress)}
                    >
                      Receive
                    </Button>
                  </div>
                </div>

                {/* Solana Wallet Card */}
                <div className="p-6 bg-slate-800 bg-opacity-20 backdrop-blur-lg rounded-lg border border-white/10 shadow-lg">
                  <h2 className="text-2xl text-purple-300 mb-4">
                    Solana Wallet ({selectedSolNetwork === "mainnet-beta" ? "Mainnet-Beta" : "Devnet"})
                  </h2>
                  <div className="mb-4">
                    {isWalletLoading ? (
                      <div className="animate-pulse bg-slate-700 bg-opacity-20 h-10 rounded-lg"></div>
                    ) : (
                      <Input
                        type="text"
                        value={solAddress}
                        onChange={() => {}}
                        readOnly
                        className="w-full px-4 py-2 rounded-lg bg-slate-700 bg-opacity-20 border border-white/10 text-white"
                        onClick={async () => {
                          await navigator.clipboard.writeText(solAddress);
                          toast.success("Address copied to clipboard");
                        }}
                      />
                    )}
                  </div>
                  <p className="text-white mb-4">
                    Balance: {isBalanceLoading ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      formattedSolBalance
                    )}
                  </p>

                  {selectedSolNetwork === "devnet" && solAddress && (
                    <div className="bg-slate-700 p-4 rounded mb-4">
                      <p className="text-purple-200 mb-2">Get Devnet SOL:</p>
                      <div className="space-y-2">
                        <Button 
                          variant="web3outline" 
                          onClick={fundSolanaDevnetAccount}
                          className="w-full"
                        >
                          Get SOL from Solana Faucet
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="web3" disabled={!solAddress} onClick={() => openTransactionModal("SOL")}>
                      Send
                    </Button>
                    <Button
                      variant="web3outline"
                      disabled={!solAddress}
                      onClick={() => openReceivePanel("SOL", solAddress)}
                    >
                      Receive
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {(ethAddress && solAddress) && (
              <div className="text-center mb-8">
                <Button onClick={() => fetchNetworkBalances(0)}>
                  Refresh Balances
                </Button>
              </div>
            )}

            {isParentalControlEnabled && (
              <div className="text-center mb-8">
                <Button variant="web3outline" onClick={generateSubaccount}>
                  Generate Subaccount
                </Button>
                {subaccountMnemonic && (
                  <p className="text-white mt-2 break-all text-sm">
                    Subaccount Mnemonic: {subaccountMnemonic}
                    <br />
                    Child can import this mnemonic and will be restricted by these parental controls.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div className="crypto-info">
          <div className="crypto-name">Ethereum (ETH)</div>
          <div className="crypto-price">
            {isPriceLoading ? (
              <span className="loading">Loading...</span>
            ) : (
              <span>{formatCryptoPrice(ethPrice, isPriceLoading, 'ETH')}</span>
            )}
          </div>
        </div>

        <div className="crypto-info">
          <div className="crypto-name">Solana (SOL)</div>
          <div className="crypto-price">
            {isPriceLoading ? (
              <span className="loading">Loading...</span>
            ) : (
              <span>{formatCryptoPrice(solPrice, isPriceLoading, 'SOL')}</span>
            )}
          </div>
        </div>
      </div>

      <ReceivePanel
        visible={receivePanelVisible}
        setVisible={setReceivePanelVisible}
        chainType={currentChain}
        publicKey={currentAddress}
      />

      <TransactionModal
        visible={transactionModalVisible}
        setVisible={setTransactionModalVisible}
        type={currentChain}
        parentalControlEnabled={isParentalControlEnabled}
        ethPrice={ethPrice}
        solPrice={solPrice}
        onTransactionComplete={handleTransactionComplete}
      />

      {parentalControlPanelVisible && (
        <ParentalControlPanel
          isEnabled={isParentalControlEnabled}
          onToggle={toggleParentalControl}
          onClose={() => setParentalControlPanelVisible(false)}
        />
      )}

      {/* Transaction Confirmation Modal */}
      {transactionModalVisible && currentTransaction && (
        <TransactionConfirmationModal />
      )}
    </div>
  );
}
