import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { deriveSolanaKeypair, getSolanaBalance, sendSolanaTransfer } from '../utils/solanaUtils';
import { Keypair } from '@solana/web3.js';
import { toast } from 'react-toastify';

interface SolanaContextType {
    keypair: Keypair | null;
    solAddress: string | null;
    solBalance: string;
    isLoading: boolean;
    refreshBalance: () => Promise<void>;
    sendTransaction: (recipient: string, amount: string) => Promise<string>;
}

const SolanaContext = createContext<SolanaContextType>({
    keypair: null,
    solAddress: null,
    solBalance: "0.00",
    isLoading: false,
    refreshBalance: async () => { },
    sendTransaction: async () => "",
});

export const useSolana = () => useContext(SolanaContext);

export const SolanaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [keypair, setKeypair] = useState<Keypair | null>(null);
    const [solAddress, setSolAddress] = useState<string | null>(null);
    const [solBalance, setSolBalance] = useState("0.00");
    const [isLoading, setIsLoading] = useState(false);

    // 1. Initialize Solana Wallet from Mnemonic
    useEffect(() => {
        const initSolana = async () => {
            if (!user || !user.mnemonic) {
                setKeypair(null);
                setSolAddress(null);
                return;
            }

            try {
                const kp = await deriveSolanaKeypair(user.mnemonic);
                setKeypair(kp);
                setSolAddress(kp.publicKey.toString());
                console.log("Solana: Wallet Initialized", kp.publicKey.toString());

                // Fetch initial balance
                await fetchBalance(kp.publicKey.toString());
            } catch (error) {
                console.error("Solana Init Failed:", error);
            }
        };
        initSolana();
    }, [user]);

    const fetchBalance = async (addr: string) => {
        const bal = await getSolanaBalance(addr);
        setSolBalance(bal);
    };

    const refreshBalance = async () => {
        if (solAddress) {
            setIsLoading(true);
            await fetchBalance(solAddress);
            setIsLoading(false);
        }
    };

    const sendTransaction = async (recipient: string, amount: string): Promise<string> => {
        if (!keypair) throw new Error("Solana wallet not initialized");

        const signature = await sendSolanaTransfer(keypair, recipient, amount);
        toast.success(`Solana Transfer Sent! Sig: ${signature.slice(0, 8)}...`);
        setTimeout(refreshBalance, 2000); // Wait for confirmation then refresh
        return signature;
    };

    return (
        <SolanaContext.Provider value={{
            keypair,
            solAddress,
            solBalance,
            isLoading,
            refreshBalance,
            sendTransaction
        }}>
            {children}
        </SolanaContext.Provider>
    );
};
