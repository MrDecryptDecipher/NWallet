import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import * as bs58 from 'bs58';

/**
 * Creates a Solana wallet from a mnemonic phrase and optional derivation path
 * @param mnemonic - The mnemonic phrase to use
 * @param derivationPath - The derivation path (defaults to m/44'/501'/0'/0')
 * @returns An object containing the public address and private key
 */
export const generateSolanaWalletFromMnemonic = (
  mnemonic: string,
  derivationPath?: string
) => {
  const path = derivationPath || "m/44'/501'/0'/0'";
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const derivedSeed = derivePath(path, seed as unknown as string).key;

  const keyPair = Keypair.fromSeed(derivedSeed);

  return {
    address: keyPair.publicKey.toBase58(),
    privateKey: bs58.encode(keyPair.secretKey),
    mnemonic,
  };
};

/**
 * Creates a new Solana wallet with a random mnemonic
 * @param derivationPath - Optional derivation path
 * @returns A new wallet with address, private key, and mnemonic
 */
export const createSolanaWallet = (derivationPath?: string) => {
  const mnemonic = bip39.generateMnemonic();
  return generateSolanaWalletFromMnemonic(mnemonic, derivationPath);
};

/**
 * Gets a Solana address from a private key
 * @param privateKey - The private key as a base58 string or array
 * @returns The public address
 */
export const getSolanaAddressFromPrivateKey = (privateKey: string) => {
  let secretKey;

  if (privateKey.split(',').length > 1) {
    secretKey = new Uint8Array(privateKey.split(',') as unknown as number[]);
  } else {
    secretKey = bs58.decode(privateKey);
  }

  const keyPair = Keypair.fromSecretKey(secretKey, {
    skipValidation: true,
  });

  return {
    address: keyPair.publicKey.toBase58(),
  };
}; 