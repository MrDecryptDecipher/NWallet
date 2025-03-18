import { createConfig, configureChains, Chain } from 'wagmi';
import { mainnet, sepolia, goerli } from 'wagmi/chains';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { createWalletAdapter } from './walletAdapter';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

// Configuration constants
const ALCHEMY_KEY = process.env.VITE_ALCHEMY_KEY || 'default_key';
const PROJECT_ID = process.env.VITE_WALLET_CONNECT_PROJECT_ID || 'default_project_id';

// Solana network configuration
export const SOLANA_NETWORK = WalletAdapterNetwork.Mainnet;
export const SOLANA_RPC_ENDPOINT = clusterApiUrl(SOLANA_NETWORK);
export const solanaConnection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

// Configure chains with providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, sepolia, goerli],
  [
    alchemyProvider({ apiKey: ALCHEMY_KEY }),
    publicProvider()
  ],
  {
    batch: {
      multicall: true
    },
    pollingInterval: 4000,
    stallTimeout: 5000,
  }
);

// Export available chains for use in other components
export const availableChains = chains;

// Create wagmi config with enhanced features
export const config = createConfig({
  autoConnect: true,
  connectors: [createWalletAdapter(chains)],
  publicClient,
  webSocketPublicClient,
});

// DApp metadata
export const dAppInfo = {
  name: 'Nija Custodian Wallet',
  description: 'Advanced Multi-Chain Custodial Wallet',
  url: 'https://nija.wallet',
  icons: ['https://nija.wallet/icon.png'],
  chains: chains.map((chain: Chain) => ({
    id: chain.id,
    name: chain.name,
    network: chain.network,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: chain.rpcUrls,
  })),
};

// Network specific configurations
export const networkConfig = {
  ethereum: {
    supportedChains: chains,
    defaultChain: mainnet,
    gasSettings: {
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
      gasLimit: undefined,
    },
  },
  solana: {
    endpoint: SOLANA_RPC_ENDPOINT,
    commitment: 'confirmed' as const,
    wsEndpoint: SOLANA_RPC_ENDPOINT.replace('https', 'wss'),
    devnet: 'https://api.devnet.solana.com',
    mainnet: 'https://api.mainnet-beta.solana.com',
  },
};

// Export utility functions
export const isMainnet = (chainId: number) => chainId === mainnet.id;
export const isSepolia = (chainId: number) => chainId === sepolia.id;
export const isGoerli = (chainId: number) => chainId === goerli.id;

export const BROWSER_URL = window.location.hostname === 'localhost' 
  ? 'https://dexscreener.com/' 
  : 'https://dexscreener.com/';

export const NFTGEN_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5177'
  : window.location.hostname === '13.126.230.108'
    ? 'http://13.126.230.108:5177'
    : 'https://nftgenrtr.surge.sh';

export const SCGEN_URL = window.location.hostname === 'localhost'
  ? 'https://scgen.surge.sh'
  : 'https://scgen.surge.sh';