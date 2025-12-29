import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries } from 'lightweight-charts';

export const CryptoChart = ({ symbol = 'ETH', isDark = true }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartApiRef = useRef<IChartApi | null>(null);
    const [timeframe, setTimeframe] = useState('1D');

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: isDark ? '#D9D9D9' : '#191919',
            },
            grid: {
                vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : '#404040' },
                horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : '#404040' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        // Candlestick Series (v5 API)
        const newSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        // Generate Mock Data (Mocking FreeCryptoAPI response structure)
        // In real impl, fetch(`https://freecryptoapi.com/v1/...`)
        const data = generateData();
        newSeries.setData(data);

        chartApiRef.current = chart;

        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [symbol, isDark]);

    return (
        <div className="w-full bg-slate-900/50 rounded-xl border border-white/5 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <span className="text-cyan-400">{symbol}</span>/USD
                </h3>
                <div className="flex gap-2">
                    {['1H', '1D', '1W', '1M'].map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 text-xs rounded-lg transition ${timeframe === tf ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>
            <div ref={chartContainerRef} className="w-full h-[400px]" />
        </div>
    );
};

// Helper to generate realistic looking candle data
function generateData() {
    let price = 2500;
    const data = [];
    const date = new Date();
    date.setDate(date.getDate() - 100);

    for (let i = 0; i < 100; i++) {
        const open = price;
        const close = price + (Math.random() - 0.5) * 100;
        const high = Math.max(open, close) + Math.random() * 50;
        const low = Math.min(open, close) - Math.random() * 50;

        data.push({
            time: date.toISOString().split('T')[0],
            open, high, low, close
        });

        price = close;
        date.setDate(date.getDate() + 1);
    }
    return data;
}
