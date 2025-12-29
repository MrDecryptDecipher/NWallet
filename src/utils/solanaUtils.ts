
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { mnemonicToSeed } from 'bip39';
import { derivePath } from 'ed25519-hd-key';

// Default to Devnet for Audit - In production use Alchemy RPC from env
const SOLANA_RPC = "https://api.devnet.solana.com";

export const getSolanaRpcUrl = () => {
    // Return Alchemy URL if configured, else public devnet
    return SOLANA_RPC;
};

export const deriveSolanaKeypair = async (mnemonic: string): Promise<Keypair> => {
    const seed = await mnemonicToSeed(mnemonic);
    // Standard Solana derivation path
    const path = "m/44'/501'/0'/0'";
    const derivedSeed = derivePath(path, seed.toString('hex')).key;

    return Keypair.fromSeed(derivedSeed);
};

export const getSolanaBalance = async (address: string): Promise<string> => {
    try {
        const connection = new Connection(getSolanaRpcUrl(), 'confirmed');
        const pubKey = new PublicKey(address);
        const balance = await connection.getBalance(pubKey);
        return (balance / LAMPORTS_PER_SOL).toFixed(4);
    } catch (e) {
        console.error("Solana Balance Error:", e);
        return "0.0000";
    }
};

export const sendSolanaTransfer = async (
    senderKeypair: Keypair,
    recipientAddress: string,
    amountSol: string
): Promise<string> => {
    const connection = new Connection(getSolanaRpcUrl(), 'confirmed');
    const toPublicKey = new PublicKey(recipientAddress);

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: toPublicKey,
            // Safe conversion (avoid floating point errors)
            lamports: BigInt(Math.round(parseFloat(amountSol) * LAMPORTS_PER_SOL)),
        })
    );

    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [senderKeypair]
    );

    return signature;
};
