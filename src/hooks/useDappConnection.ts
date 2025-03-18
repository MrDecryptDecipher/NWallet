import { useState } from 'react';
import { useParentalControl } from '../contexts/ParentalControlContext';
import { toast } from 'react-toastify';

interface DappConnectionParams {
  url: string;
  name: string;
  icon?: string;
}

export function useDappConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { isDappAllowed } = useParentalControl();

  const connectToDapp = async ({ url, name, icon }: DappConnectionParams) => {
    try {
      setIsConnecting(true);

      // Check if the DApp is allowed by parental controls
      const isAllowed = await isDappAllowed(url);
      if (!isAllowed) {
        throw new Error('DApp access blocked by parental controls');
      }

      // Proceed with DApp connection if allowed
      // ... DApp connection code ...

      // Store the connection in local storage for persistence
      const connectedDapps = JSON.parse(localStorage.getItem('nija_connected_dapps') || '[]');
      connectedDapps.push({ url, name, icon, timestamp: Date.now() });
      localStorage.setItem('nija_connected_dapps', JSON.stringify(connectedDapps));

      toast.success(`Connected to ${name}`);
    } catch (error) {
      console.error('DApp connection failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect to DApp');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromDapp = async (url: string) => {
    try {
      // Remove the DApp from connected list
      const connectedDapps = JSON.parse(localStorage.getItem('nija_connected_dapps') || '[]');
      const updatedDapps = connectedDapps.filter((dapp: { url: string }) => dapp.url !== url);
      localStorage.setItem('nija_connected_dapps', JSON.stringify(updatedDapps));

      toast.success('Disconnected from DApp');
    } catch (error) {
      console.error('DApp disconnection failed:', error);
      toast.error('Failed to disconnect from DApp');
      throw error;
    }
  };

  const getConnectedDapps = () => {
    try {
      return JSON.parse(localStorage.getItem('nija_connected_dapps') || '[]');
    } catch (error) {
      console.error('Failed to get connected DApps:', error);
      return [];
    }
  };

  return {
    connectToDapp,
    disconnectFromDapp,
    getConnectedDapps,
    isConnecting,
  };
} 