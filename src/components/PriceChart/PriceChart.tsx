import React from 'react';
import { GlassCard } from '../ui/GlassCard';

export const PriceChart: React.FC = () => {
  return (
    <GlassCard className="h-full flex items-center justify-center p-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2 text-gray-300">Live Market Data</h3>
        <p className="text-gray-500 mb-4">Real-time charts require a specialized data subscription (e.g. TradingView).</p>
        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">Integration Pending</span>
      </div>
    </GlassCard>
  );
};
