import { 
  Chain, 
  Connector, 
  ConnectorData
} from 'wagmi';
import { PublicKey, Transaction } from '@solana/web3.js';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { toast } from 'react-toastify';

declare global {
  interface Window {
    ethereum?: any & {
      isNijaWallet?: boolean;
    };
    solana?: {
      isNijaWallet?: boolean;
      connect: () => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
    };
  }
}

export interface NijaWalletState {
  address?: `0x${string}`;
  chainId?: number;
  solanaAddress?: string;
  isConnected: boolean;
  isConnecting: boolean;
}

class NijaWalletConnector extends Connector<BrowserProvider, { chainId?: number }> {
  readonly id = 'nijaWallet';
  readonly name = 'Nija Custodian Wallet';
  readonly ready = true;

  protected provider?: BrowserProvider;
  protected walletClient?: any;
  protected solanaProvider?: typeof window.solana;
  protected ethAddress?: `0x${string}`;
  protected solAddress?: string;

  constructor({ chains, options }: { chains?: Chain[]; options: any }) {
    super({ chains, options });
  }

  async getProvider() {
    if (!this.provider && window.ethereum) {
      this.provider = new BrowserProvider(window.ethereum as any);
    }
    return this.provider;
  }

  async getWalletClient(): Promise<any> {
    return this.walletClient;
  }

  async isAuthorized(): Promise<boolean> {
    try {
      const provider = await this.getProvider();
      if (!provider) return false;
      
      const accounts = await provider.send('eth_accounts', []);
      return !!accounts?.[0];
    } catch {
      return false;
    }
  }

  private checkProviderEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    return window.ethereum?.isNijaWallet || false;
  }

  async connect(): Promise<Required<ConnectorData>> {
    try {
      if (!this.checkProviderEnvironment()) {
        throw new Error('Nija Wallet not detected');
      }

      const provider = await this.getProvider();
      if (!provider) throw new Error('Provider not found');

      // Request accounts
      const accounts = await provider.send('eth_requestAccounts', []);
      const chainId = await provider.send('eth_chainId', []);

      if (!accounts?.[0] || !chainId) {
        throw new Error('Failed to get account or chain ID');
      }

      // Initialize Solana if available
      if (window.solana?.isNijaWallet) {
        this.solanaProvider = window.solana;
        const solAccount = await this.solanaProvider.connect();
        this.solAddress = solAccount.publicKey.toString();
      }

      // Store addresses
      this.ethAddress = accounts[0] as `0x${string}`;

      const data = {
        account: this.ethAddress,
        chain: { id: Number(chainId), unsupported: false }
      };

      // Store connection state
      this.saveConnectionState({
        address: this.ethAddress,
        solanaAddress: this.solAddress,
        chainId: Number(chainId),
        isConnected: true,
        isConnecting: false
      });

      return data;
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      const provider = await this.getProvider();
      if (provider) {
        await provider.send('eth_disconnect', []);
      }

      if (this.solanaProvider) {
        await this.solanaProvider.disconnect();
      }

      this.clearConnectionState();

      // Reset instance variables
      this.ethAddress = undefined;
      this.solAddress = undefined;
      this.provider = undefined;
      this.walletClient = undefined;
      this.solanaProvider = undefined;
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect wallet');
      throw error;
    }
  }

  async getAccount(): Promise<`0x${string}`> {
    if (!this.ethAddress) throw new Error('Not connected');
    return this.ethAddress;
  }

  async getChainId(): Promise<number> {
    const provider = await this.getProvider();
    if (!provider) throw new Error('Provider not initialized');
    
    const chainId = await provider.send('eth_chainId', []);
    return Number(chainId);
  }

  async getSolanaAccount(): Promise<string | undefined> {
    return this.solAddress;
  }

  async switchChain(chainId: number): Promise<Chain> {
    try {
      const provider = await this.getProvider();
      if (!provider) throw new Error('Provider not initialized');

      await provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${chainId.toString(16)}` },
      ]);

      const chain = this.chains.find((chain) => chain.id === chainId);
      if (!chain) throw new Error(`Unsupported chain ID: ${chainId}`);

      return chain;
    } catch (error: any) {
      console.error('Chain switch error:', error);
      toast.error('Failed to switch network');
      throw error;
    }
  }

  async signMessage(message: string): Promise<string> {
    const provider = await this.getProvider();
    if (!provider) throw new Error('Provider not initialized');
    
    const signer = await provider.getSigner();
    return signer.signMessage(message);
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.solanaProvider) throw new Error('Solana provider not initialized');
    return this.solanaProvider.signTransaction(transaction);
  }

  private saveConnectionState(state: NijaWalletState) {
    localStorage.setItem('nija_wallet_state', JSON.stringify(state));
  }

  private clearConnectionState() {
    localStorage.removeItem('nija_wallet_state');
  }

  protected onAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) this.onDisconnect();
  }

  protected onChainChanged(chainId: string | number): void {
    const id = Number(chainId);
    const unsupported = !this.chains.some((chain) => chain.id === id);
    
    if (unsupported) {
      toast.warning('Switched to unsupported network');
    }
  }

  protected onDisconnect(): void {
    this.disconnect().catch((error) => {
      console.error('Disconnect error:', error);
    });
  }
}

export function createWalletAdapter(chains: Chain[]) {
  return new NijaWalletConnector({
    chains,
    options: {
      shimDisconnect: true,
      shimChainChanged: true,
    },
  });
} 