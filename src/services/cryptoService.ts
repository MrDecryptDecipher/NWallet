import axios from 'axios';
import { toast } from 'react-toastify';
import { Alchemy, Network } from "alchemy-sdk";

// ============ ENHANCED CONFIGURATION ============

// Direct API endpoints without proxy - with multiple fallbacks
// CoinGecko and alternative APIs to ensure redundancy
const API_ENDPOINTS = {
  // Primary APIs
  COINGECKO: 'https://api.coingecko.com/api/v3',
  COINBASE: 'https://api.coinbase.com/v2',
  BINANCE: 'https://api.binance.com/api/v3',
  
  // Fallbacks with no API key required
  KRAKEN: 'https://api.kraken.com/0',
  COINPAPRIKA: 'https://api.coinpaprika.com/v1'
};

// Enhanced CORS proxies with more options and proper fallback
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',  // Most reliable first
  'https://proxy.cors.sh/',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors.bridged.cc/',
  'https://cors-proxy.org/',
  'https://api.scraperapi.com/?api_key=free&url='
];

// CoinLayer as a paid fallback option
const COINLAYER_API_KEY = '965cc1105a753e9ce83f4a2215af5612';
const COINLAYER_BASE_URL = 'http://api.coinlayer.com/';

// Enhanced resilient caching system
let lastSuccessfulPrices: CryptoPrices | null = null;
let lastUpdateTime = 0;
let currentProxyIndex = 0;
let currentApiIndex = 0;
let apiLimitReached = false;

// Static local fallback data with timestamp update
const FALLBACK_PRICES: CryptoPrices = {
  ethereumPrice: 1802.84,
  solanaPrice: 115.73,
  bitcoinPrice: 62500.00,
  timestamp: Math.floor(Date.now() / 1000),
  source: 'fallback'
};

// Cache expiration in milliseconds (10 minutes)
const CACHE_EXPIRATION = 10 * 60 * 1000;

// Fetch timeout - adjust based on network conditions (8 seconds)
const FETCH_TIMEOUT = 8000;

// Maximum retry attempts
const MAX_RETRIES = 3;

// Add the Alchemy API fallback for when all else fails
let alchemyInstance: any = null;

function getAlchemyInstance() {
  if (!alchemyInstance) {
    try {
      const apiKey = process.env.VITE_ALCHEMY_API_KEY || '';
      
      const settings = {
        apiKey: apiKey,
        network: Network.ETH_MAINNET,
      };
      
      alchemyInstance = new Alchemy(settings);
      console.log('Alchemy instance initialized for price data');
    } catch (error) {
      console.error('Failed to initialize Alchemy:', error);
    }
  }
  
  return alchemyInstance;
}

// Get current CORS proxy - retry with different ones if needed
const getCurrentProxy = (): string => {
  return CORS_PROXIES[currentProxyIndex];
};

// Try next proxy in the rotation
const tryNextProxy = (): string => {
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
  const proxy = getCurrentProxy();
  console.log(`Switching to CORS proxy: ${proxy}`);
  return proxy;
};

// Try the next API endpoint
const tryNextApi = (): string => {
  const apiKeys = Object.keys(API_ENDPOINTS) as (keyof typeof API_ENDPOINTS)[];
  currentApiIndex = (currentApiIndex + 1) % apiKeys.length;
  const apiKey = apiKeys[currentApiIndex];
  const endpoint = API_ENDPOINTS[apiKey];
  console.log(`Switching to API endpoint: ${apiKey}`);
  return endpoint;
};

// Generate updated fallback prices with small variations
const getUpdatedFallbackPrices = (): CryptoPrices => {
  const randomVariation = () => (Math.random() - 0.5) * 20; // +/- $10
  
  return {
    ethereumPrice: FALLBACK_PRICES.ethereumPrice + randomVariation(),
    solanaPrice: FALLBACK_PRICES.solanaPrice + randomVariation(),
    bitcoinPrice: FALLBACK_PRICES.bitcoinPrice + randomVariation(),
    timestamp: Math.floor(Date.now() / 1000),
    source: 'fallback'
  };
};

// Check if cache is valid
const isCacheValid = (): boolean => {
  const now = Date.now();
  return lastSuccessfulPrices !== null && (now - lastUpdateTime < CACHE_EXPIRATION);
};

// ============ INTERFACE DEFINITIONS ============

interface CoinLayerResponse {
  success: boolean;
  terms: string;
  privacy: string;
  timestamp: number;
  target: string;
  rates: {
    [key: string]: number;
  };
  error?: {
    code: number;
    type: string;
    info: string;
  };
}

interface CoinGeckoResponse {
  [id: string]: {
    usd: number;
  };
}

interface CoinbaseResponse {
  data: {
    base: string;
    currency: string;
    amount: string;
  };
}

interface BinanceResponse {
  symbol: string;
  price: string;
}

export interface CryptoPrices {
  ethereumPrice: number;
  solanaPrice: number;
  bitcoinPrice: number;
  timestamp: number;
  source?: string;
}

// ============ API FETCH FUNCTIONS ============

// Backup price APIs if CoinGecko fails
const BACKUP_PRICE_APIS = {
  BINANCE: 'https://api.binance.com/api/v3/ticker/price',
  KRAKEN: 'https://api.kraken.com/0/public/Ticker',
  HUOBI: 'https://api.huobi.pro/market/tickers',
  KUCOIN: 'https://api.kucoin.com/api/v1/market/orderbook/level1'
};

// Add direct API endpoints without CORS
const DIRECT_APIS = {
  COINGECKO_DIRECT: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana&vs_currencies=usd',
  BINANCE_DIRECT: 'https://api.binance.com/api/v3/ticker/price?symbols=["ETHUSDT","SOLUSDT"]'
};

/**
 * Enhanced fetch function with timeout and error handling
 */
const fetchWithTimeout = async (url: string, options = {}): Promise<any> => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeout = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT);
  
  try {
    const response = await axios.get(url, { 
      ...options, 
      signal,
      timeout: FETCH_TIMEOUT,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0' // Add user agent to prevent some blocks
      }
    });
    clearTimeout(timeout);
    return response.data;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
};

/**
 * Fetch from CoinGecko with resilient retry logic
 */
const fetchFromCoinGecko = async (): Promise<CryptoPrices | null> => {
  try {
    // Try with proxy first
    const endpoint = '/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd';
    const proxyUrl = `${getCurrentProxy()}${encodeURIComponent(API_ENDPOINTS.COINGECKO + endpoint)}`;
    
    const data = await fetchWithTimeout(proxyUrl);
    
    if (!data.ethereum || !data.solana || !data.bitcoin) {
      console.warn('CoinGecko response missing some price data', data);
      return null;
    }
    
    return {
      ethereumPrice: data.ethereum.usd,
      solanaPrice: data.solana.usd,
      bitcoinPrice: data.bitcoin.usd,
      timestamp: Math.floor(Date.now() / 1000),
      source: 'coingecko'
    };
  } catch (error) {
    console.error('Error fetching from CoinGecko:', error);
    return null;
  }
};

/**
 * Fetch from Coinbase as a fallback
 */
const fetchFromCoinbase = async (): Promise<CryptoPrices | null> => {
  try {
    // Need separate requests for each coin
    const ethUrl = `${getCurrentProxy()}${encodeURIComponent(`${API_ENDPOINTS.COINBASE}/prices/ETH-USD/spot`)}`;
    const btcUrl = `${getCurrentProxy()}${encodeURIComponent(`${API_ENDPOINTS.COINBASE}/prices/BTC-USD/spot`)}`;
    const solUrl = `${getCurrentProxy()}${encodeURIComponent(`${API_ENDPOINTS.COINBASE}/prices/SOL-USD/spot`)}`;
    
    const [ethData, btcData, solData] = await Promise.allSettled([
      fetchWithTimeout(ethUrl),
      fetchWithTimeout(btcUrl),
      fetchWithTimeout(solUrl)
    ]);
    
    // Extract values from results
    const eth = ethData.status === 'fulfilled' ? parseFloat(ethData.value.data.amount) : null;
    const btc = btcData.status === 'fulfilled' ? parseFloat(btcData.value.data.amount) : null;
    const sol = solData.status === 'fulfilled' ? parseFloat(solData.value.data.amount) : null;
    
    // Return null if any are missing
    if (eth === null || btc === null || sol === null) {
      return null;
    }
    
    return {
      ethereumPrice: eth,
      bitcoinPrice: btc,
      solanaPrice: sol,
      timestamp: Math.floor(Date.now() / 1000),
      source: 'coinbase'
    };
  } catch (error) {
    console.error('Error fetching from Coinbase:', error);
    return null;
  }
};

/**
 * Fetch from Binance as another fallback
 */
const fetchFromBinance = async (): Promise<CryptoPrices | null> => {
  try {
    const url = `${getCurrentProxy()}${encodeURIComponent(`${API_ENDPOINTS.BINANCE}/ticker/price?symbols=["ETHUSDT","BTCUSDT","SOLUSDT"]`)}`;
    
    const data = await fetchWithTimeout(url);
    
    if (!Array.isArray(data) || data.length < 3) {
      return null;
    }
    
    // Find each symbol in the response
    const ethPrice = data.find((item: BinanceResponse) => item.symbol === 'ETHUSDT')?.price;
    const btcPrice = data.find((item: BinanceResponse) => item.symbol === 'BTCUSDT')?.price;
    const solPrice = data.find((item: BinanceResponse) => item.symbol === 'SOLUSDT')?.price;
    
    if (!ethPrice || !btcPrice || !solPrice) {
      return null;
    }
    
    return {
      ethereumPrice: parseFloat(ethPrice),
      bitcoinPrice: parseFloat(btcPrice),
      solanaPrice: parseFloat(solPrice),
      timestamp: Math.floor(Date.now() / 1000),
      source: 'binance'
    };
  } catch (error) {
    console.error('Error fetching from Binance:', error);
    return null;
  }
};

/**
 * Fetch from CoinLayer as a last resort
 */
const fetchFromCoinLayer = async (): Promise<CryptoPrices | null> => {
  if (apiLimitReached) {
    return null;
  }
  
  try {
    // Request specific cryptocurrencies to optimize API usage
    const symbols = 'BTC,ETH,SOL';
    const url = `${COINLAYER_BASE_URL}live?access_key=${COINLAYER_API_KEY}&symbols=${symbols}`;
    
    const data = await fetchWithTimeout(url);
    
    if (!data.success) {
      console.error('CoinLayer API error:', data.error);
      
      // Check if we hit the API limit
      if (data.error?.info?.includes('monthly usage limit has been reached')) {
        apiLimitReached = true;
      }
      
      return null;
    }
    
    return {
      ethereumPrice: data.rates.ETH || 0,
      solanaPrice: data.rates.SOL || 0,
      bitcoinPrice: data.rates.BTC || 0,
      timestamp: data.timestamp,
      source: 'coinlayer'
    };
  } catch (error) {
    console.error('Error fetching from CoinLayer:', error);
    return null;
  }
};

// Add a resilient fetch function with retry and proxy rotation
export const fetchWithRetryAndProxy = async (
  url: string, 
  options: RequestInit = {}, 
  retries = 3, 
  proxyIndex = 0, 
  backoff = 300
): Promise<Response> => {
  // If we've tried all proxies and still failing, try direct
  if (proxyIndex >= CORS_PROXIES.length) {
    const directUrl = url;
    try {
      console.log('Trying direct fetch as last resort:', directUrl);
      return await fetch(directUrl, {
        ...options,
        mode: 'cors',
        headers: {
          ...options.headers,
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      if (retries <= 0) throw error;
      
      console.log(`Direct fetch failed. Retrying in ${backoff}ms. Attempts left: ${retries-1}`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetryAndProxy(url, options, retries - 1, 0, backoff * 2);
    }
  }
  
  try {
    const proxy = CORS_PROXIES[proxyIndex];
    const proxiedUrl = `${proxy}${encodeURIComponent(url)}`;
    console.log(`Trying proxy ${proxyIndex+1}/${CORS_PROXIES.length}: ${proxy}`);
    
    const response = await fetch(proxiedUrl, {
      ...options,
      headers: {
        ...options.headers,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error(`Error with proxy ${proxyIndex+1}/${CORS_PROXIES.length}:`, error);
    
    // Try next proxy
    return fetchWithRetryAndProxy(url, options, retries, proxyIndex + 1, backoff);
  }
};

// ============ MAIN API FUNCTIONS ============

/**
 * Main function to fetch cryptocurrency prices with intelligent fallbacks
 * - Uses caching with configurable expiration
 * - Tries multiple API sources
 * - Implements retries with exponential backoff
 * - Provides mock data as final fallback
 */
export const fetchCryptoPrices = async (retryCount = 0): Promise<CryptoPrices | null> => {
  // Return cached data if still valid
  if (isCacheValid()) {
    return {
      ...lastSuccessfulPrices!,
      source: `${lastSuccessfulPrices!.source}-cached`
    };
  }
  
  // Try direct API calls first (no CORS proxy needed)
  try {
    const response = await fetch(DIRECT_APIS.BINANCE_DIRECT);
    if (response.ok) {
      const data = await response.json();
      const ethPrice = parseFloat(data.find((item: any) => item.symbol === 'ETHUSDT').price);
      const solPrice = parseFloat(data.find((item: any) => item.symbol === 'SOLUSDT').price);
      
      const prices = {
        ethereumPrice: ethPrice,
        solanaPrice: solPrice,
        bitcoinPrice: 0, // Not needed for now
        timestamp: Math.floor(Date.now() / 1000),
        source: 'binance-direct'
      };
      
      lastSuccessfulPrices = prices;
      lastUpdateTime = Date.now();
      return prices;
    }
  } catch (error) {
    console.warn('Direct API call failed, trying proxies...');
  }
  
  // Try each CORS proxy in sequence
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(DIRECT_APIS.COINGECKO_DIRECT)}`;
      const response = await fetch(proxyUrl);
      
      if (response.ok) {
        const data = await response.json();
        const prices = {
          ethereumPrice: data.ethereum.usd,
          solanaPrice: data.solana.usd,
          bitcoinPrice: 0, // Not needed for now
          timestamp: Math.floor(Date.now() / 1000),
          source: 'coingecko-proxy'
        };
        
        lastSuccessfulPrices = prices;
        lastUpdateTime = Date.now();
        return prices;
      }
    } catch (error) {
      console.warn(`Proxy ${proxy} failed, trying next...`);
      continue;
    }
  }
  
  // If all else fails, use fallback prices
  console.warn('All price fetching attempts failed, using fallback prices');
  return getUpdatedFallbackPrices();
};

/**
 * Formats a timestamp to a readable date
 * @param timestamp Unix timestamp
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

/**
 * Calculates price change percentage
 * @param currentPrice Current price
 * @param previousPrice Previous price
 * @returns Percentage change as a string with sign
 */
export const calculatePriceChange = (currentPrice: number, previousPrice: number): string => {
  if (!previousPrice) return '0.00%';
  
  const change = ((currentPrice - previousPrice) / previousPrice) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

/**
 * Formats a price to a readable string
 * @param price Price to format
 * @param currency Currency symbol
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency = '$'): string => {
  if (price === undefined || price === null) return `${currency}0.00`;
  
  // Format differently based on price magnitude
  if (price >= 1000) {
    return `${currency}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `${currency}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  } else {
    return `${currency}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
  }
};

/**
 * Formats a crypto price with fallback indicator
 */
export const formatCryptoPrice = (price: number, isLoading: boolean, cryptoSymbol: string): string => {
  if (isLoading) return 'Loading...';
  
  // Check if the price matches a known fallback value
  const isFallback = 
    (cryptoSymbol === 'ETH' && price === FALLBACK_PRICES.ethereumPrice) ||
    (cryptoSymbol === 'SOL' && price === FALLBACK_PRICES.solanaPrice) ||
    (cryptoSymbol === 'BTC' && price === FALLBACK_PRICES.bitcoinPrice);
  
  const formattedPrice = formatPrice(price);
  return isFallback ? `${formattedPrice} (est.)` : formattedPrice;
};

/**
 * Convenience function for updating price state in components
 * @param setEthPrice State setter for ETH price
 * @param setSolPrice State setter for SOL price
 * @param setBtcPrice State setter for BTC price (optional)
 * @param setIsPriceLoading State setter for loading indicator (optional)
 * @param setLastPriceUpdate State setter for last update timestamp (optional)
 */
export const fetchPricesWithRetry = async (
  setEthPrice: (price: number) => void,
  setSolPrice: (price: number) => void,
  setBtcPrice?: (price: number) => void,
  setIsPriceLoading?: (loading: boolean) => void,
  setLastPriceUpdate?: (timestamp: number) => void
) => {
  if (setIsPriceLoading) setIsPriceLoading(true);
  
  try {
    const prices = await fetchCryptoPrices();
    if (prices) {
      setEthPrice(prices.ethereumPrice);
      setSolPrice(prices.solanaPrice);
      if (setBtcPrice) setBtcPrice(prices.bitcoinPrice);
      if (setLastPriceUpdate) setLastPriceUpdate(prices.timestamp);
      
      // Show toast message for fallback data
      if (prices.source === 'fallback') {
        toast.info('Using estimated crypto prices. Live data unavailable.', { toastId: 'fallback-prices' });
      } else if (prices.source === 'stale-cache') {
        toast.info('Using cached price data. Real-time prices unavailable.', { toastId: 'stale-cache-prices' });
      }
    }
  } catch (error) {
    console.error('Error fetching prices:', error);
    toast.error('Failed to fetch crypto prices.', { toastId: 'price-fetch-error' });
  } finally {
    if (setIsPriceLoading) setIsPriceLoading(false);
  }
};

/**
 * Enhanced historical price data fetching with improved resilience
 * @param symbol The cryptocurrency symbol (ETH or SOL)
 * @param timeframeMinutes Timeframe in minutes (1, 5, 15, 60, or 1440)
 * @returns Line chart data for the chart
 */
export const fetchHistoricalPrices = async (symbol: string, timeframeMinutes = 15): Promise<any[]> => {
  // Try all available proxies before falling back to mock data
  for (let attempt = 0; attempt <= CORS_PROXIES.length; attempt++) {
    try {
      // Convert symbol to CoinGecko ID
      const coinId = symbol.toLowerCase() === 'eth' ? 'ethereum' : 'solana';
      
      // Determine days based on timeframe
      let days = 1;
      
      if (timeframeMinutes === 1) {
        days = 1;  // 1 hour data
      } else if (timeframeMinutes === 5) {
        days = 1;  // 4 hour data
      } else if (timeframeMinutes === 15) {
        days = 2;  // 1 day data
      } else if (timeframeMinutes === 60) {
        days = 7;  // 1 week data
      } else if (timeframeMinutes === 1440) {
        days = 30; // 1 month data
      }

      // Get current proxy URL
      const currentProxy = getCurrentProxy();
      
      // Try with market chart data (gives cleaner line data)
      const endpoint = `/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${timeframeMinutes === 1440 ? 'daily' : 'hourly'}`;
      const proxyUrl = `${currentProxy}${encodeURIComponent(API_ENDPOINTS.COINGECKO + endpoint)}`;
      
      console.log(`Fetching ${symbol} data from: ${proxyUrl}`);
      const data = await fetchWithTimeout(proxyUrl);
      
      if (data && data.prices && Array.isArray(data.prices) && data.prices.length > 0) {
        console.log(`Successfully fetched ${symbol} historical prices from CoinGecko market_chart`);
        
        // Format the data for line chart
        return data.prices.map((item: [number, number]) => ({
          time: Math.floor(item[0] / 1000), // Convert ms to seconds
          value: item[1]
        }));
      }
      
    } catch (error) {
      console.error(`Error fetching ${symbol} historical data from proxy (attempt ${attempt + 1}):`, error);
      
      // Try the next proxy if this one failed
      if (attempt < CORS_PROXIES.length) {
        tryNextProxy();
      }
    }
  }
  
  // If all API attempts fail, use generated mock data
  console.warn(`Could not fetch ${symbol} historical data after all attempts, using mock data`);
  return generateFakeChartData(symbol, timeframeMinutes);
};

/**
 * Generate fake chart data for when APIs fail
 * @param symbol Cryptocurrency symbol
 * @param timeframeMinutes Timeframe in minutes
 * @returns Synthetic line chart data
 */
const generateFakeChartData = (symbol: string, timeframeMinutes: number): any[] => {
  const basePrice = symbol.toLowerCase() === 'eth' ? 1802.84 : 115.73;
  const volatility = symbol.toLowerCase() === 'eth' ? 30 : 4;
  const now = Math.floor(Date.now() / 1000);
  const data = [];
  
  // Generate data points based on timeframe
  let totalPoints = 50;
  let secondsPerPoint = 60 * 15; // default 15min
  
  if (timeframeMinutes === 1) {
    // 1 hour with 1min candles
    totalPoints = 60;
    secondsPerPoint = 60;
  } else if (timeframeMinutes === 5) {
    // 4 hours with 5min points
    totalPoints = 48;
    secondsPerPoint = 300;
  } else if (timeframeMinutes === 15) {
    // 1 day with 15min points
    totalPoints = 96;
    secondsPerPoint = 900;
  } else if (timeframeMinutes === 60) {
    // 1 week with 1hour points
    totalPoints = 168;
    secondsPerPoint = 3600;
  } else if (timeframeMinutes === 1440) {
    // 1 month with 1day points
    totalPoints = 30;
    secondsPerPoint = 86400;
  }
  
  // Generate a somewhat realistic price movement
  let currentPrice = basePrice;
  let trend = Math.random() > 0.5 ? 1 : -1;
  let trendStrength = Math.random() * 0.7 + 0.3; // Between 0.3 and 1.0
  let trendDuration = Math.floor(Math.random() * 10) + 5; // 5-15 candles per trend
  
  for (let i = 0; i < totalPoints; i++) {
    const time = now - (totalPoints - i) * secondsPerPoint;
    
    // Occasionally change the trend
    if (i % trendDuration === 0) {
      trend = Math.random() > 0.5 ? 1 : -1;
      trendStrength = Math.random() * 0.7 + 0.3;
      trendDuration = Math.floor(Math.random() * 10) + 5;
    }
    
    // Calculate price movement
    const randomComponent = (Math.random() - 0.5) * 2 * volatility; // Random noise
    const trendComponent = trend * trendStrength * (volatility / 2); // Trend direction
    const priceChange = (randomComponent + trendComponent) / 1000 * basePrice;
    
    // Update current price, ensuring it doesn't deviate too far from base
    currentPrice += priceChange;
    
    // Prevent price from going too far from baseline (mean reversion)
    if (Math.abs(currentPrice - basePrice) > basePrice * 0.1) {
      currentPrice = basePrice + (Math.sign(currentPrice - basePrice) * basePrice * 0.1);
    }
    
    // Ensure price is positive
    currentPrice = Math.max(currentPrice, basePrice * 0.5);
    
    data.push({
      time,
      value: currentPrice
    });
  }
  
  return data;
};
