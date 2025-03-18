import React from 'react';
import QRCode from 'qrcode.react';
import { toast } from 'react-toastify';

interface ReceivePanelProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  chainType: "ETH" | "SOL";
  publicKey: string;
}

const ReceivePanel: React.FC<ReceivePanelProps> = ({ visible, setVisible, chainType, publicKey }) => {
  if (!visible) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicKey);
      toast.success('Address copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 bg-opacity-90 rounded-lg p-6 max-w-md w-full border border-white/10">
        <div className="text-center mb-6">
          <h2 className="text-2xl text-purple-300 mb-2">
            Receive {chainType === "ETH" ? "Ethereum" : "Solana"}
          </h2>
          <p className="text-white/70 text-sm">
            Scan QR code or copy address below
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-lg">
            <QRCode value={publicKey} size={200} />
          </div>
        </div>

        <div className="mb-6">
          <div
            className="bg-slate-700/30 p-4 rounded-lg border border-white/10 break-all text-white text-sm cursor-pointer hover:bg-slate-700/50 transition"
            onClick={copyToClipboard}
          >
            {publicKey}
          </div>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ReceivePanel; 