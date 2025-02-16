import React, { useCallback, useEffect, useState } from 'react';
import { ParentalControlSettings } from '../../contexts/ParentalContext';
import { ValidationResults } from '../../utils/validation';
import { Input, TextArea } from '../../components/UI';

interface ParentalControlFormProps {
  settings: ParentalControlSettings;
  setSettings: React.Dispatch<React.SetStateAction<ParentalControlSettings>>;
  validationErrors: ValidationResults;
}

const ParentalControlForm: React.FC<ParentalControlFormProps> = ({
  settings,
  setSettings,
  validationErrors
}) => {
  const [dailyLimit, setDailyLimit] = useState(settings.dailyLimit);
  const [allowedAddresses, setAllowedAddresses] = useState(settings.allowedAddresses);
  const [allowedDApps, setAllowedDApps] = useState(settings.allowedDApps);
  const [startTime, setStartTime] = useState(settings.timeRestrictions.start);
  const [endTime, setEndTime] = useState(settings.timeRestrictions.end);

  const updateSettings = useCallback(() => {
    setSettings({
      ...settings,
      dailyLimit,
      allowedAddresses,
      allowedDApps,
      timeRestrictions: { start: startTime, end: endTime }
    });
  }, [settings, dailyLimit, allowedAddresses, allowedDApps, startTime, endTime]);

  useEffect(() => {
    updateSettings();
  }, [updateSettings]);

  return (
    <form className="settings-form">
      {/* Daily Spending Limit */}
      <div className="form-group">
        <label className="form-label">
          Daily Spending Limit ($):
          <Input
            type="number"
            value={`${dailyLimit}`} // Convert number to string
            onChange={(e) => setDailyLimit(Number(e.target.value))}
            min="0"
            step="0.01"
            required
          />
        </label>
        {validationErrors.dailyLimit && (
          <p className="error-message">{validationErrors.dailyLimit}</p>
        )}
      </div>

      {/* Allowed Addresses */}
      <div className="form-group">
        <label className="form-label">
          Allowed Addresses:
          <TextArea
            value={allowedAddresses.join('\n')}
            onChange={(e) => setAllowedAddresses(e.target.value.split('\n').map(addr => addr.trim()))}
            placeholder="Enter addresses (one per line)"
          />
        </label>
        {validationErrors.allowedAddresses && (
          <p className="error-message">{validationErrors.allowedAddresses}</p>
        )}
      </div>

      {/* Allowed DApps */}
      <div className="form-group">
        <label className="form-label">
          Allowed DApps:
          <TextArea
            value={allowedDApps.join('\n')}
            onChange={(e) => setAllowedDApps(e.target.value.split('\n').map(dapp => dapp.trim()))}
            placeholder="Enter DApps (one per line)"
          />
        </label>
        {validationErrors.allowedDApps && (
          <p className="error-message">{validationErrors.allowedDApps}</p>
        )}
      </div>

      {/* Time Restrictions */}
      <div className="form-group">
        <label className="form-label">
          Transaction Time Window:
          <div className="time-picker">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <span className="time-label">to</span>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </label>
        {validationErrors.timeRestrictions && (
          <p className="error-message">{validationErrors.timeRestrictions}</p>
        )}
      </div>
    </form>
  );
};

export default ParentalControlForm;