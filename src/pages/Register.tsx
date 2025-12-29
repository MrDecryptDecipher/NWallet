import React, { useState } from 'react';
import { generateMnemonic } from 'bip39';
import { encryptData } from '../utils/crypto';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Copy, CheckCircle, ArrowRight, Wallet, Shield, Zap, EyeOff } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonInput } from '../components/ui/NeonInput';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { useNavigate } from 'react-router-dom';
import InteractiveGalaxy from '../components/InteractiveGalaxy';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 50 } }
};

const FeatureItem = ({ icon: Icon, title, desc }: any) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(6,182,212,0.4)" }}
    className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-colors cursor-default"
  >
    <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h3 className="text-white font-semibold text-lg">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const mnemonic = generateMnemonic();
      const { ciphertext, iv, salt } = await encryptData(mnemonic, password);

      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          walletData: {
            // Computed later or on first login
            address: "0x0000000000000000000000000000000000000000",
            encrypted: ciphertext,
            iv,
            salt
          }
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      toast.success('Registration successful!');
      setGeneratedMnemonic(mnemonic);
      setStep(2);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMnemonic);
    toast.success('Copied to clipboard!');
  };

  const handleDone = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950 overflow-hidden font-sans">

      {/* LEFT SIDE: Immersive Experience */}
      <div className="relative hidden lg:flex flex-col justify-center p-12 overflow-hidden">
        {/* 3D Background */}
        <InteractiveGalaxy />

        {/* Content Overlay */}
        <motion.div
          className="relative z-10 max-w-lg space-y-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              Live on Sepolia & Devnet
            </div>

            <h1 className="text-6xl font-extrabold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-gradient-x bg-[length:200%_auto]">
                Nija Wallet
              </span>
            </h1>
            <p className="text-xl text-gray-300 font-light max-w-md border-l-2 border-cyan-500/50 pl-4">
              The advanced smart wallet signature for the decentralized future.
            </p>
          </motion.div>

          <motion.div variants={containerVariants} className="space-y-4">
            <FeatureItem
              icon={Shield}
              title="Smart Security"
              desc="Built on ERC-4337 Account Abstraction. No private key loss fears."
            />
            <FeatureItem
              icon={EyeOff}
              title="Zero-Knowledge Privacy"
              desc="Transact with confidence. Your balance is yours to know, and yours alone."
            />
            <FeatureItem
              icon={Zap}
              title="Multi-Chain Power"
              desc="Seamlessly switch between Ethereum Sepolia and Solana Devnet."
            />
          </motion.div>
        </motion.div>
      </div>

      {/* RIGHT SIDE: Functional Form */}
      <div className="relative flex items-center justify-center p-6 bg-slate-950 lg:bg-transparent/10 backdrop-blur-sm">
        {/* Mobile Background Fallback */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-slate-900 via-slate-950 to-black z-0" />

        <div className="relative z-10 w-full max-w-md">
          <GlassCard className="w-full p-8 border-white/5 shadow-2xl shadow-cyan-900/10" hoverEffect={false}>
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring' }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 mb-4 shadow-lg shadow-cyan-500/30 ring-1 ring-white/20"
              >
                <Wallet className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {step === 1 ? 'Join the Future' : 'Secure Your Key'}
              </h2>
              <p className="text-gray-400 text-sm mt-3">
                {step === 1 ? 'Create your Nija identity.' : 'Write this down. Seriously.'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <NeonInput
                    label="Email Address"
                    placeholder="user@nijawallet.com"
                    icon={<Mail className="w-5 h-5" />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <NeonInput
                    label="Password"
                    type="password"
                    icon={<Lock className="w-5 h-5" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <div className="pt-2">
                    <AnimatedButton onClick={handleRegister} isLoading={isLoading} className="w-full py-4 text-lg font-bold tracking-wide shadow-cyan-500/20 shadow-lg">
                      Get Started <ArrowRight className="w-5 h-5 ml-2" />
                    </AnimatedButton>
                  </div>

                  <p className="text-center text-xs text-gray-500 mt-4">
                    Already have an account? <span onClick={() => navigate('/login')} className="text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors font-medium">Log In</span>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3">
                    <Shield className="w-5 h-5 text-rose-400 mt-0.5" />
                    <div>
                      <h4 className="text-rose-200 font-semibold text-sm">Secret Recovery Phrase</h4>
                      <p className="text-rose-200/70 text-xs mt-1">
                        This sequence of words is the ONLY way to access your funds.
                        Save it somewhere safe and offline.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={handleCopy}
                    className="group relative bg-black/40 p-6 rounded-xl border border-white/10 cursor-pointer hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="font-mono text-lg text-center leading-loose text-cyan-100/90 break-words selection:bg-cyan-900">
                      {generatedMnemonic}
                    </p>
                  </div>

                  <AnimatedButton onClick={handleDone} variant="secondary" className="w-full bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400 backdrop-blur-sm">
                    <CheckCircle className="w-5 h-5 mr-2" /> I Have Saved It
                  </AnimatedButton>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Register;
