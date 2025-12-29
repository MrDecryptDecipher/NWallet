import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import { apiClient } from '../utils/api';

export interface ParentalControlSettings {
  enabled: boolean;
  dailyLimit: number;
  allowedAddresses: string[];
  allowedDApps: string[];
  timeRestrictions: {
    start: string;
    end: string;
  };
  zkModeEnabled: boolean;
}

interface ParentalContextType {
  settings: ParentalControlSettings;
  updateSettings: (settings: Partial<ParentalControlSettings>) => Promise<void>;
  checkTransaction: (amount: number, recipient: string) => { allowed: boolean; reason?: string };
}

const ParentalContext = createContext<ParentalContextType | undefined>(undefined);

const defaultSettings: ParentalControlSettings = {
  enabled: true, // Default to true for safety if not fetched
  dailyLimit: 0,
  allowedAddresses: [],
  allowedDApps: [],
  timeRestrictions: {
    start: '09:00',
    end: '17:00',
  },
  zkModeEnabled: false
};

export function ParentalProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<ParentalControlSettings>(defaultSettings);

  // Load settings from API on mount/login, with localStorage fallback
  useEffect(() => {
    const fetchSettings = async () => {
      // Try to load cached settings first for immediate enforcement
      try {
        const cached = localStorage.getItem('nija_parental_cache');
        if (cached) setSettings(JSON.parse(cached));
      } catch (e) { /* ignore */ }

      if (!token || !isAuthenticated) return;

      try {
        const data = await apiClient('/api/settings', { token });

        if (data) {
          let addresses = [];
          try {
            addresses = typeof data.allowedAddresses === 'string'
              ? JSON.parse(data.allowedAddresses)
              : (data.allowedAddresses || []);
          } catch (e) { addresses = []; }

          const newSettings = {
            enabled: true,
            dailyLimit: data.dailyLimit || 0,
            allowedAddresses: addresses,
            allowedDApps: [],
            timeRestrictions: { start: "09:00", end: "17:00" },
            zkModeEnabled: data.zkModeEnabled || false
          };

          setSettings(newSettings);
          localStorage.setItem('nija_parental_cache', JSON.stringify(newSettings));
        }
      } catch (error) {
        console.error("Failed to fetch parental settings, using cache", error);
      }
    };
    fetchSettings();
  }, [token, isAuthenticated]);

  const updateSettings = async (newSettings: Partial<ParentalControlSettings>) => {
    if (!token) return;

    try {
      const payload = {
        dailyLimit: newSettings.dailyLimit,
        allowedAddresses: newSettings.allowedAddresses,
        zkModeEnabled: newSettings.zkModeEnabled
      };

      await apiClient('/api/settings', {
        token,
        data: payload
      });

      setSettings(prev => ({ ...prev, ...newSettings }));
      toast.success("Settings updated");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to save settings");
    }
  };

  const checkTransaction = (amount: number, recipient: string): { allowed: boolean; reason?: string } => {
    // If daily limit is 0, assume no limit? Or Block all?
    // Let's assume 0 means block all for safety, unless allow list is present.
    // Actually, usually 0 daily limit means "unlimited" or "no limit set" OR "strictly 0".
    // Let's treat it as: if dailyLimit > 0, check it.

    if (settings.dailyLimit > 0 && amount > settings.dailyLimit) {
      return { allowed: false, reason: `Exceeds daily limit of ${settings.dailyLimit}` };
    }

    // Allowed Addresses Logic: If list is not empty, MUST be in list
    if (settings.allowedAddresses.length > 0) {
      if (!settings.allowedAddresses.includes(recipient)) {
        return { allowed: false, reason: 'Recipient not in allowed addresses' };
      }
    }

    return { allowed: true };
  };

  return (
    <ParentalContext.Provider value={{ settings, updateSettings, checkTransaction }}>
      {children}
    </ParentalContext.Provider>
  );
}

export function useParental() {
  const context = useContext(ParentalContext);
  if (context === undefined) {
    throw new Error('useParental must be used within a ParentalProvider');
  }
  return context;
}