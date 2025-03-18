import React from 'react';
import { NFTGEN_URL } from '../../config/web3';

interface NFTGenConnectModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const NFTGenConnectModal: React.FC<NFTGenConnectModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 border border-purple-500/50 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-white mb-4">Connect to NFTGen</h2>
        
        <div className="mb-6 text-gray-200">
          <p className="mb-3">
            You are about to connect your Nija Wallet to the NFTGen platform at:
          </p>
          <p className="font-mono bg-black/30 p-2 rounded text-xs mb-4 break-all">
            {NFTGEN_URL}
          </p>
          <p className="mb-3">
            This will allow you to:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-1 text-sm">
            <li>Mint NFTs with your connected wallet</li>
            <li>View your NFT collection</li>
            <li>Transfer NFTs to other users</li>
            <li>Participate in NFT marketplaces</li>
          </ul>
          <p className="text-yellow-300 text-sm">
            Note: All activities will be subject to parental controls if enabled.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};

export default NFTGenConnectModal; 