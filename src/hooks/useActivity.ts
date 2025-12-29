import { useState, useEffect } from 'react';
import { useAlchemy } from '../context/AlchemyContext';
import { Alchemy, Network, AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';

export interface ActivityItem {
    id: string;
    hash: string;
    from: string;
    to: string;
    value: number | null;
    asset: string | null;
    category: string;
    timestamp?: string;
}

export const useActivity = () => {
    const { address, client } = useAlchemy();
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchActivity = async () => {
            if (!address) return;

            // TODO: Move this config to a centralized service or use env
            const config = {
                apiKey: import.meta.env.VITE_ALCHEMY_API_KEY || "demo",
                network: Network.ETH_SEPOLIA, // Using Sepolia
            };
            const alchemy = new Alchemy(config);

            setIsLoading(true);
            try {
                // Fetch Incoming and Outgoing transfers
                // We use AssetTransfers API for better indexed history than eth_getLogs
                const [incoming, outgoing] = await Promise.all([
                    alchemy.core.getAssetTransfers({
                        fromBlock: "0x0",
                        toAddress: address,
                        excludeZeroValue: true,
                        category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20],
                        maxCount: 10,
                        order: SortingOrder.DESCENDING
                    }),
                    alchemy.core.getAssetTransfers({
                        fromBlock: "0x0",
                        fromAddress: address,
                        excludeZeroValue: true,
                        category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20],
                        maxCount: 10,
                        order: SortingOrder.DESCENDING
                    })
                ]);

                const formatTransfer = (tx: any, type: 'IN' | 'OUT'): ActivityItem => ({
                    id: tx.uniqueId,
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: tx.value,
                    asset: tx.asset,
                    category: type,
                    timestamp: tx.metadata.blockTimestamp
                });

                const all = [
                    ...incoming.transfers.map(t => formatTransfer(t, 'IN')),
                    ...outgoing.transfers.map(t => formatTransfer(t, 'OUT'))
                ];

                // Sort by approximate blockNum or just take top 
                // Since specific timestamp might be missing in basic calls depending on subscription level, 
                // we'll accept the API order roughly.
                // Actually they are sorted DESC by block. Merging two sorted lists.
                // For simplicity, just concat and slice for now.

                setActivity(all.slice(0, 10));

            } catch (error) {
                console.error("Activity Fetch Failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivity();
    }, [address]);

    return { activity, isLoading };
};
