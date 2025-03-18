import React, { useEffect, useState, useCallback } from 'react';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import { toast } from 'react-toastify';
import axios from 'axios';
import ReceivePanel from '@/components/ReceivePanel';
import ParentalControlPanel from '@/components/ParentalControl/ParentalControlPanel';
import TransactionModal from '@/components/TransactionModal';
import { ethers } from 'ethers';
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useNavigate } from 'react-router-dom';
import { SunIcon } from '@heroicons/react/24/outline';
import { binanceService } from '@/services/binanceService';
import { PriceChart } from '../components/PriceChart/PriceChart';
import './NijaWallet.css';
import { Chart, ChartConfiguration } from 'chart.js/auto';

// Define provider types
interface Eip1193Request {
  method: string;
  params?: any[] | Record<string, any>;
}

interface NijaWalletProvider {
  isNijaWallet: boolean;
  name: string;
  isMetaMask?: boolean;
  request(args: Eip1193Request): Promise<any>;
  on(event: string, callback: (...args: any[]) => void): void;
  removeListener(event: string, callback: (...args: any[]) => void): void;
}

declare global {
  var ethereum: NijaWalletProvider | undefined;
  var nijaWalletProvider: NijaWalletProvider | undefined;
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
}

// Add this outside the component
let ethereumChart: Chart | null = null;
let solanaChart: Chart | null = null;

interface TransactionParams {
  from?: string;
  to: string;
  value?: string | number;
  data?: string;
  gas?: string | number;
  gasPrice?: string | number;
  nonce?: number;
  chainId?: number;
}

export default function NijaWallet() {
  const navigate = useNavigate();
  const [ethAddress, setEthAddress] = useState<string>('');
  const [solAddress, setSolAddress] = useState<string>('');
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [ethBalance, setEthBalance] = useState<string>('0.00');
  const [solBalance, setSolBalance] = useState<string>('0.00');
  const [receivePanelVisible, setReceivePanelVisible] = useState<boolean>(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState<boolean>(false);
  const [currentChain, setCurrentChain] = useState<"ETH" | "SOL">("ETH");
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [isParentalControlEnabled, setIsParentalControlEnabled] = useState<boolean>(false);
  const [parentalControlPanelVisible, setParentalControlPanelVisible] = useState<boolean>(false);
  const [selectedEthNetwork, setSelectedEthNetwork] = useState<"mainnet" | "sepolia">("sepolia");
  const [selectedSolNetwork, setSelectedSolNetwork] = useState<"mainnet-beta" | "devnet">("devnet");
  const [browserVisible, setBrowserVisible] = useState<boolean>(false);
  const [isWalletLoading, setIsWalletLoading] = useState<boolean>(true);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"1H" | "1D" | "1W" | "1M">("1D");

  const alchemyApiKey = "gRcliAnQ2ysaJacOBBlOCd7eT9NxGLd0";
  const ethMainnetUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
  const ethSepoliaUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
  const solMainnetEndpoint = "https://api.mainnet-beta.solana.com";
  const solDevnetEndpoint = "https://api.devnet.solana.com";

  const createPriceChart = useCallback((canvasId: string, data: any[], label: string) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy existing chart instance
    if (canvasId === 'ethereumChart' && ethereumChart) {
      ethereumChart.destroy();
      ethereumChart = null;
    } else if (canvasId === 'solanaChart' && solanaChart) {
      solanaChart.destroy();
      solanaChart = null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map(d => new Date(d.time).toLocaleTimeString()),
        datasets: [{
          label: label,
          data: data.map(d => d.price),
          borderColor: '#8b5cf6',
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            display: false
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#9ca3af'
            }
          }
        }
      }
    };

    const newChart = new Chart(ctx, config);
    if (canvasId === 'ethereumChart') {
      ethereumChart = newChart;
    } else if (canvasId === 'solanaChart') {
      solanaChart = newChart;
    }
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const [ethPrice, solPrice] = await Promise.all([
          binanceService.getSymbolPrice('ETHUSDT'),
          binanceService.getSymbolPrice('SOLUSDT')
        ]);
        
        setEthPrice(ethPrice);
        setSolPrice(solPrice);

        // Fetch historical data and create charts
        const [ethKlines, solKlines] = await Promise.all([
          binanceService.getKlines('ETHUSDT', '1h'),
          binanceService.getKlines('SOLUSDT', '1h')
        ]);

        createPriceChart('ethereumChart', ethKlines.map(k => ({
          time: k.openTime,
          price: parseFloat(k.close)
        })), 'ETH/USDT');

        createPriceChart('solanaChart', solKlines.map(k => ({
          time: k.openTime,
          price: parseFloat(k.close)
        })), 'SOL/USDT');

      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // Update every 10 seconds

    return () => {
      clearInterval(interval);
      // Cleanup charts on unmount
      if (ethereumChart) ethereumChart.destroy();
      if (solanaChart) solanaChart.destroy();
    };
  }, [createPriceChart]);

  useEffect(() => {
    fetchWalletInfo();
    const priceInterval = setInterval(fetchWalletInfo, 30000);
    return () => clearInterval(priceInterval);
  }, []);

  useEffect(() => {
    if (ethAddress && solAddress) {
      fetchNetworkBalances();
    }
  }, [ethAddress, solAddress, selectedEthNetwork, selectedSolNetwork]);

  const fetchWalletInfo = () => {
    setIsWalletLoading(true);
    try {
      const storedEthAddress = localStorage.getItem("ethereumAddress");
      const storedSolAddress = localStorage.getItem("solanaAddress");

      if (storedEthAddress && storedSolAddress) {
        setEthAddress(storedEthAddress);
        setSolAddress(storedSolAddress);
        fetchNetworkBalances();
      } else {
        initWallets();
      }
    } catch (error) {
      console.error("Error fetching wallet info:", error);
      toast.error("Failed to load wallet information");
    } finally {
      setIsWalletLoading(false);
    }
  };

  const fetchNetworkBalances = async () => {
    if (!ethAddress || !solAddress) return;
    
    setIsBalanceLoading(true);
    try {
      const ethProviderUrl = selectedEthNetwork === "mainnet" ? ethMainnetUrl : ethSepoliaUrl;
      const ethProvider = new ethers.JsonRpcProvider(ethProviderUrl);
      const ethBalanceBN = await ethProvider.getBalance(ethAddress);
      setEthBalance(ethers.formatEther(ethBalanceBN));

      const solEndpoint = selectedSolNetwork === "mainnet-beta" ? solMainnetEndpoint : solDevnetEndpoint;
      const connection = new Connection(solEndpoint);
      const solBalanceLamports = await connection.getBalance(new PublicKey(solAddress));
      setSolBalance((solBalanceLamports / LAMPORTS_PER_SOL).toFixed(4));
    } catch (error) {
      console.error("Error fetching balances:", error);
      toast.error("Failed to fetch wallet balances");
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard!');
  };

  const toggleParentalControl = () => {
    if (!isParentalControlEnabled) {
      setParentalControlPanelVisible(true);
    } else {
      setIsParentalControlEnabled(false);
    }
  };

  const openTransactionModal = (chain: "ETH" | "SOL") => {
    setCurrentChain(chain);
    setTransactionModalVisible(true);
  };

  const openReceivePanel = (chain: "ETH" | "SOL", address: string) => {
    setCurrentChain(chain);
    setCurrentAddress(address);
    setReceivePanelVisible(true);
  };

  // Move initWallets declaration before it's used
    const initWallets = async () => {
      try {
        // Initialize Ethereum wallet
        let ethWallet;
        const storedEthPrivateKey = localStorage.getItem("ethereumPrivateKey");
        
        if (storedEthPrivateKey) {
          // Use existing wallet
          ethWallet = new ethers.Wallet(storedEthPrivateKey);
        } else {
          // Create new wallet
          ethWallet = ethers.Wallet.createRandom();
          localStorage.setItem("ethereumPrivateKey", ethWallet.privateKey);
        }
        
        setEthAddress(ethWallet.address);
        localStorage.setItem("ethereumAddress", ethWallet.address);

        // Initialize Solana wallet
        let solanaKeypair;
        const storedSolanaKeypair = localStorage.getItem('solanaKeypair');
        
        if (storedSolanaKeypair) {
          // Use existing keypair
          const { publicKey, privateKey } = JSON.parse(storedSolanaKeypair);
          solanaKeypair = Keypair.fromSecretKey(Uint8Array.from(privateKey));
        } else {
          // Create new keypair
          solanaKeypair = Keypair.generate();
          localStorage.setItem('solanaKeypair', JSON.stringify({
            publicKey: solanaKeypair.publicKey.toString(),
            privateKey: Array.from(solanaKeypair.secretKey)
          }));
        }

        setSolAddress(solanaKeypair.publicKey.toString());
        localStorage.setItem("solanaAddress", solanaKeypair.publicKey.toString());

        // Save wallet addresses to API
        try {
          const response = await fetch('/api/wallet/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ethereumAddress: ethWallet.address,
              solanaAddress: solanaKeypair.publicKey.toString()
            })
          });

          if (!response.ok) {
            console.error('Failed to save wallet addresses to API');
          }
        } catch (error) {
          console.error('Error saving wallet addresses:', error);
        }

        // Fetch initial balances
        const ethProviderUrl = selectedEthNetwork === "mainnet" ? ethMainnetUrl : ethSepoliaUrl;
        const ethProvider = new ethers.JsonRpcProvider(ethProviderUrl);
        const ethBalanceBN = await ethProvider.getBalance(ethWallet.address);
        setEthBalance(ethers.formatEther(ethBalanceBN));

        const solConnection = new Connection(selectedSolNetwork === "mainnet-beta" ? solMainnetEndpoint : solDevnetEndpoint);
        const solBalanceLamports = await solConnection.getBalance(solanaKeypair.publicKey);
        setSolBalance((solBalanceLamports / LAMPORTS_PER_SOL).toFixed(4));

        // Inject our provider
        window.nijaWalletProvider = injectNijaWalletProvider();
        window.ethereum = window.nijaWalletProvider;

        toast.success('Wallets initialized successfully!');
      } catch (error) {
        console.error('Error initializing wallets:', error);
        toast.error('Error initializing wallets. Please try again.');
      }
    };

  const injectNijaWalletProvider = (): NijaWalletProvider => {
    const provider: NijaWalletProvider = {
      isNijaWallet: true,
      name: 'Nija Wallet',
      request: async (args: Eip1193Request): Promise<any> => {
        const ethPrivateKey = localStorage.getItem("ethereumPrivateKey");
        if (!ethPrivateKey) throw new Error("Wallet not initialized");
        
        const wallet = new ethers.Wallet(ethPrivateKey);
        
        switch (args.method) {
          case 'eth_requestAccounts':
          case 'eth_accounts':
            return [wallet.address];
          case 'eth_chainId':
            return selectedEthNetwork === 'mainnet' ? '0x1' : '0xaa36a7';
          case 'eth_sendTransaction':
            // Handle transaction signing
            if (!args.params || !Array.isArray(args.params)) {
              throw new Error("Invalid transaction params");
            }
            const rawTx = args.params[0] as TransactionParams;
            if (!rawTx) throw new Error("Invalid transaction params");
            
            // Convert hex strings to numbers where needed
            const tx = {
              ...rawTx,
              nonce: rawTx.nonce || await wallet.getNonce(),
              gasPrice: rawTx.gasPrice ? BigInt(rawTx.gasPrice) : undefined,
              value: rawTx.value ? BigInt(rawTx.value) : undefined,
              chainId: rawTx.chainId || (selectedEthNetwork === 'mainnet' ? 1 : 11155111) // Sepolia chainId
            };
            
            const signedTx = await wallet.signTransaction(tx);
            return signedTx;
          default:
            throw new Error(`Method ${args.method} not supported`);
        }
      },
      on: (event: string, callback: (...args: any[]) => void) => {
        // Handle subscription events
        switch (event) {
          case 'accountsChanged':
            callback([ethAddress]);
            break;
          case 'chainChanged':
            callback(selectedEthNetwork === 'mainnet' ? '0x1' : '0xaa36a7');
            break;
        }
      },
      removeListener: (event: string, callback: (...args: any[]) => void) => {
        // Cleanup event listeners
      }
    };
    
    return provider;
  };

  // Add useEffect hook for initialization
  useEffect(() => {
    initWallets();
  }, [selectedEthNetwork, selectedSolNetwork, ethMainnetUrl, ethSepoliaUrl, solMainnetEndpoint, solDevnetEndpoint]);

  // Handle receive button click
  const handleReceive = (type: 'eth' | 'sol') => {
    const address = type === 'eth' ? ethAddress : solAddress;
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard!');
    }
  };

  // Handle send button click
  const handleSend = (type: 'eth' | 'sol') => {
    // Implement send functionality
    toast.info('Send functionality coming soon!');
  };

  // Handle get test tokens
  const handleGetTestTokens = async (type: 'eth' | 'sol') => {
    try {
      if (type === 'eth') {
        // Redirect to Google Cloud's Sepolia faucet
        window.open('https://cloud.google.com/application/web3/faucet/ethereum/sepolia', '_blank');
      } else {
        // Redirect to Solana faucet
        window.open('https://faucet.solana.com/', '_blank');
      }
    } catch (error) {
      console.error('Error getting test tokens:', error);
      toast.error('Failed to get test tokens. Please try again.');
    }
  };

  const handleNFTGenClick = async () => {
    try {
      // Create a session with the current wallet info
      const sessionData = {
        address: ethAddress,
        chainId: selectedEthNetwork === 'mainnet' ? '0x1' : '0xaa36a7',
        timestamp: Date.now()
      };

      // Store session data in localStorage
      localStorage.setItem('nija_wallet_session', JSON.stringify(sessionData));
      
      // Open NFTGen with the session parameter
      const sessionParam = encodeURIComponent(JSON.stringify(sessionData));
      window.open(`http://3.111.22.56:5175?session=${sessionParam}`, '_blank');
    } catch (error) {
      console.error('Error creating NFTGen session:', error);
      toast.error('Failed to connect to NFTGen');
    }
  };

  // Browser button handler
  const handleBrowserClick = () => {
    // Redirect to DexScreener
    window.open('https://dexscreener.com/', '_blank');
    setBrowserVisible(false); // Reset state if using it for other purposes
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800">
        <nav className="mx-auto flex items-center justify-between p-4 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <h1 className="text-xl font-bold text-white">NIJA CUSTODIAN WALLET</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="web3outline"
              onClick={handleBrowserClick}
            >
              Browser
            </Button>
            <Button
              variant="web3outline"
              onClick={() => window.open('https://scgen.surge.sh/', '_blank')}
            >
              SCGen
            </Button>
            <Button
              variant="web3outline"
              onClick={handleNFTGenClick}
            >
              Open NFTGen
            </Button>
            <Button
              onClick={toggleParentalControl}
              variant="web3outline"
            >
              Parental Control: {isParentalControlEnabled ? 'ON' : 'OFF'}
            </Button>
            <SunIcon className="h-6 w-6 text-yellow-400 cursor-pointer" />
          </div>
        </nav>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Rest of the wallet content */}
        <div className="network-sections">
          {/* Ethereum card */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Ethereum Network</h2>
            <select
              value={selectedEthNetwork}
              onChange={(e) => setSelectedEthNetwork(e.target.value as "mainnet" | "sepolia")}
              className="bg-slate-700 text-white rounded px-4 py-2 w-full mb-4"
            >
              <option value="mainnet">Mainnet</option>
              <option value="sepolia">Sepolia Testnet</option>
            </select>
            <div className="bg-slate-700/50 rounded-lg p-4">
              {/* Network Info */}
              <div className="network-info">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {selectedEthNetwork === 'sepolia' ? 'Sepolia Testnet' : 'Ethereum Mainnet'}
                </h3>
                <div className="balance-display">
                  <div className="balance-amount">
                    {ethBalance} ETH
                  </div>
                  <div className="balance-usd">
                    ≈ ${(Number(ethBalance) * (ethPrice || 0)).toFixed(2)} USD
                  </div>
                  <div className="text-sm text-gray-400">
                    1 ETH = ${ethPrice?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="address-section">
                <h4>Your Ethereum Address</h4>
                <div className="address-display">
                  <code className="address-text">
                    {ethAddress || 'Not connected'}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(ethAddress)}
                    className="copy-button"
                    title="Copy address"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Price Chart */}
              <div className="crypto-charts">
                <div className="chart-section">
                  <h3>ETH/USDT Price</h3>
                  <div className="time-intervals">
                    {['1H', '1D', '1W', '1M'].map(tf => (
                      <button 
                        key={tf}
                        className={`px-3 py-1 rounded ${
                          selectedTimeframe === tf ? 'active' : ''
                        }`}
                        onClick={() => setSelectedTimeframe(tf as "1H" | "1D" | "1W" | "1M")}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                  <canvas id="ethereumChart"></canvas>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <Button
                  onClick={() => openTransactionModal("ETH")}
                  variant="web3outline"
                >
                  Send ↗
                </Button>
                <Button
                  onClick={() => openReceivePanel("ETH", ethAddress)}
                  variant="web3outline"
                >
                  Receive ↙
                </Button>
                {selectedEthNetwork === 'sepolia' && (
                  <Button
                    onClick={() => handleGetTestTokens('eth')}
                    variant="web3outline"
                  >
                    Get Test ETH
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Solana card */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Solana Network</h2>
            <select
              value={selectedSolNetwork}
              onChange={(e) => setSelectedSolNetwork(e.target.value as "mainnet-beta" | "devnet")}
              className="bg-slate-700 text-white rounded px-4 py-2 w-full mb-4"
            >
              <option value="mainnet-beta">Mainnet</option>
              <option value="devnet">Devnet</option>
            </select>
            <div className="bg-slate-700/50 rounded-lg p-4">
              {/* Network Info */}
              <div className="network-info">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {selectedSolNetwork === 'devnet' ? 'Solana Devnet' : 'Solana Mainnet'}
                </h3>
                <div className="balance-display">
                  <div className="balance-amount">
                    {solBalance} SOL
                  </div>
                  <div className="balance-usd">
                    ≈ ${(Number(solBalance) * (solPrice || 0)).toFixed(2)} USD
                  </div>
                  <div className="text-sm text-gray-400">
                    1 SOL = ${solPrice?.toFixed(3) || '0.000'}
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="address-section">
                <h4>Your Solana Address</h4>
                <div className="address-display">
                  <code className="address-text">
                    {solAddress || 'Not connected'}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(solAddress)}
                    className="copy-button"
                    title="Copy address"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Price Chart */}
              <div className="crypto-charts">
                <div className="chart-section">
                  <h3>SOL/USDT Price</h3>
                  <div className="time-intervals">
                    {['1H', '1D', '1W', '1M'].map(tf => (
                      <button 
                        key={tf}
                        className={`px-3 py-1 rounded ${
                          selectedTimeframe === tf ? 'active' : ''
                        }`}
                        onClick={() => setSelectedTimeframe(tf as "1H" | "1D" | "1W" | "1M")}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                  <canvas id="solanaChart"></canvas>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <Button
                  onClick={() => openTransactionModal("SOL")}
                  variant="web3outline"
                >
                  Send ↗
                </Button>
                <Button
                  onClick={() => openReceivePanel("SOL", solAddress)}
                  variant="web3outline"
                >
                  Receive ↙
                </Button>
                {selectedSolNetwork === 'devnet' && (
                  <Button
                    onClick={() => handleGetTestTokens('sol')}
                    variant="web3outline"
                  >
                    Get Test SOL
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {receivePanelVisible && (
          <ReceivePanel
            visible={receivePanelVisible}
            setVisible={setReceivePanelVisible}
            chainType={currentChain}
            publicKey={currentChain === "ETH" ? ethAddress : solAddress}
          />
        )}

        {transactionModalVisible && (
          <TransactionModal
            visible={transactionModalVisible}
            setVisible={setTransactionModalVisible}
            type={currentChain}
            parentalControlEnabled={isParentalControlEnabled}
            ethPrice={ethPrice}
            solPrice={solPrice}
            onTransactionComplete={async (recipient: string, amount: string) => {
              // Handle transaction
              setTransactionModalVisible(false);
              await fetchNetworkBalances();
            }}
          />
        )}

        {parentalControlPanelVisible && (
          <ParentalControlPanel
            onClose={() => setParentalControlPanelVisible(false)}
            onSave={(settings) => {
              setIsParentalControlEnabled(settings.enabled);
              setParentalControlPanelVisible(false);
            }}
          />
        )}
      </div>
    </div>
  );
} 