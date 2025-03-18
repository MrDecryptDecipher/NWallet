# Alchemy API Integration Guide for Nija Wallet

This comprehensive guide covers Alchemy APIs integration for blockchain wallet applications. It includes detailed information on wallet connectivity, transaction management, and blockchain data access, specifically tailored for the Nija Wallet application.

## Table of Contents

- [Wallet Development](#wallet-development)
  - [Setting Up Alchemy](#setting-up-alchemy)
  - [Connecting to Networks](#connecting-to-networks)
  - [Account Management](#account-management)
- [Transaction Management](#transaction-management)
  - [Creating Transactions](#creating-transactions)
  - [Signing Transactions](#signing-transactions)
  - [Broadcasting Transactions](#broadcasting-transactions)
  - [Transaction Status](#transaction-status)
- [Blockchain Data Access](#blockchain-data-access)
  - [Balance Queries](#balance-queries)
  - [Token Data](#token-data)
  - [NFT Integration](#nft-integration)
- [Cryptocurrency Prices](#cryptocurrency-prices)
  - [Current Price Data](#current-price-data)
  - [Historical Price Data](#historical-price-data)
  - [Price Feeds Integration](#price-feeds-integration)
  - [Market Data](#market-data)
- [Advanced Features](#advanced-features)
  - [Gas Estimation](#gas-estimation)
  - [ENS Resolution](#ens-resolution)
  - [WebSocket Subscriptions](#websocket-subscriptions)
- [Security Best Practices](#security-best-practices)
  - [Key Management](#key-management)
  - [Transaction Validation](#transaction-validation)
  - [Phishing Protection](#phishing-protection)

## Wallet Development

### Setting Up Alchemy

To integrate Alchemy APIs into Nija Wallet, you'll need to:

1. Create an Alchemy account at [alchemy.com](https://www.alchemy.com/)
2. Create a new app in the Alchemy dashboard
3. Select the network you want to connect to (Ethereum Mainnet, Sepolia, etc.)
4. Get your API key from the app details page

Once you have your API key, you can set up the Alchemy SDK:

```javascript
import { Alchemy, Network } from "alchemy-sdk";

// Configure Alchemy SDK
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET, // Or other networks like Network.ETH_SEPOLIA
};

// Create an Alchemy instance
const alchemy = new Alchemy(settings);
```

### Connecting to Networks

Nija Wallet should support multiple networks. Here's how to configure different networks with Alchemy:

```javascript
// Network configurations
const networks = {
  mainnet: {
    apiKey: process.env.ALCHEMY_MAINNET_API_KEY,
    network: Network.ETH_MAINNET,
    chainId: 1,
    name: "Ethereum Mainnet",
  },
  sepolia: {
    apiKey: process.env.ALCHEMY_SEPOLIA_API_KEY,
    network: Network.ETH_SEPOLIA,
    chainId: 11155111,
    name: "Sepolia Testnet",
  },
  polygon: {
    apiKey: process.env.ALCHEMY_POLYGON_API_KEY,
    network: Network.MATIC_MAINNET,
    chainId: 137,
    name: "Polygon Mainnet",
  },
  // Add more networks as needed
};

// Function to switch networks
function switchNetwork(networkKey) {
  const networkConfig = networks[networkKey];
  const settings = {
    apiKey: networkConfig.apiKey,
    network: networkConfig.network,
  };
  return new Alchemy(settings);
}
```

### Account Management

Nija Wallet needs to manage user accounts securely. Here's how to handle account creation and management:

```javascript
import { ethers } from "ethers";

// Create a new wallet
function createWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  };
}

// Import wallet from private key
function importFromPrivateKey(privateKey) {
  const wallet = new ethers.Wallet(privateKey);
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

// Import wallet from mnemonic
function importFromMnemonic(mnemonic) {
  const wallet = ethers.Wallet.fromMnemonic(mnemonic);
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: mnemonic,
  };
}
```

## Transaction Management

### Creating Transactions

To create transactions in Nija Wallet:

```javascript
async function createTransaction(from, to, value, data = "0x") {
  // Get the current nonce for the sender
  const nonce = await alchemy.core.getTransactionCount(from, "latest");
  
  // Get current gas price
  const gasPrice = await alchemy.core.getGasPrice();
  
  // Create transaction object
  const transaction = {
    from: from,
    to: to,
    value: ethers.utils.parseEther(value),
    nonce: nonce,
    gasLimit: ethers.utils.hexlify(100000), // Estimate this based on the transaction
    gasPrice: gasPrice,
    data: data,
  };
  
  return transaction;
}
```

### Signing Transactions

To sign transactions with a private key:

```javascript
function signTransaction(transaction, privateKey) {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.signTransaction(transaction);
}
```

For browser-based signing with MetaMask or other providers:

```javascript
async function signWithProvider(transaction) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return signer.signTransaction(transaction);
}
```

### Broadcasting Transactions

To send signed transactions to the network:

```javascript
async function broadcastTransaction(signedTransaction) {
  const txHash = await alchemy.core.sendTransaction(signedTransaction);
  return txHash;
}
```

### Transaction Status

To check transaction status:

```javascript
async function getTransactionStatus(txHash) {
  const tx = await alchemy.core.getTransaction(txHash);
  
  if (!tx) {
    return "Transaction not found";
  }
  
  if (!tx.blockNumber) {
    return "Pending";
  }
  
  const receipt = await alchemy.core.getTransactionReceipt(txHash);
  
  if (receipt && receipt.status === 1) {
    return "Confirmed";
  } else {
    return "Failed";
  }
}
```

## Blockchain Data Access

### Balance Queries

To get ETH balance for an address:

```javascript
async function getEthBalance(address) {
  const balance = await alchemy.core.getBalance(address);
  return ethers.utils.formatEther(balance);
}
```

To get token balances:

```javascript
async function getTokenBalances(address) {
  const balances = await alchemy.core.getTokenBalances(address);
  
  // Process and format the balances
  const formattedBalances = await Promise.all(
    balances.tokenBalances.map(async (token) => {
      const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
      
      return {
        name: metadata.name,
        symbol: metadata.symbol,
        logo: metadata.logo,
        decimals: metadata.decimals,
        balance: ethers.utils.formatUnits(token.tokenBalance, metadata.decimals),
        address: token.contractAddress,
      };
    })
  );
  
  return formattedBalances;
}
```

### Token Data

To get token metadata:

```javascript
async function getTokenMetadata(tokenAddress) {
  const metadata = await alchemy.core.getTokenMetadata(tokenAddress);
  return metadata;
}
```

To get token price:

```javascript
async function getTokenPrice(tokenAddress) {
  // Using Alchemy's price API
  const price = await alchemy.prices.getTokenPriceByAddress(tokenAddress);
  return price;
}
```

### NFT Integration

To get NFTs owned by an address:

```javascript
async function getNFTs(address) {
  const nfts = await alchemy.nft.getNftsForOwner(address);
  
  // Process and format the NFTs
  const formattedNFTs = nfts.ownedNfts.map((nft) => {
    return {
      contractAddress: nft.contract.address,
      tokenId: nft.tokenId,
      name: nft.title,
      description: nft.description,
      image: nft.media[0]?.gateway || null,
      tokenType: nft.tokenType,
    };
  });
  
  return formattedNFTs;
}
```

To get NFT metadata:

```javascript
async function getNFTMetadata(contractAddress, tokenId) {
  const nft = await alchemy.nft.getNftMetadata(contractAddress, tokenId);
  return nft;
}
```

## Cryptocurrency Prices

Alchemy provides access to cryptocurrency price data, which is essential for displaying accurate wallet balances and asset values in Nija Wallet.

### Current Price Data

To fetch current cryptocurrency prices:

```javascript
// Using Alchemy Pricing API
import { Alchemy, Network } from "alchemy-sdk";

const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);

async function getCurrentPrices() {
  // Get ETH price in USD
  const ethPrice = await alchemy.core.getTokenPrice("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"); // ETH address representation
  
  // Get prices for specific tokens by contract address
  const usdcPrice = await alchemy.core.getTokenPrice("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"); // USDC
  const uniPrice = await alchemy.core.getTokenPrice("0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"); // UNI
  
  return {
    ETH: {
      usd: ethPrice.usd,
      ethPerToken: ethPrice.eth,
    },
    USDC: {
      usd: usdcPrice.usd,
      ethPerToken: usdcPrice.eth,
    },
    UNI: {
      usd: uniPrice.usd,
      ethPerToken: uniPrice.eth,
    }
  };
}
```

To get price data with additional context:

```javascript
async function getEnhancedPriceData(tokenAddress) {
  const price = await alchemy.core.getTokenPrice(tokenAddress);
  const metadata = await alchemy.core.getTokenMetadata(tokenAddress);
  
  const timestamp = Date.now();
  
  return {
    symbol: metadata.symbol,
    name: metadata.name,
    logo: metadata.logo,
    decimals: metadata.decimals,
    priceUSD: price.usd,
    priceETH: price.eth,
    timestamp,
    formattedPrice: `$${price.usd.toFixed(2)}`,
  };
}
```

### Historical Price Data

Alchemy allows you to fetch historical price data, which is useful for displaying price charts in Nija Wallet:

```javascript
async function getHistoricalPrices(tokenAddress, timeframe = "1d") {
  // Map timeframes to appropriate time periods
  const timeframeMap = {
    "1h": { interval: "minute", limit: 60 },
    "1d": { interval: "hour", limit: 24 },
    "1w": { interval: "hour", limit: 168 },
    "1m": { interval: "day", limit: 30 },
    "1y": { interval: "day", limit: 365 },
  };
  
  const { interval, limit } = timeframeMap[timeframe] || timeframeMap["1d"];
  
  // Fetch historical data using Alchemy's token API
  const historicalData = await alchemy.core.getTokenPriceHistory({
    contractAddress: tokenAddress,
    interval: interval,
    limit: limit,
  });
  
  // Format the data for chart display
  return historicalData.map(dataPoint => ({
    timestamp: dataPoint.timestamp,
    date: new Date(dataPoint.timestamp * 1000).toISOString(),
    priceUSD: dataPoint.usd,
    priceETH: dataPoint.eth,
  }));
}

// Example usage for a price chart
async function getPriceChartData(symbol) {
  let tokenAddress;
  
  // Map common symbols to their contract addresses
  switch (symbol.toUpperCase()) {
    case "ETH":
      tokenAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // ETH representation
      break;
    case "USDC":
      tokenAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
      break;
    case "UNI":
      tokenAddress = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
      break;
    default:
      throw new Error(`Unknown symbol: ${symbol}`);
  }
  
  // Get data for different timeframes
  const dailyData = await getHistoricalPrices(tokenAddress, "1d");
  const weeklyData = await getHistoricalPrices(tokenAddress, "1w");
  const monthlyData = await getHistoricalPrices(tokenAddress, "1m");
  
  return {
    daily: dailyData,
    weekly: weeklyData,
    monthly: monthlyData,
    currentPrice: dailyData[dailyData.length - 1].priceUSD,
    symbol,
  };
}
```

### Price Feeds Integration

For real-time price updates, you can combine Alchemy's WebSocket functionality with price queries:

```javascript
function subscribeToPriceUpdates(tokenAddress, callback, interval = 60000) {
  // Initial fetch
  getEnhancedPriceData(tokenAddress).then(callback);
  
  // Set interval for regular updates
  const intervalId = setInterval(async () => {
    try {
      const priceData = await getEnhancedPriceData(tokenAddress);
      callback(priceData);
    } catch (error) {
      console.error("Error fetching price data:", error);
    }
  }, interval);
  
  // Return function to stop subscription
  return () => clearInterval(intervalId);
}

// Example usage
const stopPriceUpdates = subscribeToPriceUpdates(
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // ETH
  (priceData) => {
    console.log(`ETH price updated: $${priceData.priceUSD}`);
    // Update UI with new price
    updatePriceDisplay(priceData);
  },
  30000 // Update every 30 seconds
);

// To stop updates later
// stopPriceUpdates();
```

### Market Data

You can also fetch broader market data to provide context for cryptocurrency prices:

```javascript
async function getMarketData() {
  // Get top tokens by market cap
  const topTokens = await alchemy.core.getTopTokens({
    limit: 10
  });
  
  // Fetch prices for all tokens
  const pricePromises = topTokens.map(async (token) => {
    const price = await alchemy.core.getTokenPrice(token.contractAddress);
    return {
      ...token,
      price
    };
  });
  
  const tokenPrices = await Promise.all(pricePromises);
  
  // Calculate 24h change by comparing with yesterday's price
  // Note: This would require storing historical data or using
  // another API that provides this information
  
  return tokenPrices.map(token => ({
    symbol: token.symbol,
    name: token.name,
    address: token.contractAddress,
    priceUSD: token.price.usd,
    priceETH: token.price.eth,
    marketCap: token.marketCap,
    // Placeholder for 24h change
    change24h: Math.random() * 10 - 5, // Replace with actual data
  }));
}
```

## Advanced Features

### Gas Estimation

To estimate gas for transactions:

```javascript
async function estimateGas(transaction) {
  const gasEstimate = await alchemy.core.estimateGas(transaction);
  return gasEstimate;
}
```

To get gas price recommendations:

```javascript
async function getGasPrices() {
  const gasPrice = await alchemy.core.getGasPrice();
  
  // Convert to gwei and create price options
  const gasPriceInGwei = ethers.utils.formatUnits(gasPrice, "gwei");
  
  return {
    slow: (parseFloat(gasPriceInGwei) * 0.8).toFixed(2),
    average: gasPriceInGwei,
    fast: (parseFloat(gasPriceInGwei) * 1.2).toFixed(2),
    fastest: (parseFloat(gasPriceInGwei) * 1.5).toFixed(2),
  };
}
```

### ENS Resolution

To resolve ENS names to addresses:

```javascript
async function resolveENS(ensName) {
  const provider = new ethers.providers.AlchemyProvider(
    "mainnet",
    process.env.ALCHEMY_API_KEY
  );
  
  const address = await provider.resolveName(ensName);
  return address;
}
```

To get ENS name for an address:

```javascript
async function lookupENS(address) {
  const provider = new ethers.providers.AlchemyProvider(
    "mainnet",
    process.env.ALCHEMY_API_KEY
  );
  
  const ensName = await provider.lookupAddress(address);
  return ensName;
}
```

### WebSocket Subscriptions

To subscribe to new blocks:

```javascript
function subscribeToBlocks(callback) {
  alchemy.ws.on("block", (blockNumber) => {
    callback(blockNumber);
  });
}
```

To subscribe to pending transactions:

```javascript
function subscribeToPendingTransactions(callback) {
  alchemy.ws.on("pending", (tx) => {
    callback(tx);
  });
}
```

To subscribe to specific events:

```javascript
function subscribeToEvents(contractAddress, eventName, callback) {
  // Create a filter for the event
  const filter = {
    address: contractAddress,
    topics: [ethers.utils.id(eventName)],
  };
  
  // Subscribe to the event
  alchemy.ws.on(filter, (log) => {
    callback(log);
  });
}
```

## Security Best Practices

### Key Management

Best practices for key management in Nija Wallet:

1. **Never store private keys in plain text**
   ```javascript
   // Bad practice
   localStorage.setItem("privateKey", privateKey);
   
   // Better practice - encrypt with a password
   function encryptPrivateKey(privateKey, password) {
     const wallet = new ethers.Wallet(privateKey);
     return wallet.encrypt(password);
   }
   
   function decryptPrivateKey(encryptedJson, password) {
     return ethers.Wallet.fromEncryptedJson(encryptedJson, password);
   }
   ```

2. **Use secure storage options**
   - Browser: Use encrypted IndexedDB or localStorage
   - Mobile: Use secure enclave or keychain
   - Desktop: Use system keychain or encrypted file storage

3. **Consider hardware wallet integration**
   - Support Ledger, Trezor, or other hardware wallets
   - Use Web3Modal for multiple wallet connections

### Transaction Validation

Implement transaction validation to protect users:

```javascript
function validateTransaction(transaction, userSettings) {
  const warnings = [];
  
  // Check for unusually high gas price
  if (transaction.gasPrice > userSettings.maxGasPrice) {
    warnings.push("Gas price is unusually high");
  }
  
  // Check for large transfers
  if (transaction.value > userSettings.largeTransferThreshold) {
    warnings.push("This is a large transfer");
  }
  
  // Check if recipient is in address book
  if (!userSettings.addressBook.includes(transaction.to)) {
    warnings.push("Recipient is not in your address book");
  }
  
  // Check for known scam addresses
  if (userSettings.scamAddresses.includes(transaction.to)) {
    warnings.push("WARNING: Recipient is a known scam address");
  }
  
  return warnings;
}
```

### Phishing Protection

Implement phishing protection in Nija Wallet:

1. **Domain verification**
   ```javascript
   const trustedDomains = [
     "app.uniswap.org",
     "opensea.io",
     "etherscan.io",
     // Add more trusted domains
   ];
   
   function checkDomain(domain) {
     return trustedDomains.includes(domain);
   }
   ```

2. **Contract verification**
   ```javascript
   async function verifyContract(address) {
     try {
       const contractInfo = await alchemy.core.getCode(address);
       
       // If it's not a contract (just returns '0x'), it's an EOA
       if (contractInfo === "0x") {
         return { isContract: false, verified: false };
       }
       
       // Check if contract is verified on Etherscan
       // This would require an Etherscan API call
       // ...
       
       return { isContract: true, verified: true };
     } catch (error) {
       console.error("Error verifying contract:", error);
       return { isContract: false, verified: false, error: error.message };
     }
   }
   ```

3. **Transaction simulation**
   ```javascript
   async function simulateTransaction(transaction) {
     try {
       // Use Tenderly or other simulation APIs
       // This is a simplified example
       const result = await alchemy.core.call(transaction);
       return { success: true, result };
     } catch (error) {
       return { success: false, error: error.message };
     }
   }
   ```

## Additional Resources

For more detailed information, visit the [Alchemy Documentation](https://docs.alchemy.com/). 

## Troubleshooting Common Integration Issues

### Provider Conflicts with Other Wallets
When integrating Nija Wallet alongside other wallets like MetaMask, you may encounter provider conflicts. Here's how to handle them:

```javascript
// Check if Nija Wallet is already installed
if (window.ethereum && window.ethereum.isNijaWallet) {
  // Nija Wallet is present, use it directly
  const provider = window.ethereum;
} else if (window.ethereum) {
  // Another provider exists, check if it's an array of providers
  if (Array.isArray(window.ethereum.providers)) {
    // Find Nija Wallet in the providers array
    const nijaProvider = window.ethereum.providers.find(p => p.isNijaWallet);
    if (nijaProvider) {
      const provider = nijaProvider;
    }
  } else {
    // Use the existing provider but be cautious about conflicts
    console.warn("Another wallet is active. Users should disable it to use Nija Wallet fully.");
    const provider = window.ethereum;
  }
}
```

### Handling CORS Issues with Price APIs
If you're experiencing CORS issues when fetching cryptocurrency prices, implement these strategies:

```javascript
// Use multiple fallback APIs
const APIs = [
  'https://api.coingecko.com/api/v3',
  'https://api.coinbase.com',
  'https://api.binance.com'
];

// Array of CORS proxies to try
const CORS_PROXIES = [
  'https://cors-anywhere.herokuapp.com/',
  'https://cors-proxy.fringe.zone/',
  'https://api.allorigins.win/raw?url='
];

// Function to fetch with CORS handling
async function fetchWithCorsHandling(url) {
  // Try direct fetch first
  try {
    const response = await fetch(url, { timeout: 5000 });
    if (response.ok) return response.json();
  } catch (error) {
    console.warn(`Direct fetch failed for ${url}`, error);
  }
  
  // Try with CORS proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(`${proxy}${encodeURIComponent(url)}`, { timeout: 5000 });
      if (response.ok) return response.json();
    } catch (error) {
      console.warn(`Proxy fetch failed for ${proxy}${url}`, error);
    }
  }
  
  // If all fails, use Alchemy as fallback
  return fetchPriceFromAlchemy(url);
}
```

### WebSocket Connection Issues
WebSocket connections can fail due to various reasons. Implement a robust connection system:

```javascript
// WebSocket configuration
const WS_RETRY_DELAY = 2000;
const WS_MAX_RETRIES = 5;
const WS_HEARTBEAT_INTERVAL = 30000;

// WebSocket connection state
let ws = null;
let wsRetryCount = 0;
let wsHeartbeatInterval = null;

// Create WebSocket connection with better error handling
function createWebSocketConnection(url) {
  // Close any existing connection
  if (ws) {
    try {
      ws.close();
    } catch (e) {
      console.warn('Error closing existing WebSocket:', e);
    }
    ws = null;
  }
  
  // Clear any existing heartbeat interval
  if (wsHeartbeatInterval) {
    clearInterval(wsHeartbeatInterval);
    wsHeartbeatInterval = null;
  }
  
  try {
    console.log(`Attempting to connect to WebSocket at ${url}`);
    
    ws = new WebSocket(url);
    
    // Set up event handlers
    ws.onopen = () => {
      console.log('WebSocket connection established successfully');
      
      // Reset retry count on successful connection
      wsRetryCount = 0;
      
      // Set up heartbeat to keep connection alive
      wsHeartbeatInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
          } catch (e) {
            console.warn('Error sending heartbeat:', e);
          }
        }
      }, WS_HEARTBEAT_INTERVAL);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);
        
        // Handle different message types here
        if (message.type === 'activity-update') {
          // Update local activities
          updateActivities(message.data);
        }
      } catch (e) {
        console.error('Error processing WebSocket message:', e);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
      
      // Clean up
      if (wsHeartbeatInterval) {
        clearInterval(wsHeartbeatInterval);
        wsHeartbeatInterval = null;
      }
      
      // Try to reconnect with exponential backoff
      if (wsRetryCount < WS_MAX_RETRIES) {
        const delay = WS_RETRY_DELAY * Math.pow(2, wsRetryCount);
        wsRetryCount++;
        
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${wsRetryCount}/${WS_MAX_RETRIES})`);
        
        setTimeout(() => {
          createWebSocketConnection(url);
        }, delay);
      } else {
        console.log('Max WebSocket reconnection attempts reached');
        ws = null;
      }
    };
    
    return ws;
  } catch (e) {
    console.error('Error creating WebSocket connection:', e);
    return null;
  }
}
```

## Creating a Robust Manifest for Chrome Extensions

When deploying a wallet as a Chrome extension, a proper manifest.json file is essential. Here's a template for Nija Wallet:

```json
{
  "manifest_version": 3,
  "name": "Nija Wallet",
  "version": "1.0.0",
  "description": "Secure cryptocurrency wallet for Ethereum and EVM-compatible chains",
  "action": {
    "default_popup": "index.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://*.alchemy.com/*",
    "https://api.coingecko.com/*",
    "https://api.coinbase.com/*",
    "https://api.binance.com/*"
  ],
  "web_accessible_resources": [{
    "resources": [
      "assets/*",
      "images/*",
      "fonts/*",
      "scripts/*",
      "*.html"
    ],
    "matches": ["<all_urls>"]
  }],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src 'self' https://*.alchemy.com https://*.infura.io https://api.coingecko.com https://api.coinbase.com https://api.binance.com;"
  }
}
```

## Implementing Inter-Extension Communication

If you need to communicate between Nija Wallet and other extensions:

```javascript
// Send message from Nija Wallet to another extension
function sendToExtension(extensionId, message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(extensionId, message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// Listen for messages from other extensions
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  // Check if sender is a trusted extension
  const trustedExtensions = ['extension_id_1', 'extension_id_2'];
  
  if (!trustedExtensions.includes(sender.id)) {
    sendResponse({ error: 'Unauthorized extension' });
    return;
  }
  
  // Process message
  if (message.type === 'connect_wallet') {
    // Handle wallet connection request
    connectWallet()
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
  
  // Default response for unhandled message types
  sendResponse({ error: 'Unhandled message type' });
});
```

## Handling Chart Data with Alchemy

When implementing price charts, Alchemy's token API provides reliable data:

```javascript
import { createChart } from 'lightweight-charts';

async function createPriceChart(container, symbol, timeframe = '7d') {
  // Configure chart
  const chart = createChart(container, {
    width: container.clientWidth,
    height: 300,
    layout: {
      background: { color: '#1F2128' },
      textColor: '#D9D9D9',
    },
    grid: {
      vertLines: { color: '#2B2B43' },
      horzLines: { color: '#2B2B43' },
    },
    timeScale: {
      borderColor: '#2B2B43',
    },
  });
  
  // Add area series
  const areaSeries = chart.addAreaSeries({
    topColor: 'rgba(33, 150, 243, 0.56)',
    bottomColor: 'rgba(33, 150, 243, 0.04)',
    lineColor: 'rgba(33, 150, 243, 1)',
    lineWidth: 2,
  });
  
  // Get token address for the symbol
  const tokenAddresses = {
    ETH: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    BTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  };
  
  const tokenAddress = tokenAddresses[symbol.toUpperCase()];
  if (!tokenAddress) {
    throw new Error(`Unknown token symbol: ${symbol}`);
  }
  
  // Map timeframe to days
  const timeframeDays = {
    '1d': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  }[timeframe] || 7;
  
  try {
    // Fetch price data using Alchemy
    const priceData = await fetchHistoricalPrices(tokenAddress, timeframeDays);
    
    // Format data for lightweight-charts
    const formattedData = priceData.map(point => ({
      time: point.timestamp / 1000, // Convert to seconds for lightweight-charts
      value: point.priceUSD
    }));
    
    // Set the data
    areaSeries.setData(formattedData);
    
    // Fit the content
    chart.timeScale().fitContent();
    
    // Make chart responsive
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        chart.applyOptions({ width, height });
        chart.timeScale().fitContent();
      }
    });
    
    resizeObserver.observe(container);
    
    // Return cleanup function
    return () => {
      resizeObserver.unobserve(container);
      chart.remove();
    };
  } catch (error) {
    console.error('Error creating price chart:', error);
    
    // Handle error - display a message in the container
    container.innerHTML = `<div class="chart-error">
      <p>Unable to load chart data</p>
      <button class="retry-button">Retry</button>
    </div>`;
    
    // Add retry functionality
    container.querySelector('.retry-button')?.addEventListener('click', () => {
      container.innerHTML = '';
      createPriceChart(container, symbol, timeframe);
    });
  }
} 