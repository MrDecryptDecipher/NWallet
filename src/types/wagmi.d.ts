import { Eip1193Provider } from 'ethers';

// Define a global custom ethereum provider type
interface CustomEthereumProvider {
  isNijaWallet?: boolean;
  name?: string;
  isMetaMask?: boolean;
  request?: (args: any) => Promise<any>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
  selectedAddress?: string;
  chainId?: string;
  [key: string]: any;
}

// Declare the global Window interface
declare global {
  interface Window {
    ethereum?: CustomEthereumProvider;
  }
}

// Add wagmi module specific types
declare module 'wagmi' {
  interface Connector<Provider = any, Options = any> {
    id: string;
    name: string;
    type: string;
    chains?: Chain[];
    options: Options;
    connect(config?: { chainId?: number }): Promise<{
      account: `0x${string}`;
      chain: { id: number; unsupported: boolean };
      provider: Provider;
    }>;
    disconnect(): Promise<void>;
    isAuthorized(): Promise<boolean>;
    getProvider(config?: { chainId?: number }): Promise<Provider>;
    getChainId(): Promise<number>;
    getAccount(): Promise<`0x${string}`>;
    getSigner(config?: { chainId?: number }): Promise<any>;
    getWalletClient(config?: { chainId?: number }): Promise<any>;
    switchChain?(args: { chainId: number }): Promise<Chain>;
    watchAsset?(args: any): Promise<boolean>;
    watchNetwork?(args: any): (err: Error, data: any) => void;
    onAccountsChanged(accounts: string[]): void;
    onChainChanged(chain: number | string): void;
    onDisconnect(error: Error): void;
  }
}

export {}; 