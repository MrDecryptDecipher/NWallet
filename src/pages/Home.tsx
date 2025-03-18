import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface Activity {
  type: string;
  transactionHash?: string;
  timestamp?: number;
  // Add other activity properties as needed
}

interface HomeProps {
  nftGenActivity?: Activity[];
}

const Home: React.FC<HomeProps> = ({ nftGenActivity = [] }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [activities, setActivities] = useState<Activity[]>(nftGenActivity);

  useEffect(() => {
    const checkNFTGenActivity = () => {
      const transactionHash = localStorage.getItem('nftgen_transactionHash');
      if (transactionHash) {
        setActivities(prev => {
          if (!prev.some(activity => activity.transactionHash === transactionHash)) {
            return [{
              type: 'transaction',
              transactionHash,
              timestamp: Date.now()
            }, ...prev];
          }
          return prev;
        });
      }
    };

    checkNFTGenActivity();
    const intervalId = setInterval(checkNFTGenActivity, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className={`w-full min-h-screen flex flex-col items-center justify-center p-4 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900' 
        : 'bg-gradient-to-br from-purple-200 via-slate-100 to-pink-200'
    }`}>
      <div className="max-w-xl w-full flex flex-col items-center justify-center text-center">
        <h1 className={`text-4xl md:text-5xl font-bold mb-12 ${
          isDarkMode ? 'text-white' : 'text-slate-800'
        }`}>
          NIJA CUSTODIAN WALLET
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full mb-12">
          <Link to="/register" className="w-full sm:w-auto">
            <button className={`w-full sm:w-auto px-8 py-3 rounded-lg border transition ${
              isDarkMode 
                ? 'bg-purple-700/40 border-purple-500/40 text-white hover:bg-purple-700/60' 
                : 'bg-purple-500/20 border-purple-500/30 text-purple-800 hover:bg-purple-500/30'
            }`}>
              Register
            </button>
          </Link>

          <Link to="/login" className="w-full sm:w-auto">
            <button className={`w-full sm:w-auto px-8 py-3 rounded-lg border transition ${
              isDarkMode 
                ? 'bg-pink-700/40 border-pink-500/40 text-white hover:bg-pink-700/60' 
                : 'bg-pink-500/20 border-pink-500/30 text-pink-800 hover:bg-pink-500/30'
            }`}>
              Login
            </button>
          </Link>
        </div>

        {activities.length > 0 && (
          <div className={`mt-6 px-4 py-3 rounded-lg w-full ${
            isDarkMode ? 'bg-slate-800/50 text-white' : 'bg-white/50 text-slate-800'
          }`}>
            <p className="font-medium">Recent NFTGen Activities:</p>
            {activities.slice(0, 3).map((activity, index) => (
              <div key={activity.transactionHash || index} className="font-mono text-sm break-all mt-2">
                <p className="text-xs opacity-70">
                  {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Recent'}
                </p>
                <p>Type: {activity.type}</p>
                {activity.transactionHash && (
                  <p>Hash: {activity.transactionHash}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`absolute bottom-4 ${
        isDarkMode ? 'text-white/60' : 'text-slate-600'
      }`}>
        Powered by Nija
      </div>
    </div>
  );
};

export default Home;