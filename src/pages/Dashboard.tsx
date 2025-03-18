import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import WalletInfo from '../components/WalletInfo';
import Chart from '../components/Chart';

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Sample data for the chart
  const chartData = [
    { time: '2024-03-01', value: 1500 },
    { time: '2024-03-02', value: 1520 },
    { time: '2024-03-03', value: 1480 },
    { time: '2024-03-04', value: 1510 },
    { time: '2024-03-05', value: 1540 },
    { time: '2024-03-06', value: 1530 },
    { time: '2024-03-07', value: 1560 },
  ];

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900' 
        : 'bg-gradient-to-br from-purple-200 via-slate-100 to-pink-200'
    }`}>
      <div className="container mx-auto px-4 py-8">
        <h1 className={`text-3xl font-bold mb-8 ${
          isDarkMode ? 'text-white' : 'text-slate-900'
        }`}>
          Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <WalletInfo />
          </div>

          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Portfolio Value
            </h2>
            <Chart data={chartData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 