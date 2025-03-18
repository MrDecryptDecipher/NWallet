import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { binanceService } from '@/services/binanceService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PriceChartProps {
  symbol: string;
  timeframe: "1H" | "1D" | "1W" | "1M";
  theme?: 'light' | 'dark';
}

export default function PriceChart({ symbol, timeframe, theme = 'dark' }: PriceChartProps) {
  const [chartData, setChartData] = useState<ChartData<'line'>>({
    labels: [],
    datasets: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchKlines = async () => {
      try {
        setIsLoading(true);
        const interval = binanceService.getTimeframeInterval(timeframe);
        const limit = binanceService.getTimeframeLimit(timeframe);
        const klines = await binanceService.getKlines(symbol, interval, limit);

        const labels = klines.map(k => {
          const date = new Date(k.openTime);
          switch (timeframe) {
            case '1H':
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            case '1D':
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            case '1W':
              return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            case '1M':
              return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            default:
              return date.toLocaleString();
          }
        });

        const prices = klines.map(k => parseFloat(k.close));

        setChartData({
          labels,
          datasets: [
            {
              label: `${symbol} Price`,
              data: prices,
              borderColor: theme === 'dark' ? 'rgb(147, 51, 234)' : 'rgb(124, 58, 237)',
              backgroundColor: theme === 'dark' ? 'rgba(147, 51, 234, 0.5)' : 'rgba(124, 58, 237, 0.5)',
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.4,
              fill: true
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching kline data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKlines();
    const interval = setInterval(fetchKlines, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [symbol, timeframe, theme]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: theme === 'dark' ? '#fff' : '#000',
        bodyColor: theme === 'dark' ? '#fff' : '#000',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          color: theme === 'dark' ? '#9CA3AF' : '#4B5563',
          maxRotation: 0
        }
      },
      y: {
        display: true,
        position: 'right' as const,
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: theme === 'dark' ? '#9CA3AF' : '#4B5563'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <Line data={chartData} options={options} />
    </div>
  );
} 