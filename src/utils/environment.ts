export const ENV = {
  ETH_MAINNET_URL: import.meta.env.VITE_ETH_MAINNET_URL,
  ETH_SEPOLIA_URL: import.meta.env.VITE_ETH_SEPOLIA_URL,
  COINGECKO_API: import.meta.env.VITE_COINGECKO_API || 'https://api.coingecko.com/api/v3',
  SEPOLIA_FAUCET_KEY: import.meta.env.VITE_SEPOLIA_FAUCET_KEY,
  SOL_FAUCET_URL: import.meta.env.VITE_SOL_FAUCET_URL || 'https://api.devnet.solana.com',
  WEB3_FAUCET_API: import.meta.env.VITE_WEB3_FAUCET_API || 'https://faucet.quicknode.com/ethereum/sepolia'
};