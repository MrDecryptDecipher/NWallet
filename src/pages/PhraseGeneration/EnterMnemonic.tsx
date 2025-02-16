import React, { useState } from "react";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";

interface EnterMnemonicProps {
  setPhrase: (phrase: string) => void;
  setContinueFlag: (flag: boolean) => void;
  setMode: (mode: "" | "generate" | "enter") => void;
}

export default function EnterMnemonic({
  setPhrase,
  setContinueFlag,
  setMode,
}: EnterMnemonicProps) {
  const [inputValue, setInputValue] = useState<string>("");

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      alert("Please enter a valid mnemonic phrase.");
      return;
    }
    setPhrase(inputValue.trim());
    setContinueFlag(true);
    setMode("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800 bg-opacity-30 backdrop-blur-lg rounded-lg p-8 max-w-md w-full border border-white/20 shadow-2xl">
        <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-3xl font-bold mb-8 text-center">
          Enter Your Mnemonic Phrase
        </h2>
        <div className="mb-4">
          <Input
            type="text"
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            placeholder="Enter your mnemonic phrase here"
            className="w-full px-4 py-2 rounded-lg bg-slate-700 bg-opacity-20 border border-white/10 text-white"
          />
        </div>
        <div className="flex justify-center">
          <Button onClick={handleSubmit} className="w-full">
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
