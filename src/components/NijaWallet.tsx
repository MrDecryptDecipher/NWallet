import React from 'react';
import { useWallet } from '../contexts/WalletContext';

interface NijaWalletProps {
  children: React.ReactNode;
  currentView: string;
  setCurrentView: (view: string) => void;
  onReceive: () => void;
}

export const NijaWallet: React.FC<NijaWalletProps> = ({ 
  children, 
  currentView, 
  setCurrentView
}) => {
  const { isConnected, connect, disconnect } = useWallet();

  const handleConnect = () => {
    connect('metamask').catch(console.error);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-white">
      <aside className="w-64 border-r border-gray-700 hidden md:flex flex-col p-4">
        <div className="text-2xl font-bold text-blue-400 mb-10 pl-2">Nija</div>
        
        <nav className="flex-1 space-y-2">
           <button 
             className={`w-full text-left px-4 py-2 rounded ${currentView === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
             onClick={() => setCurrentView('dashboard')}
           >
             Dashboard
           </button>
           <button 
             className={`w-full text-left px-4 py-2 rounded ${currentView === 'nft' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
             onClick={() => setCurrentView('nft')}
           >
             NFT Gallery
           </button>
        </nav>

        <div className="mt-auto">
           {isConnected ? (
              <button onClick={disconnect} className="w-full text-left px-4 py-2 rounded text-red-400 hover:bg-gray-800">
                Sign Out
              </button>
           ) : (
              <button onClick={handleConnect} className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                Connect Wallet
              </button>
           )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative p-4">
        {children}
      </main>
    </div>
  );
};
