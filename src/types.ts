import { BrowserProvider } from 'ethers';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  provider: BrowserProvider | null;
  error: Error | null;
}
