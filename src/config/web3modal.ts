import { createWeb3Modal } from '@web3modal/wagmi/react';
import { config, availableChains } from './web3';
import { mainnet } from 'wagmi/chains';

export const projectId = '1ee409593129cebf8c29a7064ce8915e';

// Create the Web3Modal instance
export const web3modal = createWeb3Modal({
  wagmiConfig: config,
  projectId,
  themeMode: 'dark',
  chainImages: {},
  defaultChain: mainnet,
});

// Optional: Export information about the dApp for display purposes
export const dAppInfo = {
  name: 'NWallet',
  description: 'Nija Custodian Wallet',
  url: 'https://nwallet.surge.sh',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};