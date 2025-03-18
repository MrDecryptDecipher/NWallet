import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { generateMnemonic } from 'bip39';
import { toast } from 'react-toastify';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [mnemonicCopied, setMnemonicCopied] = useState(false);
  const mnemonicRef = useRef<HTMLParagraphElement>(null);
  const navigate = useNavigate();

  const handleInitialSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    const existingUser = localStorage.getItem(email);
    if (existingUser) {
      toast.error('Email already registered');
      return;
    }

    const newMnemonic = generateMnemonic();
    setMnemonic(newMnemonic);
    setShowMnemonic(true);
  };

  const copyToClipboard = () => {
    // Try different approaches to copy text
    try {
      // First try the modern clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mnemonic)
          .then(() => {
            toast.success('Mnemonic copied to clipboard');
            setMnemonicCopied(true);
          })
          .catch(err => {
            console.error('Clipboard API failed:', err);
            fallbackCopy();
          });
      } else {
        // If Clipboard API is not available, use fallback
        fallbackCopy();
      }
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Failed to copy. Please select and copy manually.');
      // Mark as copied anyway to allow progression
      setMnemonicCopied(true);
    }
  };

  // Fallback copy method using document.execCommand
  const fallbackCopy = () => {
    try {
      // Try selection-based copy
      if (mnemonicRef.current) {
        const range = document.createRange();
        const selection = window.getSelection();
        
        range.selectNodeContents(mnemonicRef.current);
        
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
          
          const successful = document.execCommand('copy');
          selection.removeAllRanges();
          
          if (successful) {
            toast.success('Mnemonic copied to clipboard');
            setMnemonicCopied(true);
          } else {
            throw new Error('document.execCommand failed');
          }
        }
      } else {
        // Create temporary textarea as last resort
        const textArea = document.createElement('textarea');
        textArea.value = mnemonic;
        
        // Make it invisible
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        
        document.body.appendChild(textArea);
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          toast.success('Mnemonic copied to clipboard');
          setMnemonicCopied(true);
        } else {
          throw new Error('Fallback copy failed');
        }
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      toast.error('Please select and copy the mnemonic manually');
      // Mark as copied anyway to allow progression
      setMnemonicCopied(true);
    }
  };

  const handleMnemonicConfirm = () => {
    if (!mnemonicCopied) {
      toast.error('Please copy your mnemonic phrase first');
      return;
    }

    const userData = {
      email,
      password,
      mnemonic,
      ethAddress: '',
      solAddress: '',
      ethPrivateKey: '',
      solSecretKey: '',
    };
    localStorage.setItem(email, JSON.stringify(userData));

    toast.success('Registration successful! Please login to continue');
    navigate('/login');
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative dark:bg-background">
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0, 0], fov: 75 }}
      >
        <> </>
      </Canvas>

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-300 dark:to-pink-300">
              Create Wallet
            </h1>
          </div>

          {!showMnemonic ? (
            <form onSubmit={handleInitialSubmit} className="space-y-6 bg-slate-800/20 backdrop-blur-lg rounded-xl p-8 border border-white/10 dark:bg-gray-800/50 dark:border-gray-700/50">
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/20 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition dark:bg-gray-700/50 dark:border-gray-700/50 dark:placeholder-gray-500 dark:focus:ring-purple-400"
                />
                
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/20 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition dark:bg-gray-700/50 dark:border-gray-700/50 dark:placeholder-gray-500 dark:focus:ring-purple-400"
                />

                <button
                  type="submit"
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition dark:from-purple-400 dark:to-pink-400"
                >
                  Register
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 bg-slate-800/20 backdrop-blur-lg rounded-xl p-8 border border-white/10 dark:bg-gray-800/50 dark:border-gray-700/50">
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-xl text-purple-300 font-medium mb-2 dark:text-purple-200">Your Mnemonic Phrase</h2>
                  <p className="text-white/70 text-sm mb-4 dark:text-gray-300">
                    Please copy and store this phrase safely. It will be used to access your ETH and SOL wallets.
                  </p>
                </div>

                <div className="p-4 bg-slate-700/30 rounded-lg border border-white/10 dark:bg-gray-700/50 dark:border-gray-700/50">
                  <p 
                    ref={mnemonicRef}
                    className="text-white break-all text-sm text-center dark:text-gray-300 select-all"
                  >
                    {mnemonic}
                  </p>
                </div>

                <button
                  onClick={copyToClipboard}
                  className={`w-full px-4 py-3 rounded-lg ${
                    mnemonicCopied 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white font-medium transition dark:bg-purple-400 dark:hover:bg-purple-500`}
                >
                  {mnemonicCopied ? 'Copied!' : 'Copy Mnemonic'}
                </button>

                <button
                  onClick={handleMnemonicConfirm}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition dark:from-purple-400 dark:to-pink-400"
                >
                  I've Saved My Mnemonic
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
