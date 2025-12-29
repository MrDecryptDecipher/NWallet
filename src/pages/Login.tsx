import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Wallet, LogIn } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonInput } from '../components/ui/NeonInput';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { decryptData } from '../utils/crypto';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Secure Login (In-Memory)
      const { walletData, token, settings } = data;
      let mnemonic = null;

      if (walletData && walletData.encrypted) {
        try {
          // Decrypt Client-Side
          console.log("Context: Decrypting wallet...", walletData);
          mnemonic = await decryptData(
            walletData.encrypted,
            walletData.iv,
            walletData.salt,
            password // Encrypted with user password
          );
          console.log("Context: Wallet unlocked.");
        } catch (e) {
          console.error(e);
          toast.error("Failed to decrypt wallet. Is your password correct?");
          return; // Stop login if we can't unlock the wallet
        }
      }

      login(token, { email, settings, mnemonic });

      toast.success('Wallet Unlocked & Ready!');
      navigate('/dashboard');

    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-6">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <GlassCard className="w-full max-w-lg p-8 z-10" hoverEffect={false}>
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 mb-4 shadow-lg shadow-purple-500/30"
          >
            <LogIn className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Welcome Back
          </h2>
          <p className="text-gray-400 mt-2">
            Access your secure wallet interface.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <NeonInput
            label="Email Address"
            placeholder="cosmos@nwallet.com"
            icon={<Mail className="w-5 h-5" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <NeonInput
            label="Password"
            type="password"
            placeholder=""
            icon={<Lock className="w-5 h-5" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="pt-2">
            <AnimatedButton onClick={handleLogin} isLoading={isLoading}>
              Sign In <ArrowRight className="w-5 h-5" />
            </AnimatedButton>
          </div>

          <div className="text-center text-sm text-gray-400 mt-4">
            Don't have an account? <Link to="/register" className="text-cyan-400 hover:text-cyan-300">Create one</Link>
          </div>
        </motion.div>
      </GlassCard>
    </div>
  );
};

export default Login;
