import { Eip1193Provider } from 'ethers';

declare global {
  interface Window {
    ethereum?: NijaEthereumProvider;
  }
}

// Custom Ethereum provider that extends Eip1193Provider
export interface NijaEthereumProvider extends Omit<Eip1193Provider, 'request'> {
  isNijaWallet?: boolean;
  name?: string;
  isMetaMask?: boolean;
  
  // Fixed request method to handle both parameter formats
  request: (args: { method: string; params?: any[] | Record<string, any> }) => Promise<any>;
  
  // Event handling
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  
  // Additional properties
  selectedAddress?: string;
  chainId?: string;
  [key: string]: any;
}

// This is needed for TS module augmentation
export {}; 