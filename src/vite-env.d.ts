/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ETH_MAINNET_URL: string;
  readonly VITE_ETH_SEPOLIA_URL: string;
  readonly VITE_COINGECKO_API?: string;
  readonly VITE_SEPOLIA_FAUCET_KEY?: string;
  readonly VITE_SOL_FAUCET_URL?: string;
  readonly VITE_WEB3_FAUCET_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Ethereum provider type declarations for Nija Wallet
interface Window {
  ethereum?: {
    isNijaWallet?: boolean;
    name?: string;
    isMetaMask?: boolean;
    request?: (args: any) => Promise<any>;
    on?: (event: string, callback: (...args: any[]) => void) => void;
    removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    selectedAddress?: string;
    chainId?: string;
    [key: string]: any;
  };
}