import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface SpendingLimit {
  daily: number;
  weekly: number;
  monthly: number;
}

interface ParentalControlState {
  isEnabled: boolean;
  spendingLimits: SpendingLimit;
  allowedAddresses: string[];
  allowedTokens: string[];
  allowedDapps: string[];
  timeRestrictions: {
    startHour: number;
    endHour: number;
    daysAllowed: number[];
  };
}

interface ParentalControlContextType extends ParentalControlState {
  enableParentalControls: (password: string) => Promise<void>;
  disableParentalControls: (password: string) => Promise<void>;
  updateSpendingLimits: (limits: SpendingLimit) => Promise<void>;
  addAllowedAddress: (address: string) => Promise<void>;
  removeAllowedAddress: (address: string) => Promise<void>;
  addAllowedToken: (tokenAddress: string) => Promise<void>;
  removeAllowedToken: (tokenAddress: string) => Promise<void>;
  addAllowedDapp: (dappUrl: string) => Promise<void>;
  removeAllowedDapp: (dappUrl: string) => Promise<void>;
  updateTimeRestrictions: (restrictions: { startHour: number; endHour: number; daysAllowed: number[] }) => Promise<void>;
  isTransactionAllowed: (to: string, value: number, tokenAddress?: string) => Promise<boolean>;
  isDappAllowed: (dappUrl: string) => Promise<boolean>;
  isWithinAllowedTime: () => boolean;
}

const defaultState: ParentalControlState = {
  isEnabled: false,
  spendingLimits: {
    daily: 0,
    weekly: 0,
    monthly: 0,
  },
  allowedAddresses: [],
  allowedTokens: [],
  allowedDapps: [],
  timeRestrictions: {
    startHour: 9,
    endHour: 21,
    daysAllowed: [1, 2, 3, 4, 5], // Monday to Friday
  },
};

const ParentalControlContext = createContext<ParentalControlContextType | undefined>(undefined);

export function useParentalControl() {
  const context = useContext(ParentalControlContext);
  if (!context) {
    throw new Error('useParentalControl must be used within a ParentalControlProvider');
  }
  return context;
}

interface ParentalControlProviderProps {
  children: React.ReactNode;
}

export function ParentalControlProvider({ children }: ParentalControlProviderProps) {
  const [state, setState] = useState<ParentalControlState>(defaultState);
  const [spendingHistory, setSpendingHistory] = useState<{ timestamp: number; amount: number }[]>([]);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('nija_parental_controls');
    if (savedState) {
      try {
        setState(JSON.parse(savedState));
      } catch (error) {
        console.error('Failed to load parental control state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nija_parental_controls', JSON.stringify(state));
  }, [state]);

  const enableParentalControls = async (password: string) => {
    try {
      // Hash the password and store it securely
      // In a real implementation, this would use a proper password hashing algorithm
      localStorage.setItem('nija_parental_password', btoa(password));
      setState(prev => ({ ...prev, isEnabled: true }));
      toast.success('Parental controls enabled');
    } catch (error) {
      console.error('Failed to enable parental controls:', error);
      toast.error('Failed to enable parental controls');
      throw error;
    }
  };

  const disableParentalControls = async (password: string) => {
    try {
      const storedPassword = localStorage.getItem('nija_parental_password');
      if (storedPassword !== btoa(password)) {
        throw new Error('Invalid password');
      }
      setState(prev => ({ ...prev, isEnabled: false }));
      toast.success('Parental controls disabled');
    } catch (error) {
      console.error('Failed to disable parental controls:', error);
      toast.error('Failed to disable parental controls');
      throw error;
    }
  };

  const updateSpendingLimits = async (limits: SpendingLimit) => {
    try {
      setState(prev => ({ ...prev, spendingLimits: limits }));
      toast.success('Spending limits updated');
    } catch (error) {
      console.error('Failed to update spending limits:', error);
      toast.error('Failed to update spending limits');
      throw error;
    }
  };

  const addAllowedAddress = async (address: string) => {
    try {
      setState(prev => ({
        ...prev,
        allowedAddresses: [...prev.allowedAddresses, address],
      }));
      toast.success('Address added to allowlist');
    } catch (error) {
      console.error('Failed to add allowed address:', error);
      toast.error('Failed to add allowed address');
      throw error;
    }
  };

  const removeAllowedAddress = async (address: string) => {
    try {
      setState(prev => ({
        ...prev,
        allowedAddresses: prev.allowedAddresses.filter(a => a !== address),
      }));
      toast.success('Address removed from allowlist');
    } catch (error) {
      console.error('Failed to remove allowed address:', error);
      toast.error('Failed to remove allowed address');
      throw error;
    }
  };

  const addAllowedToken = async (tokenAddress: string) => {
    try {
      setState(prev => ({
        ...prev,
        allowedTokens: [...prev.allowedTokens, tokenAddress],
      }));
      toast.success('Token added to allowlist');
    } catch (error) {
      console.error('Failed to add allowed token:', error);
      toast.error('Failed to add allowed token');
      throw error;
    }
  };

  const removeAllowedToken = async (tokenAddress: string) => {
    try {
      setState(prev => ({
        ...prev,
        allowedTokens: prev.allowedTokens.filter(t => t !== tokenAddress),
      }));
      toast.success('Token removed from allowlist');
    } catch (error) {
      console.error('Failed to remove allowed token:', error);
      toast.error('Failed to remove allowed token');
      throw error;
    }
  };

  const addAllowedDapp = async (dappUrl: string) => {
    try {
      setState(prev => ({
        ...prev,
        allowedDapps: [...prev.allowedDapps, dappUrl],
      }));
      toast.success('DApp added to allowlist');
    } catch (error) {
      console.error('Failed to add allowed DApp:', error);
      toast.error('Failed to add allowed DApp');
      throw error;
    }
  };

  const removeAllowedDapp = async (dappUrl: string) => {
    try {
      setState(prev => ({
        ...prev,
        allowedDapps: prev.allowedDapps.filter(d => d !== dappUrl),
      }));
      toast.success('DApp removed from allowlist');
    } catch (error) {
      console.error('Failed to remove allowed DApp:', error);
      toast.error('Failed to remove allowed DApp');
      throw error;
    }
  };

  const updateTimeRestrictions = async (restrictions: { startHour: number; endHour: number; daysAllowed: number[] }) => {
    try {
      setState(prev => ({
        ...prev,
        timeRestrictions: restrictions,
      }));
      toast.success('Time restrictions updated');
    } catch (error) {
      console.error('Failed to update time restrictions:', error);
      toast.error('Failed to update time restrictions');
      throw error;
    }
  };

  const isTransactionAllowed = async (to: string, value: number, tokenAddress?: string) => {
    if (!state.isEnabled) return true;

    // Check if the recipient address is allowed
    if (!state.allowedAddresses.includes(to)) {
      toast.error('Transaction blocked: Recipient address not allowed');
      return false;
    }

    // Check if the token is allowed (for token transfers)
    if (tokenAddress && !state.allowedTokens.includes(tokenAddress)) {
      toast.error('Transaction blocked: Token not allowed');
      return false;
    }

    // Check spending limits
    const now = Date.now();
    const dayStart = now - 24 * 60 * 60 * 1000;
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;
    const monthStart = now - 30 * 24 * 60 * 60 * 1000;

    const dailySpent = spendingHistory
      .filter(tx => tx.timestamp > dayStart)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const weeklySpent = spendingHistory
      .filter(tx => tx.timestamp > weekStart)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const monthlySpent = spendingHistory
      .filter(tx => tx.timestamp > monthStart)
      .reduce((sum, tx) => sum + tx.amount, 0);

    if (dailySpent + value > state.spendingLimits.daily) {
      toast.error('Transaction blocked: Daily spending limit exceeded');
      return false;
    }

    if (weeklySpent + value > state.spendingLimits.weekly) {
      toast.error('Transaction blocked: Weekly spending limit exceeded');
      return false;
    }

    if (monthlySpent + value > state.spendingLimits.monthly) {
      toast.error('Transaction blocked: Monthly spending limit exceeded');
      return false;
    }

    // Check time restrictions
    if (!isWithinAllowedTime()) {
      toast.error('Transaction blocked: Outside allowed hours');
      return false;
    }

    // Update spending history if all checks pass
    setSpendingHistory(prev => [...prev, { timestamp: now, amount: value }]);
    return true;
  };

  const isDappAllowed = async (dappUrl: string) => {
    if (!state.isEnabled) return true;
    return state.allowedDapps.includes(dappUrl);
  };

  const isWithinAllowedTime = () => {
    if (!state.isEnabled) return true;

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    return (
      currentHour >= state.timeRestrictions.startHour &&
      currentHour < state.timeRestrictions.endHour &&
      state.timeRestrictions.daysAllowed.includes(currentDay)
    );
  };

  const value = {
    ...state,
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
    isTransactionAllowed,
    isDappAllowed,
    isWithinAllowedTime,
  };

  return (
    <ParentalControlContext.Provider value={value}>
      {children}
    </ParentalControlContext.Provider>
  );
} 