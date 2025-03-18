import React, { useState } from 'react';
import Input from '../UI/Input';
import Button from '../UI/Button';

interface ParentalControlSettings {
  enabled: boolean;
  dailyLimit: number;
  allowedAddresses: string[];
  allowedDApps: string[];
  timeRestrictions: {
    start: string;
    end: string;
  };
}

interface ParentalControlPanelProps {
  onClose: () => void;
  onSave: (settings: ParentalControlSettings) => void;
}

const ParentalControlPanel: React.FC<ParentalControlPanelProps> = ({ onClose, onSave }) => {
  const [settings, setSettings] = useState<ParentalControlSettings>({
    enabled: true,
    dailyLimit: 0.1,
    allowedAddresses: [],
    allowedDApps: [],
    timeRestrictions: {
      start: '09:00',
      end: '17:00'
    }
  });

  const [newAddress, setNewAddress] = useState('');
  const [newDApp, setNewDApp] = useState('');

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const addAddress = () => {
    if (newAddress && !settings.allowedAddresses.includes(newAddress)) {
      setSettings(prev => ({
        ...prev,
        allowedAddresses: [...prev.allowedAddresses, newAddress]
      }));
      setNewAddress('');
    }
  };

  const addDApp = () => {
    if (newDApp && !settings.allowedDApps.includes(newDApp)) {
      setSettings(prev => ({
        ...prev,
        allowedDApps: [...prev.allowedDApps, newDApp]
      }));
      setNewDApp('');
    }
  };

  const removeAddress = (address: string) => {
    setSettings(prev => ({
      ...prev,
      allowedAddresses: prev.allowedAddresses.filter(a => a !== address)
    }));
  };

  const removeDApp = (dapp: string) => {
    setSettings(prev => ({
      ...prev,
      allowedDApps: prev.allowedDApps.filter(d => d !== dapp)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 border border-purple-500/50 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
        <h2 className="text-2xl font-bold text-white mb-6">Parental Control Settings</h2>

        <div className="space-y-6">
          <div>
            <label className="text-white mb-2 block">Daily Transaction Limit (ETH)</label>
            <Input
              type="number"
              value={settings.dailyLimit.toString()}
              onChange={(e) => setSettings(prev => ({ ...prev, dailyLimit: parseFloat(e.target.value) || 0 }))}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="text-white mb-2 block">Time Restrictions</label>
            <div className="flex gap-4">
              <Input
                type="time"
                value={settings.timeRestrictions.start}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  timeRestrictions: { ...prev.timeRestrictions, start: e.target.value }
                }))}
              />
              <span className="text-white self-center">to</span>
              <Input
                type="time"
                value={settings.timeRestrictions.end}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  timeRestrictions: { ...prev.timeRestrictions, end: e.target.value }
                }))}
              />
            </div>
          </div>

          <div>
            <label className="text-white mb-2 block">Allowed Addresses</label>
            <div className="flex gap-2 mb-2">
              <Input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Enter Ethereum address"
              />
              <Button onClick={addAddress}>Add</Button>
            </div>
            <div className="space-y-2">
              {settings.allowedAddresses.map(address => (
                <div key={address} className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                  <span className="text-white font-mono text-sm">{address}</span>
                  <button
                    onClick={() => removeAddress(address)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-white mb-2 block">Allowed DApps</label>
            <div className="flex gap-2 mb-2">
              <Input
                type="text"
                value={newDApp}
                onChange={(e) => setNewDApp(e.target.value)}
                placeholder="Enter DApp URL"
              />
              <Button onClick={addDApp}>Add</Button>
            </div>
            <div className="space-y-2">
              {settings.allowedDApps.map(dapp => (
                <div key={dapp} className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                  <span className="text-white font-mono text-sm">{dapp}</span>
                  <button
                    onClick={() => removeDApp(dapp)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button variant="web3outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ParentalControlPanel;