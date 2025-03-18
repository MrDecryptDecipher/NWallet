import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';

interface ReceivePanelProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  chainType: "ETH" | "SOL";
  publicKey: string;
  network: string; // Add network prop to determine explorer URL
}

export default function ReceivePanel({ visible, setVisible, chainType, publicKey, network }: ReceivePanelProps) {
  const [copied, setCopied] = useState(false);

  if (!visible) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(publicKey)
      .then(() => {
        setCopied(true);
        toast.success('Address copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy address:', err);
        toast.error('Failed to copy address');
      });
  };

  // Create blockchain explorer link based on network
  let explorerLink;
  let explorerName;
  
  if (chainType === 'ETH') {
    if (network.toLowerCase() === 'sepolia') {
      explorerLink = `https://sepolia.etherscan.io/address/${publicKey}`;
      explorerName = 'Sepolia Etherscan';
    } else {
      explorerLink = `https://etherscan.io/address/${publicKey}`;
      explorerName = 'Etherscan';
    }
  } else { // SOL
    if (network.toLowerCase() === 'devnet') {
      explorerLink = `https://explorer.solana.com/address/${publicKey}?cluster=devnet`;
      explorerName = 'Solana Explorer (Devnet)';
    } else {
      explorerLink = `https://solscan.io/account/${publicKey}`;
      explorerName = 'Solscan';
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl max-w-md w-full border border-slate-700/50 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Receive {chainType} ({network})</h2>
          <button 
            onClick={() => setVisible(false)} 
            className="text-slate-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg mb-4">
            <QRCode 
              value={publicKey}
              size={200}
              level="H"
            />
          </div>
          
          <div className="w-full mb-4 relative">
            <div className="bg-slate-700 p-3 rounded break-all text-sm text-slate-200 mb-2">
              {publicKey}
            </div>
            <button 
              onClick={handleCopyAddress}
              className={`absolute right-2 top-2 p-1 rounded ${copied ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>
          </div>
          
          <a 
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm mb-3 flex items-center"
          >
            View on {explorerName}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          
          <button 
            onClick={() => setVisible(false)} 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg w-full transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
