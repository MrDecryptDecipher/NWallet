import React, { useEffect, useState } from 'react';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import { toast } from 'react-toastify';
import axios from 'axios';
import ReceivePanel from './ReceivePanel';
import ParentalControlPanel from '@/components/ParentalControl/ParentalControlPanel';
import TransactionModal from './TransactionModal';
import GeneratePhrase from '@/pages/PhraseGeneration/GeneratePhrase';
import EnterMnemonic from '@/pages/PhraseGeneration/EnterMnemonic';
import { ethers } from 'ethers';
import { mnemonicToSeedSync, generateMnemonic } from 'bip39';
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';

export interface ParentalControlSettings {
  enabled: boolean;
  dailyLimit: number;
  allowedAddresses: string[];
  allowedDApps: string[];
  timeRestrictions: {
    start: string;
    end: string;
  };
}

interface LocalGeneratePhraseProps {
  setPhrase: React.Dispatch<React.SetStateAction<string>>;
  setContinueFlag: React.Dispatch<React.SetStateAction<boolean>>;
  setMode: React.Dispatch<React.SetStateAction<"" | "generate" | "enter">>;
}

const LocalGeneratePhrase: React.FC<LocalGeneratePhraseProps> = ({ setPhrase, setContinueFlag, setMode }) => {
  return (
    <div>
      <GeneratePhrase
        setPhrase={setPhrase}
        setContinueFlag={setContinueFlag}
        setMode={setMode}
      />
    </div>
  );
};

export default function NijaWallet() {
  const [ethAddress, setEthAddress] = useState<string>('');
  const [solAddress, setSolAddress] = useState<string>('');
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [ethBalance, setEthBalance] = useState<string>('');
  const [solBalance, setSolBalance] = useState<string>('');
  const [receivePanelVisible, setReceivePanelVisible] = useState<boolean>(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState<boolean>(false);
  const [currentChain, setCurrentChain] = useState<"ETH" | "SOL">("ETH");
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [isParentalControlEnabled, setIsParentalControlEnabled] = useState<boolean>(false);
  const [parentalControlPanelVisible, setParentalControlPanelVisible] = useState<boolean>(false);
  const [mode, setMode] = useState<"" | "generate" | "enter">("");
  const [phrase, setPhrase] = useState<string>("");
  const [continueFlag, setContinueFlag] = useState<boolean>(false);
  const [selectedEthNetwork, setSelectedEthNetwork] = useState<"mainnet" | "sepolia">("mainnet");
  const [selectedSolNetwork, setSelectedSolNetwork] = useState<"mainnet-beta" | "devnet">("mainnet-beta");
  const [browserVisible, setBrowserVisible] = useState<boolean>(false);
  const [subaccountMnemonic, setSubaccountMnemonic] = useState<string>("");
  const [isWalletLoading, setIsWalletLoading] = useState<boolean>(true);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);

  const devMnemonic = "pause siege fall laugh jacket plastic domain become mirror anger scare route";
  const alchemyApiKey = "gRcliAnQ2ysaJacOBBlOCd7eT9NxGLd0";
  const ethMainnetUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
  const ethSepoliaUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
  const solMainnetEndpoint = "https://api.mainnet-beta.solana.com";
  const solDevnetEndpoint = "https://api.devnet.solana.com";

  useEffect(() => {
    fetchPrices();
    fetchWalletInfo();
    const priceInterval = setInterval(fetchPrices, 30000);
    return () => clearInterval(priceInterval);
  }, []);

  useEffect(() => {
    if ((mode === "generate" || mode === "enter") && phrase && continueFlag) {
      generateAndStoreWallets(phrase);
      setPhrase("");
      setMode("");
      setContinueFlag(false);
      fetchWalletInfo();
    }
  }, [phrase, mode, continueFlag]);

  useEffect(() => {
    if (ethAddress && solAddress) {
      fetchNetworkBalances();
    }
  }, [ethAddress, solAddress, selectedEthNetwork, selectedSolNetwork]);

  const fetchPrices = async () => {
    try {
      const response = await axios.get('http://13.126.230.108:5000/api/get-prices');
      if (response.status === 200) {
        setEthPrice(response.data.ethereumPrice);
        setSolPrice(response.data.solanaPrice);
      }
    } catch {
      toast.error("Failed to fetch crypto prices.");
    }
  };

  const fetchWalletInfo = () => {
    setIsWalletLoading(true);
    try {
      const ethereumAddress = localStorage.getItem("ethereumAddress") || "";
      const solanaAddress = localStorage.getItem("solanaAddress") || "";
      setEthAddress(ethereumAddress);
      setSolAddress(solanaAddress);
    } catch (error) {
      console.error("Error fetching wallet info:", error);
      toast.error("Failed to load wallet information");
    } finally {
      setIsWalletLoading(false);
    }
  };

  const fetchNetworkBalances = async () => {
    if (!ethAddress || !solAddress) return;
    
    setIsBalanceLoading(true);
    try {
      const ethProviderUrl = selectedEthNetwork === "mainnet" ? ethMainnetUrl : ethSepoliaUrl;
      const ethProvider = new ethers.JsonRpcProvider(ethProviderUrl);
      const ethBalanceBN = await ethProvider.getBalance(ethAddress);
      setEthBalance(ethers.formatEther(ethBalanceBN));

      const solEndpoint = selectedSolNetwork === "mainnet-beta" ? solMainnetEndpoint : solDevnetEndpoint;
      const connection = new Connection(solEndpoint);
      const solBalanceLamports = await connection.getBalance(new PublicKey(solAddress));
      setSolBalance((solBalanceLamports / LAMPORTS_PER_SOL).toFixed(4));
    } catch (error) {
      console.error("Error fetching balances:", error);
      toast.error("Failed to fetch wallet balances");
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const openReceivePanel = (chain: "ETH" | "SOL", address: string) => {
    setCurrentChain(chain);
    setCurrentAddress(address);
    setReceivePanelVisible(true);
  };

  const openTransactionModal = (chain: "ETH" | "SOL") => {
    setCurrentChain(chain);
    setTransactionModalVisible(true);
  };

  const toggleParentalControl = () => {
    setIsParentalControlEnabled(!isParentalControlEnabled);
    if (!isParentalControlEnabled) {
      setParentalControlPanelVisible(true);
    }
  };

  const deriveSolanaKeyFromMnemonic = (mnemonic: string, accountIndex: number = 0): Uint8Array => {
    const path = `m/44'/501'/${accountIndex}'/0'`;
    const seed = mnemonicToSeedSync(mnemonic);

    function getMasterKeyFromSeed(seed: Uint8Array) {
      const key = new TextEncoder().encode("ed25519 seed");
      const I = hmac(sha512, key, seed);
      const IL = I.slice(0, 32);
      const IR = I.slice(32);
      return { key: IL, chainCode: IR };
    }

    function pathToIndices(path: string) {
      return path.split("/").slice(1).map(p => {
        const hardened = p.endsWith("'");
        let index = parseInt(p.replace("'", ""), 10);
        if (hardened) index += 0x80000000;
        return index;
      });
    }

    function CKDPriv({ key, chainCode }: { key: Uint8Array; chainCode: Uint8Array }, index: number) {
      const idxBuffer = new Uint8Array(4);
      new DataView(idxBuffer.buffer).setUint32(0, index, false);

      const data = new Uint8Array(1 + key.length + 4);
      data[0] = 0;
      data.set(key, 1);
      data.set(idxBuffer, key.length + 1);

      const I = hmac(sha512, chainCode, data);
      const IL = I.slice(0, 32);
      const IR = I.slice(32);
      return { key: IL, chainCode: IR };
    }

    let { key, chainCode } = getMasterKeyFromSeed(seed);
    for (const index of pathToIndices(path)) {
      ({ key, chainCode } = CKDPriv({ key, chainCode }, index));
    }

    return key;
  };

  const generateAndStoreWallets = (mnemonic: string) => {
    try {
      const ethWallet = ethers.Wallet.fromPhrase(mnemonic);
      const ethAddr = ethWallet.address;
      const ethPrivKey = ethWallet.privateKey;

      const solPrivateKey = deriveSolanaKeyFromMnemonic(mnemonic, 0);
      const solKeypair = Keypair.fromSeed(solPrivateKey);
      const solAddr = solKeypair.publicKey.toBase58();

      localStorage.setItem("ethereumAddress", ethAddr);
      localStorage.setItem("ethereumPrivateKey", ethPrivKey);
      localStorage.setItem("solanaAddress", solAddr);

      toast.success("Ethereum and Solana wallets generated and stored successfully.");
    } catch (error) {
      console.error("Error deriving keys:", error);
      toast.error("Failed to derive keys from mnemonic. Please try again.");
    }
  };

  const generateSubaccount = () => {
    const newMnemonic = generateMnemonic();
    const ethSubWallet = ethers.Wallet.fromPhrase(newMnemonic);
    const ethSubAddr = ethSubWallet.address;
    const solSubPrivateKey = deriveSolanaKeyFromMnemonic(newMnemonic, 1);
    const solSubKeypair = Keypair.fromSeed(solSubPrivateKey);
    const solSubAddr = solSubKeypair.publicKey.toBase58();

    localStorage.setItem("subaccountMnemonic", newMnemonic);
    localStorage.setItem("subaccountEthereumAddress", ethSubAddr);
    localStorage.setItem("subaccountSolanaAddress", solSubAddr);

    setSubaccountMnemonic(newMnemonic);
    toast.success("Subaccount mnemonic and addresses generated. Child can import this mnemonic.");
  };

  const fundSepoliaAccount = async () => {
    try {
      if (selectedEthNetwork !== "sepolia" || !ethAddress) {
        toast.error("Not on Sepolia network or no ETH address found.");
        return;
      }

      const devWallet = ethers.Wallet.fromPhrase(devMnemonic).connect(new ethers.JsonRpcProvider(ethSepoliaUrl));
      const tx = await devWallet.sendTransaction({
        to: ethAddress,
        value: ethers.parseEther("0.001"),
      });

      await tx.wait();
      toast.success("0.001 Sepolia ETH sent successfully!");
      fetchNetworkBalances();
    } catch (error) {
      console.error("Funding failed:", error);
      toast.error("Failed to fund Sepolia account.");
    }
  };

  const handleTransactionComplete = async (recipient: string, amount: string) => {
    try {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) {
        toast.error("Invalid amount.");
        return;
      }

      if (currentChain === "ETH") {
        const privateKey = localStorage.getItem("ethereumPrivateKey") || "";
        if (!privateKey) {
          toast.error("No ETH wallet found.");
          return;
        }

        const ethProviderUrl = selectedEthNetwork === "mainnet" ? ethMainnetUrl : ethSepoliaUrl;
        const provider = new ethers.JsonRpcProvider(ethProviderUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        
        // Updated gas handling for ethers v6
        const feeData = await provider.getFeeData();
        const tx = await wallet.sendTransaction({
          to: recipient,
          value: ethers.parseEther(amount),
          maxFeePerGas: feeData.maxFeePerGas || undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
          gasLimit: 21000
        });

        await tx.wait();
        toast.info(`Transaction initiated successfully. TX: ${tx.hash}`);
        const explorerUrl =
          selectedEthNetwork === "sepolia"
            ? `https://sepolia.etherscan.io/tx/${tx.hash}`
            : `https://etherscan.io/tx/${tx.hash}`;

        toast.success(
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: "cyan" }}>
            View on Etherscan
          </a>
        );
        fetchNetworkBalances();
      } else {
        const solSecretKeyString = localStorage.getItem("solanaSecretKey");
        if (!solSecretKeyString) {
          toast.error("No Solana wallet found.");
          return;
        }

        const solSecretKey = JSON.parse(solSecretKeyString) as number[];
        const keypair = Keypair.fromSecretKey(Uint8Array.from(solSecretKey));
        const solEndpoint = selectedSolNetwork === "mainnet-beta" ? solMainnetEndpoint : solDevnetEndpoint;
        const connection = new Connection(solEndpoint);
        const lamports = Math.floor(amt * LAMPORTS_PER_SOL);

        const solanaWeb3 = await import("@solana/web3.js");
        const tx = new solanaWeb3.Transaction().add(
          solanaWeb3.SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: new PublicKey(recipient),
            lamports,
          })
        );

        const signature = await connection.sendTransaction(tx, [keypair]);
        toast.info(`Transaction initiated. Signature: ${signature}`);
        const explorerUrl = `https://solscan.io/tx/${signature}?cluster=${
          selectedSolNetwork === "devnet" ? "devnet" : "mainnet"
        }`;
        toast.success(
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: "cyan" }}>
            View on Solscan
          </a>
        );
        await connection.confirmTransaction(signature, "finalized");
        fetchNetworkBalances();
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      toast.error("Transaction failed.");
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900">
      <div className="container px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="web3outline" onClick={() => setBrowserVisible(true)}>
              Browser
            </Button>
            <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-4xl font-bold">
              NIJA CUSTODIAN WALLET
            </h1>
          </div>
          <Button
            variant="web3outline"
            onClick={toggleParentalControl}
            className="px-6 py-3 text-sm"
          >
            {isParentalControlEnabled ? "Parental Control: ON" : "Parental Control: OFF"}
          </Button>
        </div>

        <div className="flex gap-4 mb-8">
          <div>
            <label className="text-purple-300 block mb-2">Ethereum Network</label>
            <select
              value={selectedEthNetwork}
              onChange={(e) => setSelectedEthNetwork(e.target.value as "mainnet" | "sepolia")}
              className="bg-slate-700 text-white rounded p-2"
            >
              <option value="mainnet">Mainnet</option>
              <option value="sepolia">Sepolia Testnet</option>
            </select>
          </div>
          <div>
            <label className="text-purple-300 block mb-2">Solana Network</label>
            <select
              value={selectedSolNetwork}
              onChange={(e) => setSelectedSolNetwork(e.target.value as "mainnet-beta" | "devnet")}
              className="bg-slate-700 text-white rounded p-2"
            >
              <option value="mainnet-beta">Mainnet-Beta</option>
              <option value="devnet">Devnet</option>
            </select>
          </div>
        </div>

        {isWalletLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {(!ethAddress && !solAddress) && (
              <div className="bg-slate-800 bg-opacity-20 backdrop-blur-lg rounded-lg p-6 mb-8 text-center border border-white/10 shadow-lg">
                <h2 className="text-2xl text-purple-300 mb-4">Set up your wallet</h2>
                <div className="space-y-4">
                  <Button onClick={() => setMode("generate")} className="w-full">
                    Generate New Mnemonic
                  </Button>
                  <Button onClick={() => setMode("enter")} className="w-full">
                    Enter Existing Passphrase
                  </Button>
                </div>
              </div>
            )}

            {mode === "generate" && (
              <div className="bg-slate-800 bg-opacity-20 backdrop-blur-lg rounded-lg p-6 mb-8 text-center border border-white/10 shadow-lg">
                <LocalGeneratePhrase
                  setPhrase={setPhrase}
                  setContinueFlag={setContinueFlag}
                  setMode={setMode}
                />
              </div>
            )}

            {mode === "enter" && (
              <div className="bg-slate-800 bg-opacity-20 backdrop-blur-lg rounded-lg p-6 mb-8 text-center border border-white/10 shadow-lg">
                <EnterMnemonic
                  setPhrase={setPhrase}
                  setContinueFlag={setContinueFlag}
                  setMode={setMode}
                />
              </div>
            )}

            {(ethAddress && solAddress) && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Ethereum Wallet Card */}
                <div className="p-6 bg-slate-800 bg-opacity-20 backdrop-blur-lg rounded-lg border border-white/10 shadow-lg">
                  <h2 className="text-2xl text-purple-300 mb-4">
                    Ethereum Wallet ({selectedEthNetwork === "mainnet" ? "Mainnet" : "Sepolia"})
                  </h2>
                  <div className="mb-4">
                    {isWalletLoading ? (
                      <div className="animate-pulse bg-slate-700 bg-opacity-20 h-10 rounded-lg"></div>
                    ) : (
                      <Input
                        type="text"
                        value={ethAddress}
                        onChange={() => {}}
                        readOnly
                        className="w-full px-4 py-2 rounded-lg bg-slate-700 bg-opacity-20 border border-white/10 text-white"
                        onClick={async () => {
                          await navigator.clipboard.writeText(ethAddress);
                          toast.success("Address copied to clipboard");
                        }}
                      />
                    )}
                  </div>
                  <p className="text-white mb-4">
                    Balance: {isBalanceLoading ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      `${ethBalance} ETH`
                    )}
                  </p>

                  {selectedEthNetwork === "sepolia" && ethAddress && (
                    <Button variant="web3outline" onClick={fundSepoliaAccount} className="mb-4">
                      Receive 0.001 ETH from NIJA
                    </Button>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="web3" disabled={!ethAddress} onClick={() => openTransactionModal("ETH")}>
                      Send
                    </Button>
                    <Button
                      variant="web3outline"
                      disabled={!ethAddress}
                      onClick={() => openReceivePanel("ETH", ethAddress)}
                    >
                      Receive
                    </Button>
                  </div>
                </div>

                {/* Solana Wallet Card */}
                <div className="p-6 bg-slate-800 bg-opacity-20 backdrop-blur-lg rounded-lg border border-white/10 shadow-lg">
                  <h2 className="text-2xl text-purple-300 mb-4">
                    Solana Wallet ({selectedSolNetwork === "mainnet-beta" ? "Mainnet-Beta" : "Devnet"})
                  </h2>
                  <div className="mb-4">
                    {isWalletLoading ? (
                      <div className="animate-pulse bg-slate-700 bg-opacity-20 h-10 rounded-lg"></div>
                    ) : (
                      <Input
                        type="text"
                        value={solAddress}
                        onChange={() => {}}
                        readOnly
                        className="w-full px-4 py-2 rounded-lg bg-slate-700 bg-opacity-20 border border-white/10 text-white"
                        onClick={async () => {
                          await navigator.clipboard.writeText(solAddress);
                          toast.success("Address copied to clipboard");
                        }}
                      />
                    )}
                  </div>
                  <p className="text-white mb-4">
                    Balance: {isBalanceLoading ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      `${solBalance} SOL`
                    )}
                  </p>

                  {selectedSolNetwork === "devnet" && solAddress && (
                    <div className="bg-slate-700 p-4 rounded mb-4">
                      <p className="text-purple-200 mb-2">To fund your Devnet SOL balance:</p>
                      <p className="text-white text-sm mb-2">
                        1. Copy your Solana address.<br />
                        2. <Button variant="web3outline" onClick={() => window.open("https://faucet.solana.com", "_blank")}>
                          Fund your SOL
                        </Button><br />
                        3. After the airdrop, click "Refresh Balances" below.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="web3" disabled={!solAddress} onClick={() => openTransactionModal("SOL")}>
                      Send
                    </Button>
                    <Button
                      variant="web3outline"
                      disabled={!solAddress}
                      onClick={() => openReceivePanel("SOL", solAddress)}
                    >
                      Receive
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {(ethAddress && solAddress) && (
              <div className="text-center mb-8">
                <Button variant="web3outline" onClick={fetchNetworkBalances}>
                  Refresh Balances
                </Button>
              </div>
            )}

            {isParentalControlEnabled && (
              <div className="text-center mb-8">
                <Button variant="web3outline" onClick={generateSubaccount}>
                  Generate Subaccount
                </Button>
                {subaccountMnemonic && (
                  <p className="text-white mt-2 break-all text-sm">
                    Subaccount Mnemonic: {subaccountMnemonic}
                    <br />
                    Child can import this mnemonic and will be restricted by these parental controls.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <ReceivePanel
        visible={receivePanelVisible}
        setVisible={setReceivePanelVisible}
        chainType={currentChain}
        publicKey={currentAddress}
      />

      <TransactionModal
        visible={transactionModalVisible}
        setVisible={setTransactionModalVisible}
        type={currentChain}
        parentalControlEnabled={isParentalControlEnabled}
        ethPrice={ethPrice}
        solPrice={solPrice}
        onTransactionComplete={handleTransactionComplete}
      />

      {parentalControlPanelVisible && (
        <ParentalControlPanel
          onClose={() => setParentalControlPanelVisible(false)}
          onSave={(settings) => {
            console.log("Settings saved:", settings);
          }}
        />
      )}

      {browserVisible && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col">
          <div className="relative flex-1">
            <button
              onClick={() => setBrowserVisible(false)}
              className="absolute top-4 right-4 bg-gray-800 text-white p-2 rounded-full"
            >
              X
            </button>
            <iframe
              src="https://dexscreener.com"
              className="w-full h-full"
              title="Browser"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}