import React, { useEffect, useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { formatAddress } from '../utils/format';
import { useTheme } from '../contexts/ThemeContext';

const WalletInfo: React.FC = () => {
  const { ethAddress, solAddress, getBalance } = useWallet();
  const { theme } = useTheme();
  const [balances, setBalances] = useState({ eth: '0', sol: '0' });
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    const fetchBalances = async () => {
      if (ethAddress || solAddress) {
        const newBalances = await getBalance();
        setBalances(newBalances);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [ethAddress, solAddress, getBalance]);

  if (!ethAddress && !solAddress) {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg ${
      isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
    }`}>
      <div className="space-y-4">
        {ethAddress && (
          <div className="flex flex-col">
            <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Ethereum Address
            </span>
            <span className={`font-mono text-sm break-all ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {formatAddress(ethAddress)}
            </span>
            <span className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              {balances.eth} ETH
            </span>
          </div>
        )}

        {solAddress && (
          <div className="flex flex-col">
            <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Solana Address
            </span>
            <span className={`font-mono text-sm break-all ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {formatAddress(solAddress)}
            </span>
            <span className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              {balances.sol} SOL
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletInfo; 