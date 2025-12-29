import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, getMint } from "@solana/spl-token";

// Exponential Improvement: SPL Token 2022 Support
// This configuration enables interaction with the new Token-2022 program.
// Features supported: Transfer Fees, Interest-bearing tokens, etc.

export const SOLANA_NETWORK = "devnet"; // Default to devnet for safety
export const RPC_ENDPOINT = clusterApiUrl(SOLANA_NETWORK);

export const connection = new Connection(RPC_ENDPOINT, "confirmed");

export const getMintInfo2022 = async (mintAddress: string) => {
  try {
    const mint = new PublicKey(mintAddress);
    // tailored to fetch info specifically from the Token-2022 program
    const mintInfo = await getMint(connection, mint, undefined, TOKEN_2022_PROGRAM_ID);
    return mintInfo;
  } catch (error) {
    console.error("Failed to fetch Token-2022 Mint Info:", error);
    return null;
  }
};
