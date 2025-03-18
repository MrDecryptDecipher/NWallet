import React, { useState, useEffect } from 'react';

// Create a safe version of the Debug component that doesn't rely on Wagmi
export const Debug: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isWagmiAvailable, setIsWagmiAvailable] = useState(false);
  const [walletInfo, setWalletInfo] = useState({
    address: '',
    isConnected: false,
    connectorName: '',
    chainId: '',
    chainName: ''
  });
  
  // Check if ethereum provider exists and get basic info
  useEffect(() => {
    const checkWalletConnection = () => {
      try {
        if (window.ethereum) {
          const address = window.ethereum.selectedAddress || '';
          const chainId = window.ethereum.chainId || '';
          const isConnected = !!address;
          
          setWalletInfo({
            address,
            isConnected,
            connectorName: window.ethereum.isNijaWallet ? 'Nija Wallet' : 'Unknown',
            chainId,
            chainName: getChainName(chainId)
          });
        }
      } catch (error) {
        console.warn('Error checking wallet connection:', error);
      }
    };
    
    checkWalletConnection();
    
    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      setWalletInfo(prev => ({
        ...prev,
        address: accounts[0] || '',
        isConnected: !!accounts[0]
      }));
    };
    
    // Listen for chain changes
    const handleChainChanged = (chainId: string) => {
      setWalletInfo(prev => ({
        ...prev,
        chainId,
        chainName: getChainName(chainId)
      }));
    };
    
    if (window.ethereum) {
      window.ethereum.on?.('accountsChanged', handleAccountsChanged);
      window.ethereum.on?.('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener?.('chainChanged', handleChainChanged);
      }
    };
  }, []);
  
  const getChainName = (chainId: string): string => {
    const chains: Record<string, string> = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli Testnet',
      '0xaa36a7': 'Sepolia Testnet',
      // Add more chains as needed
    };
    
    return chains[chainId] || `Unknown Chain (${chainId})`;
  };

  const toggleDebug = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={toggleDebug}
        className="bg-violet-700 hover:bg-violet-800 text-white px-3 py-1 rounded-md text-sm shadow-lg"
      >
        {isOpen ? 'Hide Debug' : 'Debug'}
      </button>
      
      {isOpen && (
        <div className="absolute bottom-10 right-0 w-80 bg-slate-900 text-white p-4 rounded-lg shadow-xl border border-violet-500 text-xs font-mono">
          <h3 className="text-violet-400 font-semibold mb-2">Debug Panel</h3>
          <div className="space-y-1 mb-2">
            <p><span className="text-gray-400">Connected:</span> {walletInfo.isConnected ? '✅' : '❌'}</p>
            <p><span className="text-gray-400">Address:</span> {walletInfo.address || 'None'}</p>
            <p><span className="text-gray-400">Connector:</span> {walletInfo.connectorName || 'None'}</p>
            <p><span className="text-gray-400">Chain ID:</span> {walletInfo.chainId || 'None'}</p>
            <p><span className="text-gray-400">Chain Name:</span> {walletInfo.chainName || 'None'}</p>
          </div>
          
          <details className="text-gray-300">
            <summary className="cursor-pointer text-violet-400">Environment</summary>
            <div className="pl-2 pt-1 space-y-1">
              <p><span className="text-gray-400">User Agent:</span> {navigator.userAgent}</p>
              <p><span className="text-gray-400">Window Ethereum:</span> {window.ethereum ? '✅' : '❌'}</p>
              <p><span className="text-gray-400">Base URL:</span> {window.location.origin}</p>
              <p><span className="text-gray-400">Path:</span> {window.location.pathname}</p>
              <p><span className="text-gray-400">Viewport:</span> {window.innerWidth}x{window.innerHeight}</p>
            </div>
          </details>
          
          <details className="text-gray-300 mt-2">
            <summary className="cursor-pointer text-violet-400">Network Tests</summary>
            <div className="pl-2 pt-1">
              <button 
                onClick={() => {
                  fetch('https://api.coingecko.com/api/v3/ping')
                    .then(res => {
                      console.log('CoinGecko API test:', res.status);
                      alert(`CoinGecko API test: ${res.status}`);
                    })
                    .catch(err => {
                      console.error('CoinGecko API test failed:', err);
                      alert(`CoinGecko API test failed: ${err.message}`);
                    });
                }}
                className="bg-violet-600 hover:bg-violet-700 text-white px-2 py-1 rounded-md text-xs mt-1"
              >
                Test CoinGecko API
              </button>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}; 