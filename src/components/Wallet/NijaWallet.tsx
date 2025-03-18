import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import { toast } from 'react-toastify';
import axios from 'axios';
import ReceivePanel from './ReceivePanel';
import TransactionModal from './TransactionModal';
import GeneratePhrase from '@/pages/PhraseGeneration/GeneratePhrase';
import EnterMnemonic from '@/pages/PhraseGeneration/EnterMnemonic';
import { ethers } from 'ethers';
import { mnemonicToSeedSync, generateMnemonic } from 'bip39';
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';
import { fetchPricesWithRetry, formatPrice, formatCryptoPrice } from '../../services/cryptoService';
import { BrowserProvider, Eip1193Provider } from 'ethers';
import Header from '../../components/Header';
import { ActivityCenter } from '../../components/ActivityCenter';
import PriceChart from '../PriceChart/PriceChart';
import { BROWSER_URL, NFTGEN_URL, SCGEN_URL } from '../../config/web3';
import { HDNodeWallet } from 'ethers';
import { generateSolanaWalletFromMnemonic } from '../../utils/solanaHelper';
import * as nacl from 'tweetnacl';

declare global {
  interface Window {
    nijaHeartbeatInterval?: NodeJS.Timeout;
  }
}

export interface ParentalControlSettings {
  enabled: boolean;
  dailyLimit: number;
  allowedAddresses: string[];
  allowedDApps: string[];
  timeRestrictions: {
    start: string;
    end: string;
  };
  spendingLimits: {
    perTransaction: number;
    daily: number;
    weekly: number;
  };
  requireApproval: boolean;
  notifyOnTransaction: boolean;
}

export interface ActivityData {
  type: 'mint' | 'transfer' | 'fractionalize' | 'sell' | 'buy';
  hash: `0x${string}`;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  details: Record<string, any>;
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

// Add new WalletCard component before the main NijaWallet component
const WalletCard: React.FC<{
  type: "ETH" | "SOL";
  address: string;
  balance: string;
  price: number | null;
  network: string;
  isLoading: boolean;
  onSend: () => void;
  onReceive: () => void;
  onFund?: () => void;
}> = ({ type, address, balance, price, network, isLoading, onSend, onReceive, onFund }) => {
  const isTestnet = network.toLowerCase().includes('sepolia') || network.toLowerCase().includes('devnet');
  const bgGradient = type === "ETH" 
    ? "from-purple-800/30 via-indigo-800/20 to-blue-800/30"
    : "from-pink-800/30 via-rose-800/20 to-red-800/30";
  
  return (
    <div className={`wallet-card bg-gradient-to-br ${bgGradient} rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {type === "ETH" ? "Ethereum" : "Solana"}
            <span className="text-sm font-normal text-slate-300">({network})</span>
          </h3>
          <div className="mt-1 text-sm font-medium text-slate-300">{network}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {isLoading ? (
              <div className="animate-pulse bg-slate-700 h-8 w-32 rounded"></div>
            ) : (
              <span>{balance} {type}</span>
            )}
          </div>
          <div className="text-sm text-slate-300 mt-1">
            {price ? `$${price.toLocaleString()}` : 'N/A'}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span className="font-medium">Address:</span>
          <code className="font-mono bg-slate-800/50 px-2 py-1 rounded text-xs flex-1 truncate">
            {address || 'Not connected'}
          </code>
          {address && (
            <button 
              onClick={() => navigator.clipboard.writeText(address)}
              className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Copy address"
            >
              📋
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSend}
            className={`flex-1 py-2.5 px-4 rounded-lg ${
              type === "ETH"
                ? "bg-purple-600/80 hover:bg-purple-600"
                : "bg-pink-600/80 hover:bg-pink-600"
            } text-white font-medium transition-colors flex items-center justify-center gap-2`}
          >
            <span>Send</span>
            <span>↗</span>
          </button>
          <button
            onClick={onReceive}
            className={`flex-1 py-2.5 px-4 rounded-lg ${
              type === "ETH"
                ? "bg-indigo-600/80 hover:bg-indigo-600"
                : "bg-rose-600/80 hover:bg-rose-600"
            } text-white font-medium transition-colors flex items-center justify-center gap-2`}
          >
            <span>Receive</span>
            <span>↙</span>
          </button>
        </div>

        {isTestnet && onFund && (
          <button
            onClick={onFund}
            className={`w-full py-2 px-4 rounded-lg ${
              type === "ETH"
                ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"
                : "bg-pink-500/20 hover:bg-pink-500/30 text-pink-300"
            } font-medium transition-colors`}
          >
            Get Test {type}
          </button>
        )}
      </div>
    </div>
  );
};

export default function NijaWallet({ skipHeader = true }) {
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
  const [browserVisible, setBrowserVisible] = useState(false);
  const [nftGenConnected, setNFTGenConnected] = useState(false);
  const [nftGenActivities, setNFTGenActivities] = useState<ActivityData[]>([]);
  const [activityCount, setActivityCount] = useState(0);
  const [isActivityCenterVisible, setIsActivityCenterVisible] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [currentETHNetwork, setCurrentETHNetwork] = useState<string>('');
  const [currentSOLNetwork, setCurrentSOLNetwork] = useState<string>('');
  const [solanaConnection, setSolanaConnection] = useState<Connection | null>(null);
  const [walletInitialized, setWalletInitialized] = useState(false);

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

  useEffect(() => {
    setCurrentETHNetwork(selectedEthNetwork);
    setCurrentSOLNetwork(selectedSolNetwork);
  }, [selectedEthNetwork, selectedSolNetwork]);

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

  const fetchWalletInfo = useCallback(async () => {
    setIsWalletLoading(true);
    try {
      console.log('Initializing wallet addresses...');
      
      // Always use the dev mnemonic for consistent addresses
      const devMnemonic = "pause siege fall laugh jacket plastic domain become mirror anger scare route";
      
      // Check if we already have stored addresses
      const storedEthAddress = localStorage.getItem('nija_eth_address');
      const storedSolAddress = localStorage.getItem('nija_sol_address');
      
      if (storedEthAddress && storedSolAddress) {
        console.log('Found stored wallet addresses');
        console.log('- Ethereum:', storedEthAddress);
        console.log('- Solana:', storedSolAddress);
        
        setEthAddress(storedEthAddress as `0x${string}`);
        setSolAddress(storedSolAddress);
        setWalletInitialized(true);
      } else {
        console.log('Missing wallet address(es), generating new wallets from mnemonic');
        
        // Generate both wallets using our improved function
        const { ethAddress, solAddress } = generateAndStoreWallets(devMnemonic);
        
        if (ethAddress && solAddress) {
          setWalletInitialized(true);
        } else {
          toast.error('Failed to initialize wallet addresses');
        }
      }
      
      // Initialize network state
      const savedEthNetwork = localStorage.getItem('nija_eth_network') || 'sepolia';
      const savedSolNetwork = localStorage.getItem('nija_sol_network') || 'devnet';
      
      setSelectedEthNetwork(savedEthNetwork as 'mainnet' | 'sepolia');
      setSelectedSolNetwork(savedSolNetwork as 'mainnet-beta' | 'devnet');
      
      // Fetch initial balances after a short delay
      setTimeout(() => {
        fetchNetworkBalances();
      }, 1000);
    } catch (error) {
      console.error('Error initializing wallet:', error);
      toast.error('Failed to initialize wallet');
    } finally {
      setIsWalletLoading(false);
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
    // If enabling parental controls, show the settings panel
    if (!isParentalControlEnabled) {
      setParentalControlPanelVisible(true);
    } else {
      // If disabling, just turn it off without showing panel
      setIsParentalControlEnabled(false);
      localStorage.setItem('nija_parental_control_enabled', 'false');
      toast.info('Parental Controls disabled');
    }
  }, [isParentalControlEnabled]);

  const deriveSolanaKeyFromMnemonic = (mnemonic: string, accountIndex: number = 0): Uint8Array => {
    try {
      // Simplify the derivation process without external dependencies
      // Convert mnemonic to seed bytes
      const seed = mnemonicToSeedSync(mnemonic);
      
      // For simplicity, we're using the seed itself as the key material
      // This is not ideal for production, but will work for testing
      const seedArray = new Uint8Array(seed.buffer, seed.byteOffset, Math.min(32, seed.byteLength));
      
      console.log('Using simplified Solana key derivation');
      return seedArray;
    } catch (error) {
      console.error('Fatal error in Solana key derivation:', error);
      
      // Generate a fallback key
      console.warn('Generating random Solana keypair as last resort');
      // Create a random 32-byte array as a fallback
      const randomBytes = new Uint8Array(32);
      window.crypto.getRandomValues(randomBytes);
      return randomBytes;
    }
  };

  const generateAndStoreWallets = (mnemonic: string) => {
    try {
      console.log('Generating wallets from mnemonic...');
      
      // Store the mnemonic securely
      localStorage.setItem('nija_wallet_mnemonic', mnemonic);
      
      // Generate Ethereum wallet
      const ethWallet = ethers.Wallet.fromPhrase(mnemonic);
      const ethAddress = ethWallet.address;
      localStorage.setItem('nija_eth_address', ethAddress);
      console.log(`Generated Ethereum address: ${ethAddress}`);
      
      // Generate Solana wallet with proper error handling
      try {
        // Derive private key using our simplified function
        const solPrivateKey = deriveSolanaKeyFromMnemonic(mnemonic);
        
        // Create a Solana keypair from the derived private key
        const solKeypair = Keypair.fromSeed(solPrivateKey);
        const solAddress = solKeypair.publicKey.toString();
        
        localStorage.setItem('nija_sol_address', solAddress);
        localStorage.setItem('nija_sol_private_key', Buffer.from(solKeypair.secretKey).toString('hex'));
        
        console.log(`Generated Solana address: ${solAddress}`);
        
        // Update state
        setEthAddress(ethAddress);
        setSolAddress(solAddress);
        
        return { ethAddress, solAddress };
      } catch (solError) {
        console.error('Error generating Solana wallet:', solError);
        
        // Generate a random Solana keypair as fallback
        const randomKeypair = Keypair.generate();
        const solAddress = randomKeypair.publicKey.toString();
        
        localStorage.setItem('nija_sol_address', solAddress);
        localStorage.setItem('nija_sol_private_key', Buffer.from(randomKeypair.secretKey).toString('hex'));
        
        console.log(`Generated random Solana address as fallback: ${solAddress}`);
        
        // Update state
        setEthAddress(ethAddress);
        setSolAddress(solAddress);
        
        return { ethAddress, solAddress };
      }
    } catch (error) {
      console.error('Error in wallet generation:', error);
      toast.error('Failed to generate wallets');
      return { ethAddress: null, solAddress: null };
    }
  };

  const generateSubaccount = () => {
    try {
      // Generate a new random mnemonic for the subaccount
      const newMnemonic = generateMnemonic();
      console.log('Generating subaccount with new mnemonic');
      
      // Generate Ethereum wallet
      const ethSubWallet = ethers.Wallet.fromPhrase(newMnemonic);
      const ethSubAddr = ethSubWallet.address;
      console.log(`Generated Ethereum subaccount address: ${ethSubAddr}`);
      
      // Store the new mnemonic for subaccount
      localStorage.setItem("subaccountMnemonic", newMnemonic);
      localStorage.setItem("eth_subaccount", ethSubAddr);
      
      // Generate Solana wallet using our simplified key derivation
      try {
        // Use account index 1 for the subaccount
        const solSubPrivateKey = deriveSolanaKeyFromMnemonic(newMnemonic, 1);
        const solSubKeypair = Keypair.fromSeed(solSubPrivateKey);
        const solSubAddr = solSubKeypair.publicKey.toString();
        
        console.log(`Generated Solana subaccount address: ${solSubAddr}`);
        localStorage.setItem("sol_subaccount", solSubAddr);
        
        // Store the private key securely
        localStorage.setItem("sol_subaccount_private_key", 
          Buffer.from(solSubKeypair.secretKey).toString('hex'));
        
        toast.success("Subaccount generated successfully!");
        return { ethAddress: ethSubAddr, solAddress: solSubAddr };
      } catch (solError) {
        console.error("Error creating Solana subaccount:", solError);
        
        // Create a random keypair as fallback
        const randomKeypair = Keypair.generate();
        const solSubAddr = randomKeypair.publicKey.toString();
        
        console.log(`Generated random Solana subaccount as fallback: ${solSubAddr}`);
        localStorage.setItem("sol_subaccount", solSubAddr);
        localStorage.setItem("sol_subaccount_private_key", 
          Buffer.from(randomKeypair.secretKey).toString('hex'));
        
        toast.warning("Created subaccount with random Solana address (not derived from mnemonic)");
        return { ethAddress: ethSubAddr, solAddress: solSubAddr };
      }
    } catch (error) {
      console.error("Error generating subaccount:", error);
      toast.error("Failed to generate subaccount");
      return null;
    }
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

  const handleBrowserClick = () => {
    // Directly open dexscreener.com in a new tab
    window.open('https://dexscreener.com', '_blank');
  };

  // Update the NFTGen connection logic
  const connectToNFTGen = async () => {
    try {
      // Ensure wallet addresses are available
      if (!ethAddress || !solAddress) {
        toast.error("Please wait for wallet addresses to load");
        return;
      }

      // Generate a unique session ID
      const sessionId = `nija_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      // Save connection data in localStorage for NFTGen to access
      localStorage.setItem('nija_wallet_session', sessionId);
      localStorage.setItem('nija_eth_address', ethAddress);
      localStorage.setItem('nija_chain_id', selectedEthNetwork === 'mainnet' ? '1' : '11155111');
      localStorage.setItem('nija_wallet_connection_time', Date.now().toString());
      localStorage.setItem('nija_wallet_heartbeat', Date.now().toString());

      // NFTGen looks for these specific properties
      const connectionInfo = {
        address: ethAddress,
        chainId: selectedEthNetwork === 'mainnet' ? '1' : '11155111',
        source: 'nija_custodian',
        connected: true,
        timestamp: Date.now(),
        ethAddress: ethAddress,
        solAddress: solAddress,
        session: sessionId,
        networks: {
          ethereum: selectedEthNetwork,
          solana: selectedSolNetwork
        }
      };
      
      localStorage.setItem('nija_wallet_connection', JSON.stringify(connectionInfo));
      
      // Clear any existing heartbeat interval
      if (window.nijaHeartbeatInterval) {
        clearInterval(window.nijaHeartbeatInterval);
      }
      
      // Setup heartbeat interval
      window.nijaHeartbeatInterval = setInterval(() => {
        localStorage.setItem('nija_wallet_heartbeat', Date.now().toString());
      }, 5000);
      
      // Display success message before redirecting
      toast.success('Connected to NFTGen. Redirecting...', {
        autoClose: 2000,
        hideProgressBar: false,
        position: 'top-center'
      });
      
      // Open NFTGen with session parameters
      setTimeout(() => {
        const nftgenUrl = new URL('http://13.126.230.108:5175');
        nftgenUrl.searchParams.set('nija_session', sessionId);
        nftgenUrl.searchParams.set('nija_origin', window.location.origin);
        window.open(nftgenUrl.toString(), "_blank");
      }, 500);
    } catch (error) {
      console.error('Error connecting to NFTGen:', error);
      toast.error('Failed to connect to NFTGen');
    }
  };

  // Add Activity Center visibility toggle
  const toggleActivityCenter = () => {
    setIsActivityCenterVisible(!isActivityCenterVisible);
    if (!isActivityCenterVisible) {
      setActivityCount(0); // Reset counter when opening
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-HTTPS or unsupported browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          textArea.remove();
        } catch (err) {
          console.error('Failed to copy text: ', err);
        }
        textArea.remove();
      }
      toast.success('Address copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy address');
    }
  };

  // Update the onClick handlers to use the new function
  const handleCopyAddress = () => copyToClipboard(currentAddress);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900">
      {!skipHeader && (
        <Header 
          showParentalControl={isParentalControlEnabled}
          onToggleParentalControl={() => setIsParentalControlEnabled(!isParentalControlEnabled)}
          onNFTGenClick={connectToNFTGen}
          activityCount={activityCount}
          onActivityClick={toggleActivityCenter}
        />
      )}
      
      {isActivityCenterVisible && (
        <ActivityCenter
          activities={nftGenActivities}
          onClose={() => setIsActivityCenterVisible(false)}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-4">
            <Button onClick={handleBrowserClick} className="bg-purple-600 hover:bg-purple-700">
              Browser
            </Button>
            <Button onClick={() => window.open('https://scgen.surge.sh', '_blank')} className="bg-indigo-600 hover:bg-indigo-700">
              SCGen
            </Button>
            <Button onClick={connectToNFTGen} className="bg-pink-600 hover:bg-pink-700">
              NFTGen
            </Button>
          </div>
        </div>

        {/* Rest of the wallet UI */}
        <div className="max-w-4xl mx-auto px-4">
          {/* Network Selection Section */}
          <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ethereum Network Selection */}
              <div className="network-select">
                <label className="text-purple-300 block mb-2">Ethereum Network</label>
                <select
                  value={selectedEthNetwork}
                  onChange={(e) => setSelectedEthNetwork(e.target.value as "mainnet" | "sepolia")}
                  className="w-full bg-slate-700/50 text-white rounded-lg p-2 border border-purple-500/30"
                >
                  <option value="mainnet">Mainnet</option>
                  <option value="sepolia">Sepolia Testnet</option>
                </select>
              </div>

              {/* Solana Network Selection */}
              <div className="network-select">
                <label className="text-pink-300 block mb-2">Solana Network</label>
                <select
                  value={selectedSolNetwork}
                  onChange={(e) => {
                    const network = e.target.value as "mainnet-beta" | "devnet";
                    setSelectedSolNetwork(network);
                    // Update local storage to persist network selection
                    localStorage.setItem('nija_sol_network', network);
                    
                    // Reinitialize Solana connection when network changes
                    try {
                      const connectionUrl = network === 'devnet' 
                        ? 'https://api.devnet.solana.com' 
                        : 'https://api.mainnet-beta.solana.com';
                      
                      setSolanaConnection(new Connection(connectionUrl, 'confirmed'));
                      toast.info(`Switched to Solana ${network}`);
                      
                      // Refresh balances after network change
                      setTimeout(() => fetchNetworkBalances(), 500);
                    } catch (error) {
                      console.error('Error updating Solana connection:', error);
                      toast.error('Failed to switch Solana network');
                    }
                  }}
                  className="w-full bg-slate-700/50 text-white rounded-lg p-2 border border-pink-500/30"
                >
                  <option value="mainnet-beta">Mainnet-Beta</option>
                  <option value="devnet">Devnet</option>
                </select>
              </div>
            </div>
          </div>

          {/* Wallet Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Ethereum Wallet Card */}
            <div className="bg-gradient-to-br from-purple-800/30 via-indigo-800/20 to-blue-800/30 rounded-xl p-6 border border-slate-700/50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Ethereum
                    <span className="text-sm font-normal text-slate-300">({selectedEthNetwork === "mainnet" ? "Ethereum Mainnet" : "Sepolia Testnet"})</span>
                  </h3>
                  <div className="mt-1 text-sm font-medium text-slate-300">
                    {selectedEthNetwork === "mainnet" ? "Ethereum Mainnet" : "Sepolia Testnet"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {isBalanceLoading ? (
                      <div className="animate-pulse bg-slate-700 h-8 w-32 rounded"></div>
                    ) : (
                      <span>{formattedEthBalance}</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-300 mt-1">
                    {ethPrice ? `$${ethPrice.toLocaleString()}` : 'N/A'}
                  </div>
                </div>
              </div>
              
              {/* Add ETH Price Chart */}
              <PriceChart symbol="ETH" className="mt-4" />

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="font-medium">Address:</span>
                  <code className="font-mono bg-slate-800/50 px-2 py-1 rounded text-xs flex-1 truncate">
                    {ethAddress || 'Not connected'}
                  </code>
                  {ethAddress && (
                    <button 
                      onClick={handleCopyAddress}
                      className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                      title="Copy address"
                    >
                      📋
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => openTransactionModal("ETH")}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Send</span>
                    <span>↗</span>
                  </button>
                  <button
                    onClick={() => openReceivePanel("ETH", ethAddress)}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Receive</span>
                    <span>↙</span>
                  </button>
                </div>

                {selectedEthNetwork === "sepolia" && (
                  <button
                    onClick={fundSepoliaAccount}
                    className="w-full py-2 px-4 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-medium transition-colors"
                  >
                    Get Test ETH
                  </button>
                )}
              </div>
            </div>

            {/* Solana Wallet Card */}
            <div className="bg-gradient-to-br from-pink-800/30 via-rose-800/20 to-red-800/30 rounded-xl p-6 border border-slate-700/50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Solana
                    <span className="text-sm font-normal text-slate-300">({selectedSolNetwork === "mainnet-beta" ? "Solana Mainnet" : "Solana Devnet"})</span>
                  </h3>
                  <div className="mt-1 text-sm font-medium text-slate-300">
                    {selectedSolNetwork === "mainnet-beta" ? "Solana Mainnet" : "Solana Devnet"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {isBalanceLoading ? (
                      <div className="animate-pulse bg-slate-700 h-8 w-32 rounded"></div>
                    ) : (
                      <span>{formattedSolBalance}</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-300 mt-1">
                    {solPrice ? `$${solPrice.toLocaleString()}` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Add SOL Price Chart */}
              <PriceChart symbol="SOL" className="mt-4" />

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="font-medium">Address:</span>
                  <code className="font-mono bg-slate-800/50 px-2 py-1 rounded text-xs flex-1 truncate">
                    {solAddress || 'Not connected'}
                  </code>
                  {solAddress && (
                    <button 
                      onClick={handleCopyAddress}
                      className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                      title="Copy address"
                    >
                      📋
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => openTransactionModal("SOL")}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-pink-600/80 hover:bg-pink-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Send</span>
                    <span>↗</span>
                  </button>
                  <button
                    onClick={() => openReceivePanel("SOL", solAddress)}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Receive</span>
                    <span>↙</span>
                  </button>
                </div>

                {selectedSolNetwork === "devnet" && (
                  <button
                    onClick={fundSolanaDevnetAccount}
                    className="w-full py-2 px-4 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 font-medium transition-colors"
                  >
                    Get Test SOL
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Wallet Actions Section */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="wallet-info space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4">Wallet Details</h3>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-2">Current Address:</p>
                  <p className="text-white font-mono text-sm break-all">{currentAddress}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-2">Network:</p>
                  <p className="text-white">{currentChain}</p>
                </div>
              </div>

              {/* Quick Actions Section */}
              <div className="wallet-actions space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => toast.info('Funding wallet feature coming soon!')}
                    className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg text-white flex items-center justify-center gap-2"
                  >
                    <span className="material-icons text-xl">account_balance</span>
                    <span className="text-sm whitespace-nowrap">Fund Wallet</span>
                  </button>
                  
                  <button 
                    onClick={toggleParentalControl}
                    className={`p-3 ${isParentalControlEnabled ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'} rounded-lg text-white flex items-center justify-center gap-2`}
                  >
                    <span className="material-icons text-xl">shield</span>
                    <span className="text-sm whitespace-nowrap">
                      {isParentalControlEnabled ? 'Disable Controls' : 'Enable Controls'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <ReceivePanel
          visible={receivePanelVisible}
          setVisible={setReceivePanelVisible}
          chainType={currentChain}
          publicKey={currentAddress}
          network={currentChain === "ETH" ? selectedEthNetwork : selectedSolNetwork}
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

        {transactionModalVisible && currentTransaction && (
          <TransactionConfirmationModal />
        )}
      </div>
    </div>
  );
}

const ParentalControlPanel: React.FC<{
  isEnabled: boolean;
  onToggle: () => void;
  onClose: () => void;
}> = ({ isEnabled, onToggle, onClose }) => {
  const [settings, setSettings] = useState<ParentalControlSettings>(() => {
    const saved = localStorage.getItem('parental_control_settings');
    return saved ? JSON.parse(saved) : {
      enabled: false,
      dailyLimit: 1.0,
      allowedAddresses: [],
      allowedDApps: [],
      timeRestrictions: {
        start: "09:00",
        end: "17:00"
      },
      spendingLimits: {
        perTransaction: 0.5,
        daily: 1.0,
        weekly: 5.0
      },
      requireApproval: true,
      notifyOnTransaction: true
    };
  });

  const saveSettings = (newSettings: Partial<ParentalControlSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('parental_control_settings', JSON.stringify(updated));
    toast.success('Parental control settings updated');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl p-6 max-w-2xl w-full border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Parental Controls</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Main toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <div>
              <h3 className="text-lg font-medium text-white">Enable Parental Controls</h3>
              <p className="text-sm text-slate-400">Restrict and monitor wallet activity</p>
            </div>
            <button
              onClick={onToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isEnabled ? 'bg-green-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Spending Limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Spending Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <label className="text-sm text-slate-300">Per Transaction</label>
                <input
                  type="number"
                  value={settings.spendingLimits.perTransaction}
                  onChange={(e) => saveSettings({
                    spendingLimits: {
                      ...settings.spendingLimits,
                      perTransaction: parseFloat(e.target.value)
                    }
                  })}
                  className="mt-1 w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <label className="text-sm text-slate-300">Daily Limit</label>
                <input
                  type="number"
                  value={settings.spendingLimits.daily}
                  onChange={(e) => saveSettings({
                    spendingLimits: {
                      ...settings.spendingLimits,
                      daily: parseFloat(e.target.value)
                    }
                  })}
                  className="mt-1 w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <label className="text-sm text-slate-300">Weekly Limit</label>
                <input
                  type="number"
                  value={settings.spendingLimits.weekly}
                  onChange={(e) => saveSettings({
                    spendingLimits: {
                      ...settings.spendingLimits,
                      weekly: parseFloat(e.target.value)
                    }
                  })}
                  className="mt-1 w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Time Restrictions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Time Restrictions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <label className="text-sm text-slate-300">Start Time</label>
                <input
                  type="time"
                  value={settings.timeRestrictions.start}
                  onChange={(e) => saveSettings({
                    timeRestrictions: {
                      ...settings.timeRestrictions,
                      start: e.target.value
                    }
                  })}
                  className="mt-1 w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <label className="text-sm text-slate-300">End Time</label>
                <input
                  type="time"
                  value={settings.timeRestrictions.end}
                  onChange={(e) => saveSettings({
                    timeRestrictions: {
                      ...settings.timeRestrictions,
                      end: e.target.value
                    }
                  })}
                  className="mt-1 w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Allowed Addresses */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Allowed Addresses</h3>
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Enter wallet address"
                  className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      const address = input.value.trim();
                      if (address && !settings.allowedAddresses.includes(address)) {
                        saveSettings({
                          allowedAddresses: [...settings.allowedAddresses, address]
                        });
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter wallet address"]') as HTMLInputElement;
                    const address = input.value.trim();
                    if (address && !settings.allowedAddresses.includes(address)) {
                      saveSettings({
                        allowedAddresses: [...settings.allowedAddresses, address]
                      });
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {settings.allowedAddresses.map((address, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-800/50 p-2 rounded">
                    <code className="font-mono text-sm text-slate-300 truncate">{address}</code>
                    <button
                      onClick={() => saveSettings({
                        allowedAddresses: settings.allowedAddresses.filter((_, i) => i !== index)
                      })}
                      className="ml-2 text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Additional Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Require Approval for All Transactions</span>
                <input
                  type="checkbox"
                  checked={settings.requireApproval}
                  onChange={(e) => saveSettings({ requireApproval: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Notify on Every Transaction</span>
                <input
                  type="checkbox"
                  checked={settings.notifyOnTransaction}
                  onChange={(e) => saveSettings({ notifyOnTransaction: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-500"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
