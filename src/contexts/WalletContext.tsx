import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BrowserProvider, JsonRpcSigner, formatEther, Eip1193Provider } from 'ethers';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { toast } from 'react-toastify';
import { networkConfig } from '../config/web3';
import { NijaEthereumProvider } from '../types/ethereum';

// Define the Ethereum provider with proper type
type EthereumProvider = Eip1193Provider & {
  isNijaWallet?: boolean;
  on(event: string, callback: (...args: any[]) => void): void;
  removeListener(event: string, callback: (...args: any[]) => void): void;
  request(args: { method: string; params?: any[] }): Promise<any>;
};

// Define Solana provider
type SolanaProvider = {
  isNijaWallet?: boolean;
  connect(): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
};

// Override the global Window interface without conflicts
declare global {
  interface Window {
    // Use our custom ethereum type instead of the one in vite-env.d.ts
    ethereum?: EthereumProvider;
    solana?: SolanaProvider;
  }
}

interface WalletState {
  ethAddress?: `0x${string}`;
  solAddress?: string;
  chainId?: number;
  isConnected: boolean;
  isConnecting: boolean;
  provider?: BrowserProvider;
  signer?: JsonRpcSigner;
  solanaConnection?: Connection;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  getBalance: () => Promise<{ eth: string; sol: string }>;
}

// Create default context values
const defaultContextValue: WalletContextType = {
  ethAddress: undefined,
  solAddress: undefined,
  chainId: undefined,
  isConnected: false,
  isConnecting: false,
  provider: undefined,
  signer: undefined,
  solanaConnection: undefined,
  connect: async () => { console.warn('Wallet context not initialized'); },
  disconnect: async () => { console.warn('Wallet context not initialized'); },
  switchChain: async () => { console.warn('Wallet context not initialized'); },
  signMessage: async () => { throw new Error('Wallet context not initialized'); },
  signTransaction: async () => { throw new Error('Wallet context not initialized'); },
  getBalance: async () => ({ eth: '0', sol: '0' })
};

// Create the context with default values
const WalletContext = createContext<WalletContextType>(defaultContextValue);

export function useWallet() {
  return useContext(WalletContext);
}

interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [state, setState] = useState<WalletState>({
    ethAddress: undefined,
    solAddress: undefined,
    chainId: undefined,
    isConnected: false,
    isConnecting: false,
    provider: undefined,
    signer: undefined,
    solanaConnection: undefined
  });

  // Initialize connection from localStorage
  useEffect(() => {
    const init = async () => {
      try {
        // Check if we have a stored connection
        const savedAddress = localStorage.getItem('nija_eth_address');
        const savedChainId = localStorage.getItem('nija_chain_id');
        
        if (savedAddress) {
          try {
            // Try to reconnect if we have a stored address
            if (window.ethereum) {
              const accounts = await window.ethereum.request({ method: 'eth_accounts' });
              if (accounts && accounts.length > 0) {
                const provider = new BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                
                setState(prev => ({
                  ...prev,
                  ethAddress: accounts[0] as `0x${string}`,
                  chainId: savedChainId ? parseInt(savedChainId, 16) : undefined,
                  provider,
                  signer,
                  isConnected: true
                }));
              }
            }
          } catch (error) {
            console.warn('Error reconnecting wallet:', error);
          }
        }
        
        // Setup Solana connection regardless of auth status
        try {
          // Make sure we use an actual proper URL
          let solanaUrl = networkConfig.solana.endpoint; 
          
          // Ensure URL starts with http or https
          if (!solanaUrl.startsWith('http://') && !solanaUrl.startsWith('https://')) {
            solanaUrl = `https://${solanaUrl.replace(/^\/\//, '')}`;
          }
          
          const connection = new Connection(solanaUrl);
          setState(prev => ({ ...prev, solanaConnection: connection }));
        } catch (error) {
          console.warn('Error setting up Solana connection:', error);
        }
      } catch (error) {
        console.error('Error initializing wallet:', error);
      }
    };

    init();
  }, []);

  // Setup event listeners for Ethereum
  useEffect(() => {
    if (!window.ethereum) return;
    
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // Disconnected
        localStorage.removeItem('nija_eth_address');
        setState(prev => ({ 
          ...prev, 
          ethAddress: undefined, 
          isConnected: false,
          signer: undefined
        }));
      } else {
        // Account changed
        localStorage.setItem('nija_eth_address', accounts[0]);
        setState(prev => ({ 
          ...prev, 
          ethAddress: accounts[0] as `0x${string}`, 
          isConnected: true 
        }));
      }
    };
    
    const handleChainChanged = (chainId: string) => {
      localStorage.setItem('nija_chain_id', chainId);
      setState(prev => ({ ...prev, chainId: parseInt(chainId, 16) }));
    };
    
    const handleDisconnect = () => {
      localStorage.removeItem('nija_eth_address');
      setState(prev => ({ 
        ...prev, 
        ethAddress: undefined, 
        isConnected: false,
        signer: undefined
      }));
    };
    
    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);
    
    // Remove event listeners on cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);
  
  const connect = async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true }));
      
      if (window.ethereum) {
        // Connect Ethereum
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        localStorage.setItem('nija_eth_address', accounts[0]);
        localStorage.setItem('nija_chain_id', chainId);
        
        setState(prev => ({
          ...prev,
          ethAddress: accounts[0] as `0x${string}`,
          chainId: parseInt(chainId, 16),
          provider,
          signer,
          isConnected: true,
          isConnecting: false
        }));
        
        toast.success('Wallet connected successfully!');
      } else {
        toast.error('No Ethereum provider found!');
        setState(prev => ({ ...prev, isConnecting: false }));
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  };
  
  const disconnect = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('nija_eth_address');
      localStorage.removeItem('nija_chain_id');
      
      // Reset state
      setState({
        ethAddress: undefined,
        solAddress: undefined,
        chainId: undefined,
        isConnected: false,
        isConnecting: false,
        provider: undefined,
        signer: undefined,
        solanaConnection: state.solanaConnection // Keep Solana connection for RPC calls
      });
      
      toast.info('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  };
  
  const switchChain = async (chainId: number) => {
    try {
      if (!window.ethereum || !state.isConnected) {
        throw new Error('No Ethereum provider or not connected');
      }
      
      // Get the chain ID in hex format
      const chainIdHex = `0x${chainId.toString(16)}`;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });
      
      localStorage.setItem('nija_chain_id', chainIdHex);
      
      // State will be updated by the chainChanged event handler
      toast.success(`Switched to ${chainId === 1 ? 'Mainnet' : 'Testnet'}`);
    } catch (error) {
      console.error('Error switching chain:', error);
      toast.error('Failed to switch network');
    }
  };
  
  const signMessage = async (message: string): Promise<string> => {
    if (!state.signer) throw new Error('Wallet not connected');
    return await state.signer.signMessage(message);
  };
  
  const signTransaction = async (transaction: Transaction): Promise<Transaction> => {
    if (!window.solana) throw new Error('Solana wallet not available');
    return await window.solana.signTransaction(transaction);
  };
  
  const getBalance = async () => {
    let ethBalance = '0';
    let solBalance = '0';
    
    try {
      if (state.ethAddress && state.provider) {
        const balance = await state.provider.getBalance(state.ethAddress);
        ethBalance = formatEther(balance);
      }
    } catch (error) {
      console.error('Error getting ETH balance:', error);
    }
    
    try {
      if (state.solAddress && state.solanaConnection) {
        const balance = await state.solanaConnection.getBalance(new PublicKey(state.solAddress));
        solBalance = (balance / 1e9).toString(); // Convert lamports to SOL
      }
    } catch (error) {
      console.error('Error getting SOL balance:', error);
    }
    
    return { eth: ethBalance, sol: solBalance };
  };
  
  const contextValue = {
    ...state,
    connect,
    disconnect,
    switchChain,
    signMessage,
    signTransaction,
    getBalance
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
} 