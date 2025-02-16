import React from 'react';

interface ReceivePanelProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  chainType: "ETH" | "SOL";
  publicKey: string;
}

export default function ReceivePanel({ visible, setVisible, chainType, publicKey }: ReceivePanelProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg">
        <h2 className="text-xl mb-4">{chainType} Address</h2>
        <p className="break-all mb-4">{publicKey}</p>
        <button onClick={() => setVisible(false)} className="bg-blue-500 text-white px-4 py-2 rounded">
          Close
        </button>
      </div>
    </div>
  );
}
