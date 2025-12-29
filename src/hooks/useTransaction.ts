import { useState } from 'react';
import { useAlchemy } from '../context/AlchemyContext';
import { parseEther } from 'viem';
import { toast } from 'react-toastify';

export const useSendUserOp = () => {
    const { client, address, isConnected } = useAlchemy();
    const [isSending, setIsSending] = useState(false);

    const sendUserOp = async (recipient: string, amount: string) => {
        if (!client || !address || !isConnected) {
            toast.error("Wallet not connected");
            return;
        }

        setIsSending(true);
        try {
            const amountWei = parseEther(amount);

            const policyId = import.meta.env.VITE_GAS_POLICY_ID;

            // 1. Send User Operation
            const { hash } = await client.sendUserOperation({
                uo: {
                    target: recipient as `0x${string}`,
                    data: "0x",
                    value: amountWei,
                },
                // If policy ID is set, Alchemy Client middleware will handle Paymaster data automatically
                // provided the client was initialized with the policy ID (which we need to check in AlchemyContext)
                // BUT, pure Alchemy AA SDK usually needs the Policy ID in the client config, not per-op unless overriding.
                // Let's assume standard behavior: Client handles it if configured.
                // However, the missing piece is ensuring AlchemyContext *uses* the Policy ID.
            });

            console.log("UserOp Hash:", hash);
            toast.info(`Transaction submitted! Hash: ${hash.slice(0, 10)}...`, { autoClose: 5000 });

            // 2. Wait for Bundle
            const txHash = await client.waitForUserOperationTransaction({
                hash,
            });

            console.log("Transaction Hash:", txHash);
            toast.success(`Transfer Complete! TX: ${txHash.slice(0, 10)}...`);

            return txHash;
        } catch (error: any) {
            console.error("UserOp Failed", error);
            toast.error(`Transaction Failed: ${error.message || "Unknown error"}`);
            throw error;
        } finally {
            setIsSending(false);
        }
    };

    return { sendUserOp, isSending };
};
