import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const navigate = useNavigate();

  const handleInitialSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const userData = JSON.parse(localStorage.getItem(email) || '{}');

    if (userData && password === userData.password) {
      setShowSignature(true);
    } else {
      toast.error('Invalid email or password');
    }
  };

  const handleSignatureVerification = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem(email) || '{}');
      const { mnemonic } = userData;

      if (!mnemonic) {
        toast.error('No mnemonic found for this account');
        return;
      }

      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      const message = `Welcome to NIJA Wallet!\n\nThis signature is used to verify your ownership.\n\nTimestamp: ${Date.now()}`;
      
      try {
        const signature = await wallet.signMessage(message);
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        if (recoveredAddress === wallet.address) {
          toast.success('Signature verified successfully!');
          navigate('/nijawallet');
        } else {
          toast.error('Signature verification failed');
        }
      } catch (error) {
        console.error('Signature error:', error);
        toast.error('Failed to sign message');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to process login');
    }
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
              Access Wallet
            </h1>
          </div>

          {!showSignature ? (
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
                  Continue
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 bg-slate-800/20 backdrop-blur-lg rounded-xl p-8 border border-white/10 dark:bg-gray-800/50 dark:border-gray-700/50">
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-xl text-purple-300 font-medium mb-2 dark:text-purple-200">Verify Wallet Ownership</h2>
                  <p className="text-white/70 text-sm mb-4 dark:text-gray-300">
                    Please sign the message to verify your wallet ownership
                  </p>
                </div>

                <div className="p-4 bg-slate-700/30 rounded-lg border border-white/10 dark:bg-gray-700/50 dark:border-gray-700/50">
                  <p className="text-white text-sm text-center dark:text-gray-300">
                    You are signing in to NIJA Wallet. This signature will verify your ownership of the wallet.
                  </p>
                </div>

                <button
                  onClick={handleSignatureVerification}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition dark:from-purple-400 dark:to-pink-400"
                >
                  Sign & Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
