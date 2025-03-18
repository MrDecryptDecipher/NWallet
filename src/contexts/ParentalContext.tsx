import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ParentalControlSettings {
  enabled: boolean;
  dailyLimit: number;
  allowedAddresses: string[];
  allowedDApps: string[];
  timeRestrictions: {
    start: string;
    end: string;
  };
}

interface ParentalContextType {
  settings: ParentalControlSettings;
  updateSettings: (settings: Partial<ParentalControlSettings>) => void;
  checkTransaction: (amount: number, recipient: string) => { allowed: boolean; reason?: string };
}

const ParentalContext = createContext<ParentalContextType | undefined>(undefined);

const defaultSettings: ParentalControlSettings = {
  enabled: false,
  dailyLimit: 0,
  allowedAddresses: [],
  allowedDApps: [],
  timeRestrictions: {
    start: '09:00',
    end: '17:00',
  },
};

export function ParentalProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ParentalControlSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('nija_parental_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.warn('Error loading parental settings:', error);
    }
  }, []);

  const updateSettings = (newSettings: Partial<ParentalControlSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      // Save to localStorage
      try {
        localStorage.setItem('nija_parental_settings', JSON.stringify(updatedSettings));
      } catch (error) {
        console.warn('Error saving parental settings:', error);
      }
      return updatedSettings;
    });
  };

  const checkTransaction = (amount: number, recipient: string): { allowed: boolean; reason?: string } => {
    if (!settings.enabled) return { allowed: true };

    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] = settings.timeRestrictions.start.split(':').map(Number);
    const [endHour, endMinute] = settings.timeRestrictions.end.split(':').map(Number);

    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    if (currentTimeInMinutes < startTimeInMinutes || currentTimeInMinutes >= endTimeInMinutes) {
      return { allowed: false, reason: 'Outside allowed trading hours' };
    }

    if (amount > settings.dailyLimit) {
      return { allowed: false, reason: 'Amount exceeds daily limit' };
    }

    if (!settings.allowedAddresses.includes(recipient)) {
      return { allowed: false, reason: 'Recipient not in allowed addresses' };
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