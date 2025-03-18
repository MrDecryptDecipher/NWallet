import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import { binanceService, BINANCE_INTERVALS } from '../../services/binanceService';
import { format } from 'date-fns';
import './PriceChart.css';

interface PriceChartProps {
  symbol: string;
  defaultTimeframe?: string;
}

interface ChartData {
  klines: any[];
  bidAsk: {
    bidPrice: string;
    bidQty: string;
    askPrice: string;
    askQty: string;
  };
}

export const PriceChart: React.FC<PriceChartProps> = ({ symbol, defaultTimeframe = '1D' }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const subscribeToBookTicker = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const request = {
        id: Date.now().toString(),
        method: 'bookTicker.subscribe',
        params: {
          symbol: symbol
        }
      };
      wsRef.current.send(JSON.stringify(request));
    }
  };

  useEffect(() => {
    // Initialize WebSocket connection for real-time bid/ask data
    wsRef.current = new WebSocket('wss://ws-api.binance.com:443/ws-api/v3');

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      subscribeToBookTicker();
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event?.data) {
        setChartData(prevData => ({
          ...prevData!,
          bidAsk: {
            bidPrice: data.event.data.b,
            bidQty: data.event.data.B,
            askPrice: data.event.data.a,
            askQty: data.event.data.A
          }
        }));
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol]);

  const fetchChartData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const interval = binanceService.getTimeframeInterval(timeframe);
      const limit = binanceService.getTimeframeLimit(timeframe);
      
      const klines = await binanceService.getKlines(symbol, interval, limit);
      
      setChartData(prevData => ({
        ...prevData,
        klines
      }));

      updateChart(klines);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateChart = (klines: any[]) => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'candlestick',
      data: {
        datasets: [
          {
            label: symbol,
            data: klines.map(k => ({
              x: new Date(k.openTime),
              o: parseFloat(k.open),
              h: parseFloat(k.high),
              l: parseFloat(k.low),
              c: parseFloat(k.close),
              v: parseFloat(k.volume)
            }))
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: timeframe === '1D' ? 'hour' : 'day'
            }
          },
          y: {
            position: 'right',
            title: {
              display: true,
              text: 'Price'
            }
          },
          y1: {
            position: 'left',
            title: {
              display: true,
              text: 'Volume'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        },
        plugins: {
          zoom: {
            pan: {
              enabled: true,
              mode: 'x'
            },
            zoom: {
              wheel: {
                enabled: true
              },
              pinch: {
                enabled: true
              },
              mode: 'x'
            }
          },
          legend: {
            display: false
          }
        }
      }
    });
  };

  useEffect(() => {
    fetchChartData();
    const interval = setInterval(fetchChartData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  return (
    <div className="price-chart">
      <div className="chart-header">
        <div className="timeframe-selector">
          {binanceService.getAvailableTimeframes().map((tf) => (
              <button
              key={tf}
              className={`timeframe-button ${timeframe === tf ? 'active' : ''}`}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
              </button>
            ))}
          </div>
        {chartData?.bidAsk && (
          <div className="bid-ask-spread">
            <div className="bid">
              <span className="label">Bid:</span>
              <span className="price">{parseFloat(chartData.bidAsk.bidPrice).toFixed(2)}</span>
              <span className="quantity">({parseFloat(chartData.bidAsk.bidQty).toFixed(4)})</span>
        </div>
            <div className="ask">
              <span className="label">Ask:</span>
              <span className="price">{parseFloat(chartData.bidAsk.askPrice).toFixed(2)}</span>
              <span className="quantity">({parseFloat(chartData.bidAsk.askQty).toFixed(4)})</span>
            </div>
            </div>
          )}
        </div>
      
      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading">Loading chart data...</div>}
      
      <div className="chart-container">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}; 