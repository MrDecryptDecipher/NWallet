import React, { useState } from 'react';
import { useParentalControl } from '../../contexts/ParentalControlContext';
import { toast } from 'react-toastify';

const ParentalControlSettings: React.FC = () => {
  const {
    isEnabled,
    spendingLimits,
    allowedAddresses,
    allowedTokens,
    allowedDapps,
    timeRestrictions,
    enableParentalControls,
    disableParentalControls,
    updateSpendingLimits,
    addAllowedAddress,
    removeAllowedAddress,
    addAllowedToken,
    removeAllowedToken,
    addAllowedDapp,
    removeAllowedDapp,
    updateTimeRestrictions,
  } = useParentalControl();

  const [password, setPassword] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newToken, setNewToken] = useState('');
  const [newDapp, setNewDapp] = useState('');
  const [dailyLimit, setDailyLimit] = useState(spendingLimits.daily.toString());
  const [weeklyLimit, setWeeklyLimit] = useState(spendingLimits.weekly.toString());
  const [monthlyLimit, setMonthlyLimit] = useState(spendingLimits.monthly.toString());
  const [startHour, setStartHour] = useState(timeRestrictions.startHour.toString());
  const [endHour, setEndHour] = useState(timeRestrictions.endHour.toString());
  const [selectedDays, setSelectedDays] = useState(timeRestrictions.daysAllowed);

  const handleToggleControls = async () => {
    try {
      if (isEnabled) {
        await disableParentalControls(password);
      } else {
        await enableParentalControls(password);
      }
      setPassword('');
    } catch (error) {
      console.error('Failed to toggle parental controls:', error);
    }
  };

  const handleUpdateLimits = async () => {
    try {
      await updateSpendingLimits({
        daily: parseFloat(dailyLimit),
        weekly: parseFloat(weeklyLimit),
        monthly: parseFloat(monthlyLimit),
      });
    } catch (error) {
      console.error('Failed to update spending limits:', error);
    }
  };

  const handleAddAddress = async () => {
    try {
      if (!newAddress) {
        toast.error('Please enter an address');
        return;
      }
      await addAllowedAddress(newAddress);
      setNewAddress('');
    } catch (error) {
      console.error('Failed to add address:', error);
    }
  };

  const handleAddToken = async () => {
    try {
      if (!newToken) {
        toast.error('Please enter a token address');
        return;
      }
      await addAllowedToken(newToken);
      setNewToken('');
    } catch (error) {
      console.error('Failed to add token:', error);
    }
  };

  const handleAddDapp = async () => {
    try {
      if (!newDapp) {
        toast.error('Please enter a DApp URL');
        return;
      }
      await addAllowedDapp(newDapp);
      setNewDapp('');
    } catch (error) {
      console.error('Failed to add DApp:', error);
    }
  };

  const handleUpdateTimeRestrictions = async () => {
    try {
      await updateTimeRestrictions({
        startHour: parseInt(startHour),
        endHour: parseInt(endHour),
        daysAllowed: selectedDays,
      });
    } catch (error) {
      console.error('Failed to update time restrictions:', error);
    }
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-white">Parental Controls</h2>

      {/* Enable/Disable Controls */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="px-4 py-2 rounded bg-gray-700 text-white"
          />
          <button
            onClick={handleToggleControls}
            className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            {isEnabled ? 'Disable' : 'Enable'} Controls
          </button>
        </div>
      </div>

      {isEnabled && (
        <>
          {/* Spending Limits */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-white">Spending Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Daily Limit</label>
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Weekly Limit</label>
                <input
                  type="number"
                  value={weeklyLimit}
                  onChange={(e) => setWeeklyLimit(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Monthly Limit</label>
                <input
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-gray-700 text-white"
                />
              </div>
            </div>
            <button
              onClick={handleUpdateLimits}
              className="mt-4 px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Update Limits
            </button>
          </div>

          {/* Time Restrictions */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-white">Time Restrictions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Start Hour (0-23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">End Hour (0-23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-gray-700 text-white"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Allowed Days</label>
              <div className="flex gap-2">
                {days.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => handleDayToggle(index)}
                    className={`px-3 py-1 rounded ${
                      selectedDays.includes(index)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleUpdateTimeRestrictions}
              className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Update Time Restrictions
            </button>
          </div>

          {/* Allowed Addresses */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-white">Allowed Addresses</h3>
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Enter address"
                className="flex-1 px-4 py-2 rounded bg-gray-700 text-white"
              />
              <button
                onClick={handleAddAddress}
                className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {allowedAddresses.map((address) => (
                <div key={address} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                  <span className="text-white truncate">{address}</span>
                  <button
                    onClick={() => removeAllowedAddress(address)}
                    className="ml-2 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed Tokens */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-white">Allowed Tokens</h3>
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder="Enter token address"
                className="flex-1 px-4 py-2 rounded bg-gray-700 text-white"
              />
              <button
                onClick={handleAddToken}
                className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {allowedTokens.map((token) => (
                <div key={token} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                  <span className="text-white truncate">{token}</span>
                  <button
                    onClick={() => removeAllowedToken(token)}
                    className="ml-2 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed DApps */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-white">Allowed DApps</h3>
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={newDapp}
                onChange={(e) => setNewDapp(e.target.value)}
                placeholder="Enter DApp URL"
                className="flex-1 px-4 py-2 rounded bg-gray-700 text-white"
              />
              <button
                onClick={handleAddDapp}
                className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {allowedDapps.map((dapp) => (
                <div key={dapp} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                  <span className="text-white truncate">{dapp}</span>
                  <button
                    onClick={() => removeAllowedDapp(dapp)}
                    className="ml-2 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ParentalControlSettings; 