import { createAlchemySmartAccountClient } from "@alchemy/aa-alchemy";
import { sepolia } from "viem/chains";
import { WalletClientSigner } from "@alchemy/aa-core";

// Function to get NFTs for an address (using Alchemy NFT API via standard fetch for now as AA SDK focuses on accounts)
export const getNFTs = async (owner: string) => {
    const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
    if (!apiKey) throw new Error("Missing Alchemy API Key");
    
    // Using Alchemy NFT API endpoint
    const baseURL = `https://eth-sepolia.g.alchemy.com/nft/v2/${apiKey}`;
    const url = `${baseURL}/getNFTs?owner=${owner}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (e) {
        console.error("Error fetching NFTs", e);
        return { ownedNfts: [] };
    }
};
