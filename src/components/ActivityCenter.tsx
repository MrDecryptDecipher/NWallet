// src/components/ActivityCenter.tsx
import React from 'react';
import { 
  CubeIcon, 
  ArrowsRightLeftIcon, 
  ShoppingCartIcon,
  PaperAirplaneIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { NFTGenActivity } from '../hooks/useNFTGenIntegration';

// Define a union type that can handle both activity formats
export type ActivityData = {
  type: 'mint' | 'transfer' | 'fractionalize' | 'sell' | 'buy';
  hash: `0x${string}`;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  details: Record<string, any>;
  name?: string; // Make name optional for compatibility
};

interface ActivityCenterProps {
  activities: (ActivityData | NFTGenActivity)[];
  onClose: () => void;
}

export const ActivityCenter: React.FC<ActivityCenterProps> = ({ activities, onClose }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'mint':
        return <CubeIcon className="h-5 w-5 text-green-400" />;
      case 'transfer':
        return <ArrowsRightLeftIcon className="h-5 w-5 text-blue-400" />;
      case 'sale':
      case 'sell':
        return <ShoppingCartIcon className="h-5 w-5 text-purple-400" />;
      case 'purchase':
      case 'buy':
        return <ShoppingCartIcon className="h-5 w-5 text-yellow-400" />;
      case 'listing':
        return <TagIcon className="h-5 w-5 text-orange-400" />;
      case 'fractionalize':
        return <PaperAirplaneIcon className="h-5 w-5 text-red-400" />;
      default:
        return <CubeIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const openInExplorer = (hash?: string) => {
    if (hash) {
      window.open(`https://etherscan.io/tx/${hash}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900/90 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Activity Center</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {activities.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No activities yet
            </div>
          ) : (
            <ul className="space-y-2">
              {activities.map((activity, index) => {
                // Get status with fallback
                const status = 'status' in activity ? activity.status : 'confirmed';
                
                // Get name with fallback
                const name = 'name' in activity ? activity.name : 
                             ('details' in activity && activity.details?.name) ? activity.details.name : '';
                
                return (
                  <li 
                    key={index} 
                    className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-3 cursor-pointer"
                    onClick={() => openInExplorer(activity.hash)}
                  >
                    <div className="bg-slate-700/50 rounded-full p-2">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <span className="font-medium text-white capitalize">
                          {activity.type} {name}
                        </span>
                        <span className={getStatusColor(status)}>
                          {status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400">
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};