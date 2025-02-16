import React, { useCallback, useEffect, useState } from 'react';
import { useParental, ParentalControlSettings } from '../../contexts/ParentalContext';
import ParentalControlForm from './ParentalControlForm';
import { Button } from '../../components/UI';
import { toast } from 'react-toastify';

interface ParentalControlPanelProps {
  onSave: (settings: ParentalControlSettings) => void;
  onClose?: () => void;
}

const ParentalControlPanel: React.FC<ParentalControlPanelProps> = ({ onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<ParentalControlSettings>({ 
    enabled: false,
    dailyLimit: 0,
    allowedAddresses: [],
    allowedDApps: [],
    timeRestrictions: { start: '09:00', end: '17:00' }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { settings, updateSettings } = useParental();

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const validateInputs = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!localSettings.dailyLimit || localSettings.dailyLimit <= 0) {
      errors.dailyLimit = 'Daily limit must be a positive number';
    }

    const start = new Date(`1970-01-01T${localSettings.timeRestrictions.start}`);
    const end = new Date(`1970-01-01T${localSettings.timeRestrictions.end}`);
    if (start >= end) {
      errors.timeRestrictions = 'Start time must be before end time';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [localSettings]);

  const handleSave = useCallback(async () => {
    if (!localSettings) return;

    const isValid = validateInputs();
    if (!isValid) return;

    try {
      setIsSaving(true);
      await updateSettings(localSettings);
      onSave(localSettings);
      toast.success('Settings saved');
      if (onClose) {
        onClose();
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [localSettings, updateSettings, onSave, onClose, validateInputs]);

  const handleCancel = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 bg-opacity-90 rounded-lg p-6 max-w-2xl w-full mx-4 border border-white/10 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl text-purple-300 font-semibold">Parental Control Configuration</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        <ParentalControlForm
          settings={localSettings}
          setSettings={setLocalSettings}
          validationErrors={validationErrors}
        />

        <div className="mt-6 space-y-4">
          {Object.values(validationErrors).length > 0 && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
              {Object.values(validationErrors).map((error, index) => (
                <p key={index} className="text-red-400 text-sm">
                  {error}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button
              onClick={handleCancel}
              variant="web3outline"
              className="px-6"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || Object.keys(validationErrors).length > 0}
              onClick={handleSave}
              variant="web3"
              className="px-6"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  Saving...
                </span>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentalControlPanel;