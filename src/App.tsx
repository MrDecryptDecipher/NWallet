import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useTheme } from './contexts/ThemeContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Header from './components/Header/Header';
import { useParental } from './contexts/ParentalContext';
import NFTGenConnectModal from './components/NFTGen/NFTGenConnectModal';
import { useNFTGenIntegration, NFTGenActivity } from './hooks/useNFTGenIntegration';
import { useWallet } from './contexts/WalletContext';
import { ActivityCenter } from './components/ActivityCenter';
import { Debug } from './components/Debug';
import { NFTGEN_URL as NFTGenUrl } from './config/web3';
import 'react-toastify/dist/ReactToastify.css';
import NijaWallet from './pages/NijaWallet';
import { ErrorBoundary } from 'react-error-boundary';
import { connectWallet, disconnectWallet, getWalletState } from './walletConnection';
import { ThemeProvider, CssBaseline, Box, Container, Alert, AlertTitle, Paper, Snackbar } from '@mui/material';
import theme from './theme';

// Error fallback component
const ErrorFallback = ({ error }: { error: Error }) => (
  <Box sx={{ p: 3 }}>
    <Paper sx={{ p: 3 }}>
      <Alert severity="error">
        <AlertTitle>Something went wrong</AlertTitle>
        {error.message}
      </Alert>
    </Paper>
  </Box>
);

// AppState contains the application state that was previously derived from contexts
// Now we'll pass this state through normal props to prevent circular dependencies
const App: React.FC = () => {
  const [showParentalControl, setShowParentalControl] = useState(false);
  const [showNFTGenModal, setShowNFTGenModal] = useState(false);
  const [showActivityCenter, setShowActivityCenter] = useState(false);
  const [activities, setActivities] = useState<NFTGenActivity[]>([]);
  const [isNFTGenConnected, setIsNFTGenConnected] = useState(false);
  const [ethAddress, setEthAddress] = useState<string | undefined>(undefined);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [provider, setProvider] = useState<any>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [walletState, setWalletState] = useState(getWalletState());
  const [networkError, setNetworkError] = useState<string | null>(null);
  
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // Initialize NFTGen integration safely
  useEffect(() => {
    try {
      // Check localStorage for NFTGen activities
      const storedActivities = localStorage.getItem('nija_nftgen_activities');
      if (storedActivities) {
        setActivities(JSON.parse(storedActivities));
      }
      
      // Check if connected to NFTGen
      const connectionTime = localStorage.getItem('nija_wallet_connection_time');
      setIsNFTGenConnected(!!connectionTime);
      
      // Get the ethereum address if available
      const address = localStorage.getItem('nija_eth_address');
      if (address) {
        setEthAddress(address);
      }
      
      // Handle when accounts change
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setEthAddress(undefined);
          setIsWalletConnected(false);
        } else {
          // User changed account
          setEthAddress(accounts[0] as `0x${string}`);
          setIsWalletConnected(true);
        }
      };
      
      if (window.ethereum) {
        const ethereum = window.ethereum as any;
        ethereum.on('accountsChanged', handleAccountsChanged);
        
        // Initial check for accounts
        ethereum.request({ method: 'eth_accounts' })
          .then(handleAccountsChanged)
          .catch(console.error);
      }
      
      return () => {
        if (window.ethereum) {
          const ethereum = window.ethereum as any;
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    } catch (error) {
      console.error("Error setting up Ethereum event listeners:", error);
    }
  }, []);
  
  useEffect(() => {
    const handleWalletConnected = (event: CustomEvent) => {
      setWalletState(event.detail);
      setIsConnecting(false);
      setError(null);
    };

    const handleWalletDisconnected = () => {
      setWalletState(getWalletState());
      setIsConnecting(false);
      setError(null);
    };

    const handleChainChanged = (event: CustomEvent) => {
      setWalletState(prev => ({ ...prev, chainId: event.detail.chainId }));
      setNetworkError(null);
    };

    const handleNetworkError = (event: CustomEvent) => {
      setNetworkError(event.detail.message);
    };

    window.addEventListener('walletConnected', handleWalletConnected as EventListener);
    window.addEventListener('walletDisconnected', handleWalletDisconnected);
    window.addEventListener('chainChanged', handleChainChanged as EventListener);
    window.addEventListener('networkError', handleNetworkError as EventListener);

    return () => {
      window.removeEventListener('walletConnected', handleWalletConnected as EventListener);
      window.removeEventListener('walletDisconnected', handleWalletDisconnected);
      window.removeEventListener('chainChanged', handleChainChanged as EventListener);
      window.removeEventListener('networkError', handleNetworkError as EventListener);
    };
  }, []);
  
  // Handle NFTGen connection
  const handleNFTGenClick = () => {
    if (!ethAddress) {
      // If no wallet is connected, show a notification
      console.warn('No wallet connected');
      return;
    }
    
    // Show confirmation modal
    setShowNFTGenModal(true);
  };
  
  // Constants
  // const NFTGEN_URL = "http://13.126.230.108:5175"; // Direct IP address from NFTGen's config

  // Confirm NFTGen connection
  const confirmNFTGenConnection = () => {
    setShowNFTGenModal(false);
    if (ethAddress) {
      // Save connection data in localStorage for NFTGen to access
      localStorage.setItem('nija_eth_address', ethAddress);
      localStorage.setItem('nija_chain_id', '1'); // Default to mainnet
      localStorage.setItem('nija_wallet_connection_time', Date.now().toString());
      localStorage.setItem('nija_wallet_heartbeat', Date.now().toString());

      // NFTGen looks for these specific properties in its debug panel
      const connectionInfo = {
        address: ethAddress,
        chainId: 1,
        source: 'nija_custodian', 
        connected: true,
        timestamp: Date.now()
      };
      
      localStorage.setItem('nija_wallet_connection', JSON.stringify(connectionInfo));
      setIsNFTGenConnected(true);
      
      // Setup heartbeat interval - NFTGen expects this to be updated regularly
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
      
      // Open NFTGen in a new tab with connection parameter
      const nftgenUrl = new URL(NFTGenUrl);
      nftgenUrl.searchParams.set('from', 'nija_wallet');
      window.open(nftgenUrl.toString(), '_blank');
    }
  };
  
  // Toggle parental control
  const toggleParentalControl = () => {
    setShowParentalControl(prev => !prev);
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await connectWallet();
    } catch (err) {
      setError(err as Error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (err) {
      setError(err as Error);
    }
  };

  const handleCloseNetworkError = () => {
    setNetworkError(null);
  };

  // Initialize wallet and NFTGen connection
  useEffect(() => {
    const initWallet = async () => {
      try {
        // Check for auto-connection data
        const connectionInfo = localStorage.getItem('nija_wallet_connection');
        if (connectionInfo) {
          try {
            const info = JSON.parse(connectionInfo);
            setProvider(window.ethereum);
            setAddress(info.address);
            setChainId(info.chainId.toString(16));
          } catch (error) {
            console.error("Error parsing connection info:", error);
          }
        }
      } catch (error) {
        console.error("Error initializing wallet:", error);
        setError(error as Error);
      }
    };

    initWallet();
  }, []);

  return (
    <Router>
      <div className={`app-container ${isDarkMode ? 'dark' : 'light'}`}>
        <Header 
          isWalletConnected={Boolean(walletState.address)}
          ethAddress={walletState.address || ''}
          onToggleParentalControl={toggleParentalControl}
          showParentalControl={showParentalControl}
        />
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/nijawallet" element={<NijaWallet />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        
        {/* Modals and overlays */}
        {showNFTGenModal && (
          <NFTGenConnectModal
            onConfirm={confirmNFTGenConnection}
            onCancel={() => setShowNFTGenModal(false)}
          />
        )}
        
        {showActivityCenter && (
          <ActivityCenter
            activities={activities}
            onClose={() => setShowActivityCenter(false)}
          />
        )}
        
        {/* Network error snackbar */}
        <Snackbar
          open={!!networkError}
          autoHideDuration={6000}
          onClose={handleCloseNetworkError}
        >
          <Alert onClose={handleCloseNetworkError} severity="error">
            {networkError}
          </Alert>
        </Snackbar>
        
        <ToastContainer position="top-right" />
      </div>
    </Router>
  );
};

export default App;