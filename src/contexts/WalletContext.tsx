import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAlchemy } from '../context/AlchemyContext';
import { useSolana } from '../context/SolanaContext';

// V2 Implementation: Aggregator Context
// Adapts the new Auth/Alchemy/Solana contexts to the legacy WalletContext interface
// used by the UI components (NijaWallet.tsx).

interface WalletState {
  isConnected: boolean;
  ethAddress: string | null;
  solAddress: string | null;
  balance: number;
}

interface WalletContextType extends WalletState {
  connect: (type: 'metamask' | 'phantom') => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Upstream Contexts
  const { address: alcAddress, isConnected: alcConnected, disconnect: alcDisconnect } = useAlchemy();
  const { solAddress: solAddr, solBalance } = useSolana();

  const [state, setState] = useState<WalletState>({
    isConnected: false,
    ethAddress: null,
    solAddress: null,
    balance: 0,
  });

  // Sync state from upstreams
  useEffect(() => {
    const eth = alcAddress;
    const sol = solAddr;
    const connected = !!eth || !!sol;

    setState(prev => ({
      ...prev,
      isConnected: connected,
      ethAddress: eth,
      solAddress: sol,
      // Legacy Adapter: Prioritize Solana Balance if available, as ETH balance is not yet globally context-synced
      balance: parseFloat(solBalance || "0")
    }));
  }, [alcAddress, solAddr, solBalance]);

  const connect = async (type: 'metamask' | 'phantom') => {
    // In V2, connection is handled by Login/Auth.
    // This function is kept for compatibility but is mostly a no-op 
    // or could redirect to login if not connected.
    console.log("Connect requested for", type, "- handled via AuthContext");
  };

  const disconnect = () => {
    if (alcDisconnect) alcDisconnect();
    // Solana doesn't have explicit disconnect in context yet but keypair is derived from auth.
    // AuthContext logout handles valid disconnects.
  };

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};
