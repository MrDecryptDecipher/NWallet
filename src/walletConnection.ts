import { ethers } from 'ethers';

// Constants
const NIJA_API_URL = 'http://3.111.22.56:5175';
const WS_API_URL = 'ws://localhost:5176';

// Types
interface WalletState {
  address: string | null;
  chainId: string | null;
  provider: ethers.BrowserProvider | null;
  isConnecting: boolean;
  error: Error | null;
}

interface EthereumRequest {
  method: string;
  params?: any[];
}

interface EthereumProvider {
  [key: string]: any;
  isNijaWallet?: boolean;
  isMetaMask?: boolean;
  name?: string;
  request?: (args: EthereumRequest) => Promise<any>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
}

let walletState: WalletState = {
  address: null,
  chainId: null,
  provider: null,
  isConnecting: false,
  error: null
};

declare global {
  interface Window {
    ethereum?: {
      [key: string]: any;
      isNijaWallet?: boolean;
      isMetaMask?: boolean;
      name?: string;
      request?: (args: EthereumRequest) => Promise<any>;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

// Event handlers
const handleAccountsChanged = (accounts: string[]) => {
  if (accounts.length === 0) {
    walletState.address = null;
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  } else {
    walletState.address = accounts[0];
    window.dispatchEvent(new CustomEvent('walletConnected', { detail: { address: accounts[0] } }));
  }
};

const handleChainChanged = (chainId: string) => {
  walletState.chainId = chainId;
  window.dispatchEvent(new CustomEvent('chainChanged', { detail: { chainId } }));
};

const handleDisconnect = () => {
  walletState = {
    address: null,
    chainId: null,
    provider: null,
    isConnecting: false,
    error: null
  };
  window.dispatchEvent(new CustomEvent('walletDisconnected'));
};

// Network configurations
export const networks = {
  ethereum: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.infura.io/v3/YOUR-PROJECT-ID'],
    blockExplorerUrls: ['https://etherscan.io'],
  },
  polygon: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  bsc: {
    chainId: '0x38',
    chainName: 'BNB Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
  },
  arbitrum: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
  },
};

const emitNetworkError = (message: string) => {
  window.dispatchEvent(new CustomEvent('networkError', {
    detail: { message }
  }));
};

// Connection functions
export const connectWallet = async () => {
  try {
    if (walletState.isConnecting) {
      console.log('Already attempting to connect...');
      return;
    }

    walletState.isConnecting = true;
    walletState.error = null;

    const ethereum = window.ethereum as EthereumProvider;
    if (!ethereum?.isNijaWallet) {
      const error = new Error('Nija Wallet not detected');
      emitNetworkError(error.message);
      throw error;
    }

    try {
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      } as EthereumRequest);

      if (!accounts || accounts.length === 0) {
        const error = new Error('No accounts returned from wallet');
        emitNetworkError(error.message);
        throw error;
      }

      const chainId = await ethereum.request({
        method: 'eth_chainId'
      } as EthereumRequest);

      if (!chainId) {
        const error = new Error('Could not get chain ID');
        emitNetworkError(error.message);
        throw error;
      }

      const provider = new ethers.BrowserProvider(ethereum);
      
      walletState = {
        address: accounts[0],
        chainId,
        provider,
        isConnecting: false,
        error: null
      };

      if (typeof ethereum.on === 'function') {
        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);
        ethereum.on('disconnect', handleDisconnect);
      }

      window.dispatchEvent(new CustomEvent('walletConnected', { 
        detail: { 
          address: accounts[0],
          chainId,
          provider 
        }
      }));

      return walletState;
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      walletState.error = error;
      walletState.isConnecting = false;
      emitNetworkError(error.message);
      throw error;
    }
  } catch (error: any) {
    console.error('Error initializing wallet:', error);
    walletState.error = error;
    walletState.isConnecting = false;
    if (!error.message.includes('Nija Wallet not detected')) {
      emitNetworkError(error.message);
    }
    throw error;
  }
};

export const disconnectWallet = async () => {
  try {
    const ethereum = window.ethereum as EthereumProvider;
    if (ethereum?.isNijaWallet && typeof ethereum.removeListener === 'function') {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
      ethereum.removeListener('disconnect', handleDisconnect);
    }

    walletState = {
      address: null,
      chainId: null,
      provider: null,
      isConnecting: false,
      error: null
    };

    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  } catch (error: any) {
    console.error('Error disconnecting wallet:', error);
    emitNetworkError(error.message);
    throw error;
  }
};

export const switchNetwork = async (networkId: keyof typeof networks) => {
  try {
    const ethereum = window.ethereum as EthereumProvider;
    if (!ethereum?.isNijaWallet) {
      emitNetworkError('Nija Wallet not detected');
      throw new Error('Nija Wallet not detected');
    }

    const network = networks[networkId];
    if (!network) {
      emitNetworkError(`Network ${networkId} not supported`);
      throw new Error(`Network ${networkId} not supported`);
    }

    try {
      // Try switching to the network
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to the wallet
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [network],
          });
        } catch (addError: any) {
          emitNetworkError(`Failed to add network: ${addError.message}`);
          throw new Error(`Failed to add network: ${addError.message}`);
        }
      } else {
        emitNetworkError(`Failed to switch network: ${switchError.message}`);
        throw switchError;
      }
    }

    // Update state and emit event
    walletState.chainId = network.chainId;
    window.dispatchEvent(new CustomEvent('chainChanged', {
      detail: { chainId: network.chainId }
    }));

    return network.chainId;
  } catch (error: any) {
    console.error('Error switching network:', error);
    if (!error.message.includes('Nija Wallet not detected') && !error.message.includes('not supported')) {
      emitNetworkError(error.message);
    }
    throw error;
  }
};

// Helper functions
export const getWalletState = () => ({ ...walletState });

export const isWalletConnected = () => {
  return Boolean(walletState.address && walletState.provider);
};

export const getProvider = () => {
  return walletState.provider;
};

export const getAddress = () => {
  return walletState.address;
};

export const getChainId = () => {
  return walletState.chainId;
}; 