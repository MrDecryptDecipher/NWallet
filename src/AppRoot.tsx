import React, { useEffect } from 'react';
import App from './App';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';
import { ParentalProvider } from './contexts/ParentalContext';
import { WalletProvider } from './contexts/WalletContext';
import { ToastContainer } from 'react-toastify';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';

// Declare the custom window interface
declare global {
  interface Window {
    ethereum?: {
      [key: string]: any;
      isNijaWallet?: boolean;
      name?: string;
      isMetaMask?: boolean;
      request?: (args: any) => Promise<any>;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
      selectedAddress?: string;
      chainId?: string;
    };
    emitEthereumEvent?: (eventName: string, ...args: any[]) => void;
  }
}

// Configure wagmi - outside of the component to avoid re-creation on render
const { chains, publicClient } = configureChains(
  [mainnet, sepolia],
  [publicProvider()]
);

const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient,
  chains
});

// Create Material-UI theme
const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1',
    },
    secondary: {
      main: '#ec4899',
    },
  },
});

const AppRoot: React.FC = () => {
  // Handle ethereum provider initialization
  useEffect(() => {
    injectNijaWalletProvider();
  }, []);

  // Safely inject Nija Wallet provider
  const injectNijaWalletProvider = () => {
    if (typeof window === 'undefined') return;

    try {
      // Create our provider properties
      const nijaWalletProps = {
        isNijaWallet: true,
        name: 'Nija Custodian Wallet',
        isMetaMask: false
      };

      // If ethereum doesn't exist, create it
      if (!window.ethereum) {
        window.ethereum = {
          ...nijaWalletProps,
          // Basic request implementation
          request: async (args: { method: string; params?: any[] }) => {
            console.log('Nija Wallet request:', args.method, args.params);
            
            if (args.method === 'eth_requestAccounts' || args.method === 'eth_accounts') {
              return localStorage.getItem('nija_eth_address') 
                ? [localStorage.getItem('nija_eth_address')] 
                : [];
            }
            
            if (args.method === 'eth_chainId') {
              return localStorage.getItem('nija_chain_id') || '0x1'; // Default to mainnet
            }
            
            console.warn('Method not implemented:', args.method);
            throw new Error(`Method ${args.method} not implemented`);
          },
          // Event handlers
          _events: new Map(),
          on: function(event: string, callback: (...args: any[]) => void) {
            if (!this._events.has(event)) {
              this._events.set(event, []);
            }
            this._events.get(event).push(callback);
          },
          removeListener: function(event: string, callback: (...args: any[]) => void) {
            if (this._events.has(event)) {
              const callbacks = this._events.get(event);
              const index = callbacks.indexOf(callback);
              if (index !== -1) {
                callbacks.splice(index, 1);
              }
            }
          },
          emit: function(event: string, ...args: any[]) {
            if (this._events.has(event)) {
              this._events.get(event).forEach((callback: any) => {
                callback(...args);
              });
            }
            window.dispatchEvent(new CustomEvent(event, { detail: args }));
          }
        };
        console.log('Created new ethereum provider with Nija Wallet identity');
      } else {
        // Ethereum exists, enhance it without redefining
        console.log('Enhancing existing ethereum provider with Nija Wallet identity');
        
        // Add properties safely
        if (!window.ethereum.isNijaWallet) {
          try {
            window.ethereum.isNijaWallet = true;
          } catch (e) {
            console.warn('Could not set isNijaWallet property:', e);
          }
        }
        
        if (!window.ethereum.name || window.ethereum.name !== 'Nija Custodian Wallet') {
          try {
            window.ethereum.name = 'Nija Custodian Wallet';
          } catch (e) {
            console.warn('Could not set name property:', e);
          }
        }
        
        // Add emit method if not available
        if (!window.ethereum.emit) {
          try {
            window.ethereum.emit = function(event: string, ...args: any[]) {
              window.dispatchEvent(new CustomEvent(event, { detail: args }));
            };
          } catch (e) {
            console.warn('Could not add emit method:', e);
          }
        }
      }
      
      // Expose a global method to emit ethereum events for testing
      window.emitEthereumEvent = (eventName: string, ...args: any[]) => {
        if (window.ethereum && typeof window.ethereum.emit === 'function') {
          window.ethereum.emit(eventName, ...args);
        } else {
          window.dispatchEvent(new CustomEvent(eventName, { detail: args }));
        }
      };
      
      console.log('Nija Wallet Provider injection completed');
    } catch (error) {
      console.error('Error injecting Nija Wallet provider:', error);
    }
  };

  return (
    /* 
     * Use a plain div without any context usage at the top level
     * Then nest all providers in the correct order
     */
    <div className="app-root">
      <WagmiConfig config={wagmiConfig}>
        <MuiThemeProvider theme={muiTheme}>
          <CustomThemeProvider>
            <WalletProvider>
              <ParentalProvider>
                <App />
                <ToastContainer position="top-right" autoClose={5000} />
              </ParentalProvider>
            </WalletProvider>
          </CustomThemeProvider>
        </MuiThemeProvider>
      </WagmiConfig>
    </div>
  );
};

export default AppRoot; 