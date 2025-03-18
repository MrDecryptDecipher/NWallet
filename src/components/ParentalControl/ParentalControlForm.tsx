import React, { useState } from 'react';
import { ParentalControlSettings } from '../../contexts/ParentalContext';

interface ParentalControlFormProps {
  settings: ParentalControlSettings;
  onSave: (settings: Partial<ParentalControlSettings>) => void;
}

const ParentalControlForm: React.FC<ParentalControlFormProps> = ({ settings, onSave }) => {
  // Spending limits
  const [perTransactionLimit, setPerTransactionLimit] = useState(
    settings.spendingLimits.perTransaction
  );
  const [dailyLimit, setDailyLimit] = useState(
    settings.spendingLimits.daily
  );
  const [weeklyLimit, setWeeklyLimit] = useState(
    settings.spendingLimits.weekly
  );
  const [monthlyLimit, setMonthlyLimit] = useState(
    settings.spendingLimits.monthly
  );
  
  // Time restrictions
  const [startTime, setStartTime] = useState(
    settings.timeRestrictions.allowedHours.start
  );
  const [endTime, setEndTime] = useState(
    settings.timeRestrictions.allowedHours.end
  );
  const [timeRestrictionEnabled, setTimeRestrictionEnabled] = useState(
    settings.timeRestrictions.enabled
  );
  
  // Allowed days
  const [allowedDays, setAllowedDays] = useState(
    settings.timeRestrictions.allowedDays
  );
  
  // Address, token, and DApp allowlists
  const [newAddress, setNewAddress] = useState('');
  const [newToken, setNewToken] = useState('');
  const [newDApp, setNewDApp] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      spendingLimits: {
        perTransaction: perTransactionLimit,
        daily: dailyLimit,
        weekly: weeklyLimit,
        monthly: monthlyLimit
      },
      timeRestrictions: {
        enabled: timeRestrictionEnabled,
        allowedHours: {
          start: startTime,
          end: endTime
        },
        allowedDays: allowedDays
      }
    });
  };
  
  const handleAddAddress = () => {
    if (!newAddress) return;
    
    onSave({
      allowedAddresses: [...settings.allowedAddresses, newAddress]
    });
    setNewAddress('');
  };
  
  const handleAddToken = () => {
    if (!newToken) return;
    
    onSave({
      allowedTokens: [...settings.allowedTokens, newToken]
    });
    setNewToken('');
  };
  
  const handleAddDApp = () => {
    if (!newDApp) return;
    
    onSave({
      allowedDApps: [...settings.allowedDApps, newDApp]
    });
    setNewDApp('');
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Spending Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Per Transaction</label>
            <input
              type="number"
              value={perTransactionLimit}
              onChange={(e) => setPerTransactionLimit(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Daily Limit</label>
            <input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Weekly Limit</label>
            <input
              type="number"
              value={weeklyLimit}
              onChange={(e) => setWeeklyLimit(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Monthly Limit</label>
            <input
              type="number"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min="0"
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Time Restrictions</h3>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={timeRestrictionEnabled}
            onChange={(e) => setTimeRestrictionEnabled(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm font-medium">Enable time restrictions</label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={!timeRestrictionEnabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={!timeRestrictionEnabled}
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Allowed Days</label>
          <div className="flex flex-wrap gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <button
                key={day}
                type="button"
                className={`px-3 py-1 text-sm rounded ${
                  allowedDays[index]
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => {
                  const newAllowedDays = [...allowedDays];
                  newAllowedDays[index] = !newAllowedDays[index];
                  setAllowedDays(newAllowedDays);
                }}
                disabled={!timeRestrictionEnabled}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Allowed Addresses</h3>
        <div className="flex mb-2">
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter address"
          />
          <button
            type="button"
            onClick={handleAddAddress}
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        <div className="mt-2 space-y-1">
          {settings.allowedAddresses.map((address) => (
            <div
              key={address}
              className="flex justify-between items-center p-2 bg-gray-100 rounded"
            >
              <div className="truncate">{address}</div>
              <button
                type="button"
                onClick={() =>
                  onSave({
                    allowedAddresses: settings.allowedAddresses.filter(
                      (a) => a !== address
                    ),
                  })
                }
                className="ml-2 text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Allowed Tokens</h3>
        <div className="flex mb-2">
          <input
            type="text"
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter token address or symbol"
          />
          <button
            type="button"
            onClick={handleAddToken}
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        <div className="mt-2 space-y-1">
          {settings.allowedTokens.map((token) => (
            <div
              key={token}
              className="flex justify-between items-center p-2 bg-gray-100 rounded"
            >
              <div className="truncate">{token}</div>
              <button
                type="button"
                onClick={() =>
                  onSave({
                    allowedTokens: settings.allowedTokens.filter(
                      (t) => t !== token
                    ),
                  })
                }
                className="ml-2 text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Allowed DApps</h3>
        <div className="flex mb-2">
          <input
            type="text"
            value={newDApp}
            onChange={(e) => setNewDApp(e.target.value)}
            className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter DApp name"
          />
          <button
            type="button"
            onClick={handleAddDApp}
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        <div className="mt-2 space-y-1">
          {settings.allowedDApps.map((dapp) => (
            <div
              key={dapp}
              className="flex justify-between items-center p-2 bg-gray-100 rounded"
            >
              <div className="truncate">{dapp}</div>
              <button
                type="button"
                onClick={() =>
                  onSave({
                    allowedDApps: settings.allowedDApps.filter(
                      (d) => d !== dapp
                    ),
                  })
                }
                className="ml-2 text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Settings
        </button>
      </div>
    </form>
  );
};

export default ParentalControlForm;