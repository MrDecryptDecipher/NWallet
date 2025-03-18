import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useParental } from '../contexts/ParentalContext';
import { NFTGEN_URL } from '../config/web3';

export interface NFTGenActivity {
  type: string;
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  details: {
    name: string;
    asset: {
      imageUrl: string;
      metadataUrl: string;
    };
    fractions: number;
    royaltyFee: number;
  };
}

/**
 * Hook to manage NFTGen integration with Nija Wallet
 * Handles activity synchronization between the two applications
 */
export const useNFTGenIntegration = () => {
  const { settings, isTransactionAllowed, isDAppAllowed } = useParental();
  const [activities, setActivities] = useState<NFTGenActivity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Check for auto-connection on mount
  useEffect(() => {
    const checkConnection = () => {
      const connectionInfo = localStorage.getItem('nija_wallet_connection');
      if (connectionInfo) {
        try {
          const info = JSON.parse(connectionInfo);
          if (info.connected) {
            setIsConnected(true);
            console.log('NFTGen auto-connection detected');
          }
        } catch (error) {
          console.error('Error parsing connection info:', error);
        }
      }
    };

    checkConnection();

    // Listen for connection events
    const handleConnection = (event: CustomEvent) => {
      setIsConnected(true);
      console.log('NFTGen connected:', event.detail);
    };

    const handleDisconnection = () => {
      setIsConnected(false);
      console.log('NFTGen disconnected');
    };

    window.addEventListener('nija_wallet_connected', handleConnection as EventListener);
    window.addEventListener('nija_wallet_disconnected', handleDisconnection);

    return () => {
      window.removeEventListener('nija_wallet_connected', handleConnection as EventListener);
      window.removeEventListener('nija_wallet_disconnected', handleDisconnection);
    };
  }, []);

  // Load initial activities from localStorage
  useEffect(() => {
    try {
      // Check for the latest activity first
      const latestActivity = localStorage.getItem('nftgen_latest_activity');
      if (latestActivity) {
        const activity = JSON.parse(latestActivity);
        setActivities(prevActivities => {
          // Only add if not already in the list
          const exists = prevActivities.some(a => a.hash === activity.hash);
          if (!exists) {
            return [...prevActivities, activity];
          }
          return prevActivities;
        });
      }

      // Now check for individual transaction entries
      const allActivities: NFTGenActivity[] = [];
      
      // Scan localStorage for all NFTGen transactions
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nftgen_tx_')) {
          try {
            const storedActivity = localStorage.getItem(key);
            if (storedActivity) {
              const activity = JSON.parse(storedActivity);
              if (activity && activity.hash) {
                // Only add if not already in the list
                if (!allActivities.some(a => a.hash === activity.hash)) {
                  allActivities.push(activity);
                }
              }
            }
          } catch (error) {
            console.error('Error parsing stored activity:', error);
          }
        }
      }
      
      // Sort by timestamp (newest first) and update state if we found any
      if (allActivities.length > 0) {
        allActivities.sort((a, b) => b.timestamp - a.timestamp);
        setActivities(prevActivities => {
          // Merge with existing activities, avoiding duplicates
          const combined = [...prevActivities];
          allActivities.forEach(activity => {
            if (!combined.some(a => a.hash === activity.hash)) {
              combined.push(activity);
            }
          });
          return combined;
        });
      }
    } catch (error) {
      console.error('Error loading NFTGen activities:', error);
    }
  }, []);

  // Set up WebSocket connection to listen for activities
  useEffect(() => {
    // Helper function to determine WebSocket URL
    const getWebSocketUrl = () => {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `ws://${window.location.hostname}:5176/ws`;
      }
      if (window.location.hostname === '13.126.230.108' || /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname)) {
        return `ws://${window.location.hostname}:5176/ws`;
      }
      return 'ws://13.126.230.108:5176/ws';
    };

    // Create WebSocket connection
    const connectWebSocket = () => {
      try {
        const url = getWebSocketUrl();
        console.log(`Connecting to NFTGen WebSocket at ${url}`);
        
        const ws = new WebSocket(url);
        wsRef.current = ws;
        
        ws.onopen = () => {
          console.log('Connected to NFTGen WebSocket');
          setIsConnected(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received WebSocket message:', data);
            
            if (data.type === 'activity-update' && data.data) {
              const activity = data.data as NFTGenActivity;
              console.log('Processing NFTGen activity from WebSocket:', activity);
              
              // Save to localStorage
              try {
                localStorage.setItem(`nftgen_tx_${activity.hash}`, JSON.stringify(activity));
                localStorage.setItem('nftgen_latest_activity', JSON.stringify(activity));
              } catch (e) {
                console.error('Error saving activity to localStorage:', e);
              }
              
              // Update activities state
              setActivities(prevActivities => {
                // Check if this activity is already in our list
                const existingIndex = prevActivities.findIndex(a => a.hash === activity.hash);
                if (existingIndex >= 0) {
                  // Update existing activity
                  const updated = [...prevActivities];
                  updated[existingIndex] = activity;
                  return updated;
                } else {
                  // Add new activity
                  return [...prevActivities, activity];
                }
              });
              
              // Show notification
              toast.info(`New NFT Activity: ${activity.type} - ${activity.details.name}`);
              
              // Update last sync time
              setLastSyncTime(Date.now());
            } else if (data.type === 'welcome') {
              console.log('Received welcome message from WebSocket server');
            } else if (data.type === 'heartbeat-response') {
              console.log('Received heartbeat response from WebSocket server');
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('NFTGen WebSocket connection closed');
          setIsConnected(false);
          
          // Try to reconnect after a delay
          setTimeout(connectWebSocket, 5000);
        };
        
        ws.onerror = (error) => {
          console.error('NFTGen WebSocket error:', error);
          // The onclose handler will handle reconnection
        };
        
        // Set up heartbeat to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (ws.readyState === 1) { // 1 = OPEN
            try {
              ws.send(JSON.stringify({ 
                type: 'heartbeat', 
                timestamp: Date.now() 
              }));
            } catch (e) {
              console.warn('Error sending heartbeat:', e);
            }
          }
        }, 30000);
        
        return () => {
          clearInterval(heartbeatInterval);
          ws.close();
        };
      } catch (error) {
        console.error('Error setting up WebSocket connection:', error);
        setTimeout(connectWebSocket, 5000);
      }
    };
    
    const cleanup = connectWebSocket();
    
    return () => {
      if (cleanup) cleanup();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Function to update activity status
  const updateActivityStatus = useCallback((hash: string, status: 'pending' | 'confirmed' | 'failed') => {
    setActivities(prevActivities => {
      const index = prevActivities.findIndex(a => a.hash === hash);
      if (index >= 0) {
        const updated = [...prevActivities];
        updated[index] = { ...updated[index], status };
        
        // Also update in localStorage
        try {
          const storageKey = `nftgen_tx_${hash}`;
          const activityData = JSON.parse(localStorage.getItem(storageKey) || '');
          if (activityData) {
            activityData.status = status;
            localStorage.setItem(storageKey, JSON.stringify(activityData));
          }
        } catch (e) {
          console.error('Error updating activity in localStorage', e);
        }
        
        return updated;
      }
      return prevActivities;
    });
  }, []);

  // Function to manually add a new activity
  const addActivity = useCallback((activity: NFTGenActivity) => {
    if (!activity || !activity.hash) return;
    
    setActivities(prevActivities => {
      // Check if this activity is already in our list
      const exists = prevActivities.some(a => a.hash === activity.hash);
      if (exists) return prevActivities;
      
      // Add new activity
      return [...prevActivities, activity];
    });
    
    // Also save to localStorage
    try {
      const storageKey = `nftgen_tx_${activity.hash}`;
      localStorage.setItem(storageKey, JSON.stringify(activity));
      localStorage.setItem('nftgen_latest_activity', JSON.stringify(activity));
    } catch (e) {
      console.error('Error saving activity to localStorage', e);
    }
    
    setLastSyncTime(Date.now());
  }, []);

  return {
    activities,
    isConnected,
    lastSyncTime,
    updateActivityStatus,
    addActivity
  };
};

export default useNFTGenIntegration; 