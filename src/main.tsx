// src/main.tsx
// Add buffer polyfill
import 'buffer';
import { Buffer } from 'buffer';
import process from 'process';

// Ensure Buffer is available globally
globalThis.Buffer = Buffer;
globalThis.process = process;

// Define the Ethereum provider interface
interface EthereumProvider {
  isNijaWallet?: boolean;
  name?: string;
  isMetaMask?: boolean;
  request?: (args: any) => Promise<any>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
  [key: string]: any;
}

// Rather than extending the existing Window interface, create a unique interface
declare global {
  interface Window {
    nijaWalletProvider?: EthereumProvider;
    isNijaWallet?: boolean;
    nijaHeartbeatInterval?: NodeJS.Timeout;
  }
}

// Improved provider injection with better conflict handling
const initializeProvider = () => {
  try {
    // Create our base provider
    const nijaProvider = {
        isNijaWallet: true,
        name: 'Nija Custodian Wallet',
        isMetaMask: false,
      _events: new Map(),
      
      // Auto-connect to NFTGen
      _autoConnectNFTGen: () => {
        try {
          // Generate a deterministic address for the user's session
          const sessionId = localStorage.getItem('nija_session_id') || Math.random().toString(36).substring(2);
          localStorage.setItem('nija_session_id', sessionId);
          const defaultAddress = `0x${sessionId.padEnd(40, '0')}`;
          
          // Set connection data
          localStorage.setItem('nija_eth_address', defaultAddress);
          localStorage.setItem('nija_chain_id', '1'); // Default to mainnet
          localStorage.setItem('nija_wallet_connection_time', Date.now().toString());
          localStorage.setItem('nija_wallet_heartbeat', Date.now().toString());

          // Set NFTGen connection info
          const connectionInfo = {
            address: defaultAddress,
            chainId: 1,
            source: 'nija_custodian',
            connected: true,
            timestamp: Date.now()
          };
          localStorage.setItem('nija_wallet_connection', JSON.stringify(connectionInfo));

          // Setup heartbeat interval
          if (window.nijaHeartbeatInterval) {
            clearInterval(window.nijaHeartbeatInterval);
          }
          window.nijaHeartbeatInterval = setInterval(() => {
            localStorage.setItem('nija_wallet_heartbeat', Date.now().toString());
          }, 5000);

          // Dispatch connection event
          window.dispatchEvent(new CustomEvent('nija_wallet_connected', {
            detail: connectionInfo
          }));

          console.log('Auto-connected to NFTGen');
          return defaultAddress;
        } catch (error) {
          console.error('Error in auto-connecting to NFTGen:', error);
          return null;
        }
      },
      
      // Request handler with auto-connection
      request: async (args: any) => {
        console.log('Nija Wallet request:', args);
        
        // Handle basic requests
        if (args.method === 'eth_requestAccounts' || args.method === 'eth_accounts') {
          const storedAddress = localStorage.getItem('nija_eth_address');
          if (!storedAddress) {
            const address = nijaProvider._autoConnectNFTGen();
            return address ? [address] : [];
          }
          return storedAddress ? [storedAddress] : [];
        }
        
        if (args.method === 'eth_chainId') {
          return localStorage.getItem('nija_chain_id') || '0x1';
        }
        
        // For other methods, check if we should handle them
        if (args.method.startsWith('nija_') || args.method.startsWith('eth_')) {
          console.log('Handling method:', args.method);
          // Add implementation for other methods as needed
          return null;
        }
        
        throw new Error(`Method ${args.method} not implemented`);
      },
      
      // Event handling
      on: function(event: string, callback: (...args: any[]) => void) {
        if (!this._events.has(event)) {
          this._events.set(event, new Set());
        }
        this._events.get(event).add(callback);
        console.log(`Added listener for ${event}`);
      },
      
      removeListener: function(event: string, callback: (...args: any[]) => void) {
        if (this._events.has(event)) {
          this._events.get(event).delete(callback);
          console.log(`Removed listener for ${event}`);
        }
      },
      
      emit: function(event: string, ...args: any[]) {
        if (this._events.has(event)) {
          this._events.get(event).forEach((callback: any) => {
            try {
              callback(...args);
            } catch (error) {
              console.error(`Error in ${event} callback:`, error);
            }
          });
        }
        // Also dispatch as a DOM event
        window.dispatchEvent(new CustomEvent(`nija_${event}`, { detail: args }));
      }
    };

    // Auto-connect to NFTGen on initialization
    nijaProvider._autoConnectNFTGen();

      // Store our provider
    window.nijaWalletProvider = nijaProvider;
    window.ethereum = nijaProvider;

    console.log('Nija Wallet provider initialized successfully');
    return nijaProvider;
  } catch (error) {
    console.error('Error during provider setup:', error);
    throw error;
  }
};

// Initialize provider
initializeProvider();

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';

// Import the AppRoot component which will handle all providers
import AppRoot from './AppRoot';

// Create a root element with error handling
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found!');
} else {
  try {
    // First render a basic container
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <div className="app-background" id="theme-background"></div>
        <AppRoot />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Error rendering React application:', error);
    
    // Fallback rendering without providers if there's an error
    try {
      ReactDOM.createRoot(rootElement).render(
        <div className="error-container p-4 bg-red-100 text-red-700 min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Application Error</h1>
          <p>There was an error initializing the application. Please try refreshing the page.</p>
          <p className="mt-2 text-sm text-red-500">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh Page
          </button>
        </div>
      );
    } catch (fallbackError) {
      console.error('Error rendering fallback UI:', fallbackError);
    }
  }
}