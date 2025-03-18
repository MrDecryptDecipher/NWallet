import { BrowserProvider } from 'ethers';

export interface EthereumProvider {
  [key: string]: any;
  isNijaWallet?: boolean;
  isMetaMask?: boolean;
  name?: string;
  request?: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
}

export interface WalletState {
  address: string | null;
  chainId: string | null;
  provider: BrowserProvider | null;
  isConnecting: boolean;
  error: Error | null;
}

declare global {
  interface Window {
    ethereum?: {
      [key: string]: any;
      isNijaWallet?: boolean;
      isMetaMask?: boolean;
      name?: string;
      request?: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
} 