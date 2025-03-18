import React from 'react';
import { useParentalControl } from '../../contexts/ParentalControlContext';

const ParentalControlStatus: React.FC = () => {
  const {
    isEnabled,
    spendingLimits,
    timeRestrictions,
    isWithinAllowedTime,
  } = useParentalControl();

  if (!isEnabled) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatTime = (hour: number) => {
    return new Date(2000, 0, 1, hour).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDayNames = (days: number[]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => dayNames[day]).join(', ');
  };

  const isCurrentlyAllowed = isWithinAllowedTime();

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">Parental Controls Active</h3>
        <span
          className={`px-2 py-1 rounded text-sm ${
            isCurrentlyAllowed
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {isCurrentlyAllowed ? 'Usage Allowed' : 'Usage Restricted'}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-300">
        <div>
          <span className="font-medium">Daily Limit:</span>{' '}
          {formatCurrency(spendingLimits.daily)}
        </div>
        <div>
          <span className="font-medium">Weekly Limit:</span>{' '}
          {formatCurrency(spendingLimits.weekly)}
        </div>
        <div>
          <span className="font-medium">Monthly Limit:</span>{' '}
          {formatCurrency(spendingLimits.monthly)}
        </div>
        <div>
          <span className="font-medium">Allowed Hours:</span>{' '}
          {formatTime(timeRestrictions.startHour)} - {formatTime(timeRestrictions.endHour)}
        </div>
        <div>
          <span className="font-medium">Allowed Days:</span>{' '}
          {getDayNames(timeRestrictions.daysAllowed)}
        </div>
      </div>
    </div>
  );
};

export default ParentalControlStatus; 