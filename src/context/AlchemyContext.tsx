import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createAlchemySmartAccountClient } from "@alchemy/aa-alchemy";
import { sepolia } from "@alchemy/aa-core";
import { mnemonicToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";

interface AlchemyContextType {
  client: any | null;
  address: string | null;
  isLoading: boolean;
  isConnected: boolean;
  disconnect: () => void;
}

const AlchemyContext = createContext<AlchemyContextType>({
  client: null,
  address: null,
  isLoading: false,
  isConnected: false,
  disconnect: () => { }
});

export const useAlchemy = () => useContext(AlchemyContext);

export const AlchemyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [client, setClient] = useState<any>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initAlchemy = async () => {
      if (!user || !user.mnemonic) {
        setClient(null);
        setAddress(null);
        return;
      }

      setIsLoading(true);
      try {
        console.log("Alchemy: Initializing Smart Account...");

        // 1. Create Signer (Owner) from Mnemonic
        const ownerAccount = mnemonicToAccount(user.mnemonic);

        // 2. Create Alchemy Smart Account Client
        // Using Light Account by default
        const chain = sepolia;
        const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || "demo";
        if (apiKey === "demo") console.warn("Alchemy: Using DEMO key. Transactions may fail.");

        const gasPolicyId = import.meta.env.VITE_GAS_POLICY_ID;
        const config: any = {
          apiKey,
          chain,
          account: ownerAccount,
        };

        if (gasPolicyId) {
          console.log("Alchemy: Gas Sponsorship Enabled");
          config.gasManagerConfig = {
            policyId: gasPolicyId,
          };
        }

        const smartAccountClient = await createAlchemySmartAccountClient(config);

        const scaAddress = smartAccountClient.account?.address;

        if (!scaAddress) {
          throw new Error("Account not initialized correctly");
        }

        console.log("Alchemy: Smart Account Created:", scaAddress);

        setClient(smartAccountClient);
        setAddress(scaAddress);

      } catch (error) {
        console.error("Alchemy Init Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAlchemy();
  }, [user?.mnemonic]);

  const disconnect = () => {
    setClient(null);
    setAddress(null);
  };

  return (
    <AlchemyContext.Provider value={{
      client,
      address,
      isLoading,
      isConnected: !!address,
      disconnect
    }}>
      {children}
    </AlchemyContext.Provider>
  );
};
