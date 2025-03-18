import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi } from 'lightweight-charts';
import { useTheme } from '../contexts/ThemeContext';

interface ChartProps {
  data: Array<{
    time: string;
    value: number;
  }>;
  height?: number;
  width?: number;
}

const Chart: React.FC<ChartProps> = ({ 
  data, 
  height = 300, 
  width = 600 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: isDarkMode ? '#D1D5DB' : '#1F2937',
      },
      grid: {
        vertLines: { color: isDarkMode ? '#374151' : '#E5E7EB' },
        horzLines: { color: isDarkMode ? '#374151' : '#E5E7EB' },
      },
      width,
      height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    };

    chartRef.current = createChart(chartContainerRef.current, chartOptions);
    const lineSeries = chartRef.current.addSeries();

    lineSeries.setData(data.map(item => ({
      time: item.time,
      value: item.value,
    })));

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [data, height, width, isDarkMode]);

  useEffect(() => {
    if (!chartRef.current) return;

    chartRef.current.applyOptions({
      layout: {
        textColor: isDarkMode ? '#D1D5DB' : '#1F2937',
      },
      grid: {
        vertLines: { color: isDarkMode ? '#374151' : '#E5E7EB' },
        horzLines: { color: isDarkMode ? '#374151' : '#E5E7EB' },
      },
    });
  }, [isDarkMode]);

  return (
    <div className="relative">
      <div ref={chartContainerRef} />
    </div>
  );
};

export default Chart; 