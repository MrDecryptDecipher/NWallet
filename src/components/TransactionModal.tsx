import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { isAddress, parseEther } from 'ethers';
import { PublicKey } from '@solana/web3.js';

interface TransactionModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  type: "ETH" | "SOL";
  parentalControlEnabled: boolean;
  ethPrice: number | null;
  solPrice: number | null;
  onTransactionComplete: (recipient: string, amount: string) => Promise<void>;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  visible,
  setVisible,
  type,
  parentalControlEnabled,
  ethPrice,
  solPrice,
  onTransactionComplete
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!visible) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    // STRICT VALIDATION (Deep Audit Fix)
    try {
      if (parseFloat(amount) <= 0) throw new Error("Amount must be positive");

      if (type === "ETH") {
        if (!isAddress(recipient)) throw new Error("Invalid Ethereum Address");
        parseEther(amount); // Validate amount format
      } else {
        // Validate Solana Address
        try {
          new PublicKey(recipient);
        } catch {
          throw new Error("Invalid Solana Address");
        }
      }
    } catch (err: any) {
      toast.error(err.message);
      return;
    }

    try {
      setIsProcessing(true);
      await onTransactionComplete(recipient, amount);
      setVisible(false);
      setRecipient('');
      setAmount('');
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const price = type === "ETH" ? ethPrice : solPrice;
  const fiatValue = price && amount ? (parseFloat(amount) * price).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 bg-opacity-90 rounded-lg p-6 max-w-md w-full border border-white/10">
        <div className="text-center mb-6">
          <h2 className="text-2xl text-purple-300 mb-2">
            Send {type === "ETH" ? "Ethereum" : "Solana"}
          </h2>
          {parentalControlEnabled && (
            <p className="text-yellow-300 text-sm mb-2">
              Parental controls are enabled. Transactions may be restricted.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/70 text-sm block mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={`Enter ${type} address`}
              className="w-full px-4 py-3 rounded-lg bg-slate-700/20 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-2">
              Amount ({type})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.000000000000000001"
              min="0"
              className="w-full px-4 py-3 rounded-lg bg-slate-700/20 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
            {price && (
              <p className="text-white/50 text-sm mt-1">
                ≈ ${fiatValue} USD
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="flex-1 px-4 py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-white font-medium transition"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal; 