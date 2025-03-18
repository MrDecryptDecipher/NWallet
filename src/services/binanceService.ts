import axios from 'axios';

const WS_BASE_URL = 'wss://ws-api.binance.com:443/ws-api/v3';
const REST_BASE_URL = 'https://api.binance.com';

interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
}

interface BinanceResponse<T> {
  id: string | number | null;
  status: number;
  result?: T;
  error?: {
    code: number;
    msg: string;
    data?: {
      serverTime?: number;
      retryAfter?: number;
    };
  };
  rateLimits?: {
    rateLimitType: 'REQUEST_WEIGHT' | 'ORDERS';
    interval: 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY';
    intervalNum: number;
    limit: number;
    count: number;
  }[];
}

interface TickerPriceResponse {
  symbol: string;
  price: string;
}

type KlineTuple = [
  number,      // Kline open time
  string,      // Open price
  string,      // High price
  string,      // Low price
  string,      // Close price
  string,      // Volume
  number,      // Kline close time
  string,      // Quote asset volume
  number,      // Number of trades
  string,      // Taker buy base asset volume
  string,      // Taker buy quote asset volume
  string       // Unused field, ignore
];

interface KlineResponse {
  result: Array<KlineTuple>;
}

class BinanceWebSocket {
  private ws: WebSocket | null = null;
  private baseUrl = 'wss://stream.binance.com:9443/ws';
  private subscriptions: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pingInterval: number | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.baseUrl);

      this.ws.onopen = () => {
        console.log('Connected to Binance WebSocket');
        this.reconnectAttempts = 0;
        this.setupPing();
        this.resubscribe();
      };

      this.ws.onclose = () => {
        console.log('Disconnected from Binance WebSocket');
        this.cleanup();
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.e === 'kline') {
            this.handleKlineData(data);
          } else if (data.e === '24hrTicker') {
            this.handleTickerData(data);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.reconnect();
    }
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private setupPing() {
    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: 'ping' }));
      }
    }, 30000);
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(), 5000 * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private resubscribe() {
    if (this.subscriptions.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
      this.subscriptions.forEach(sub => {
        this.ws!.send(JSON.stringify({
          method: 'SUBSCRIBE',
          params: [sub],
          id: Date.now()
        }));
      });
    }
  }

  public subscribe(symbol: string, interval: string = '1m') {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    if (!this.subscriptions.has(stream) && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [stream],
        id: Date.now()
      }));
      this.subscriptions.add(stream);
    }
  }

  public unsubscribe(symbol: string, interval: string = '1m') {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    if (this.subscriptions.has(stream) && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: [stream],
        id: Date.now()
      }));
      this.subscriptions.delete(stream);
    }
  }

  private handleKlineData(data: any) {
    // Implement kline data handling
    console.log('Kline data:', data);
  }

  private handleTickerData(data: any) {
    // Implement ticker data handling
    console.log('Ticker data:', data);
  }

  public close() {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

const wsClient = new BinanceWebSocket();

export const BINANCE_INTERVALS = {
  '1m': '1 minute',
  '3m': '3 minutes',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '30m': '30 minutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '4h': '4 hours',
  '6h': '6 hours',
  '8h': '8 hours',
  '12h': '12 hours',
  '1d': '1 day',
  '3d': '3 days',
  '1w': '1 week',
  '1M': '1 month'
} as const;

type TimeframeKey = keyof typeof BINANCE_INTERVALS;

export const binanceService = {
  async getSymbolPrice(symbol: string): Promise<number> {
    try {
      const response = await axios.get(`${REST_BASE_URL}/api/v3/ticker/price`, {
        params: { symbol }
      });
      return parseFloat(response.data.price);
    } catch (error) {
      console.error('Error fetching price:', error);
      throw error;
    }
  },

  async getKlines(symbol: string, interval: string, limit: number = 500): Promise<KlineData[]> {
    try {
      const response = await axios.get(`${REST_BASE_URL}/api/v3/klines`, {
        params: {
          symbol,
          interval,
          limit
        }
      });
      
      return response.data.map((kline: any[]) => ({
        openTime: kline[0],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
        closeTime: kline[6],
        quoteVolume: kline[7],
        trades: kline[8],
        takerBuyBaseVolume: kline[9],
        takerBuyQuoteVolume: kline[10]
      }));
    } catch (error) {
      console.error('Error fetching klines:', error);
      throw error;
    }
  },

  getTimeframeInterval(timeframe: string): string {
    switch (timeframe) {
      case '1H':
        return '1m';  // 1-minute intervals for detailed 1-hour view
      case '4H':
        return '3m';  // 3-minute intervals for 4-hour view
      case '12H':
        return '5m';  // 5-minute intervals for 12-hour view
      case '1D':
        return '15m'; // 15-minute intervals for 1-day view
      case '3D':
        return '30m'; // 30-minute intervals for 3-day view
      case '1W':
        return '4h';  // 4-hour intervals for 1-week view
      case '2W':
        return '6h';  // 6-hour intervals for 2-week view
      case '1M':
        return '1d';  // 1-day intervals for 1-month view
      case '3M':
        return '3d';  // 3-day intervals for 3-month view
      case '6M':
        return '1w';  // 1-week intervals for 6-month view
      case '1Y':
        return '1M';  // 1-month intervals for 1-year view
      default:
        return '15m'; // Default to 15-minute intervals
    }
  },

  getTimeframeLimit(timeframe: string): number {
    switch (timeframe) {
      case '1H':
        return 60;    // 60 one-minute candles
      case '4H':
        return 80;    // 80 three-minute candles
      case '12H':
        return 144;   // 144 five-minute candles
      case '1D':
        return 96;    // 96 fifteen-minute candles
      case '3D':
        return 144;   // 144 thirty-minute candles
      case '1W':
        return 42;    // 42 four-hour candles
      case '2W':
        return 56;    // 56 six-hour candles
      case '1M':
        return 30;    // 30 one-day candles
      case '3M':
        return 30;    // 30 three-day candles
      case '6M':
        return 26;    // 26 one-week candles
      case '1Y':
        return 12;    // 12 one-month candles
      default:
        return 96;    // Default to 96 candles
    }
  },

  // Helper method to get available timeframes
  getAvailableTimeframes(): string[] {
    return [
      '1H', '4H', '12H', '1D', '3D',
      '1W', '2W', '1M', '3M', '6M', '1Y'
    ];
  }
}; 