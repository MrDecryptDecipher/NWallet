import React, { useState } from 'react';
import { generateMnemonic } from 'bip39';
import Button from '@/components/UI/Button';

interface GeneratePhraseProps {
  setPhrase: (phrase: string) => void;
  setContinueFlag: (flag: boolean) => void;
  setMode: (mode: "" | "generate" | "enter") => void;
}

const GeneratePhrase: React.FC<GeneratePhraseProps> = ({
  setPhrase,
  setContinueFlag,
  setMode
}) => {
  const [mnemonic, setMnemonic] = useState('');

  const handleGenerate = () => {
    const newMnemonic = generateMnemonic();
    setMnemonic(newMnemonic);
  };

  const handleContinue = () => {
    if (!mnemonic) {
      alert("Please generate a mnemonic phrase first.");
      return;
    }
    setPhrase(mnemonic);
    setContinueFlag(true);
    setMode('generate');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800 bg-opacity-30 backdrop-blur-lg rounded-lg p-8 max-w-md w-full border border-white/20 shadow-2xl">
        <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-3xl font-bold mb-8 text-center">
          Generate New Mnemonic
        </h2>
        <div className="bg-slate-700 bg-opacity-20 p-4 rounded-lg border border-white/10 mb-4">
          <p className="text-white break-words">{mnemonic}</p>
        </div>
        <div className="flex flex-col space-y-4">
          <Button onClick={handleGenerate} className="w-full">
            Generate New Mnemonic
          </Button>
          <Button onClick={handleContinue} className="w-full">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GeneratePhrase;