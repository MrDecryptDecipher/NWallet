import React, { useState, useEffect } from 'react';
import { useAlchemy } from '../context/AlchemyContext';
import { useSolana } from '../context/SolanaContext';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { LogOut, Wallet, Activity, CreditCard, Send, Settings, ArrowRightLeft, Shield, Eye, EyeOff, User, Layers, Boxes, Baby, Globe } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import { useSendUserOp } from '../hooks/useTransaction';
import { useParental } from '../contexts/ParentalContext';
import { useActivity } from '../hooks/useActivity';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import InteractiveGalaxy from '../components/InteractiveGalaxy';
import { CryptoChart } from '../components/dashboard/CryptoChart';
import { TokenFactoryModal, ChildAccountModal, EcosystemModal, ProfileModal } from '../components/dashboard/Modals';
import { apiClient } from '../utils/api';

const Dashboard = () => {
    // Auth State
    const { token } = useAuth();

    // Ethereum State
    const { address: ethAddress, client, isLoading: isEthLoading, disconnect } = useAlchemy();
    const [ethBalance, setEthBalance] = useState("0.00");
    const { sendUserOp } = useSendUserOp();

    // Solana State
    const { solAddress, solBalance, sendTransaction: sendSolTransaction, isLoading: isSolLoading } = useSolana();

    // Parental & Activity
    const { checkTransaction, settings: parentalSettings, updateSettings } = useParental();
    const { activity, isLoading: isActivityLoading } = useActivity();

    // UI State
    const [selectedChain, setSelectedChain] = useState<'ETH' | 'SOL'>('ETH');
    const [modalVisible, setModalVisible] = useState(false);
    const [privacyRevealed, setPrivacyRevealed] = useState(false);

    // Advanced Modals State
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Privacy Simulation
    const [stealthActive, setStealthActive] = useState(false);

    useEffect(() => {
        if (client && ethAddress) {
            const fetchBal = async () => {
                try {
                    const bal = await client.getBalance({ address: ethAddress });
                    setEthBalance(bal ? (Number(bal) / 1e18).toFixed(4) : "0.00");
                } catch (e) { console.error(e); }
            };
            fetchBal();
        }
    }, [client, ethAddress]);

    // Fetch Profile on Mount
    useEffect(() => {
        if (token) {
            apiClient('/api/profile', { token }).then(setUserProfile).catch(() => { });
        }
    }, [token]);

    const handleTransactionComplete = async (recipient: string, amount: string) => {
        const { allowed, reason } = checkTransaction(parseFloat(amount), recipient);
        if (!allowed) return toast.error(`Blocked: ${reason}`);

        if (stealthActive) {
            toast.info("🛡️ Initiating Zero-Knowledge Mixer...");
            await new Promise(r => setTimeout(r, 2000));
            toast.success("Identity Masked. Broadcasting...");
        }

        if (selectedChain === 'ETH') await sendUserOp(recipient, amount);
        else await sendSolTransaction(recipient, amount);
    };

    const toggleStealth = () => {
        if (!stealthActive) toast.success("ZK Stealth Mode Activated: Address Anonymized");
        else toast.info("Stealth Mode Deactivated");
        setStealthActive(!stealthActive);
    };

    const currentAddress = selectedChain === 'ETH' ? ethAddress : solAddress;
    const rawBalance = selectedChain === 'ETH' ? ethBalance : solBalance;
    const currentSymbol = selectedChain === 'ETH' ? 'ETH' : 'SOL';
    const showBalance = (!parentalSettings.zkModeEnabled || privacyRevealed) && !stealthActive;

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans selection:bg-cyan-500/30">
            {/* Background Layer */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
                <InteractiveGalaxy />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6">

                {/* Sidebar Navigation */}
                <aside className="col-span-12 lg:col-span-2 space-y-4">
                    <div className="p-4 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col items-center gap-2 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="font-bold text-lg tracking-tight">Nija<span className="text-cyan-400 font-light">Warrior</span></h1>
                    </div>

                    <nav className="space-y-2">
                        {[
                            { id: 'dash', label: 'Dashboard', icon: Boxes, active: true },
                            { id: 'token', label: 'Token Factory', icon: Layers, action: () => setActiveModal('token') },
                            { id: 'child', label: 'Child Accounts', icon: Baby, action: () => setActiveModal('child') },
                            { id: 'nft', label: 'NFTGen', icon: Globe, action: () => setActiveModal('nft') },
                            { id: 'sc', label: 'SCGen', icon: Shield, action: () => setActiveModal('sc') },
                        ].map((item: any) => (
                            <button
                                key={item.id}
                                onClick={item.action}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${item.active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium text-sm">{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="mt-10 pt-6 border-t border-white/10">
                        <button onClick={() => setActiveModal('profile')} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl text-gray-400 transition">
                            <User className="w-5 h-5" /> <span className="text-sm">Profile</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="col-span-12 lg:col-span-10 space-y-6">
                    {/* Header Bar */}
                    <div className="flex justify-between items-center bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                                <button onClick={() => setSelectedChain('ETH')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${selectedChain === 'ETH' ? 'bg-blue-600 shadow-lg text-white' : 'text-gray-400 hover:text-white'}`}>Ethereum</button>
                                <button onClick={() => setSelectedChain('SOL')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${selectedChain === 'SOL' ? 'bg-purple-600 shadow-lg text-white' : 'text-gray-400 hover:text-white'}`}>Solana</button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleStealth}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition text-sm font-bold ${stealthActive ? 'bg-green-500/20 border-green-500 text-green-400 animate-pulse' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                            >
                                <Shield className="w-4 h-4" />
                                {stealthActive ? 'ANONYMIZED (ZK)' : 'PUBLIC MODE'}
                            </button>
                            <button onClick={() => disconnect()} className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Top Row: Balance Card & Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Balance Card */}
                        <GlassCard className="col-span-1 p-8 flex flex-col justify-between relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 p-32 bg-gradient-to-br to-transparent rounded-full blur-3xl opacity-40 transition-colors duration-700 ${selectedChain === 'ETH' ? 'from-cyan-500' : 'from-purple-500'}`} />

                            <div>
                                <h3 className="text-sm text-gray-400 font-medium tracking-wider mb-1 flex items-center justify-between">
                                    AVAILABLE ASSETS
                                    <button onClick={() => setPrivacyRevealed(!privacyRevealed)} className="hover:text-white"><Eye className="w-4 h-4" /></button>
                                </h3>
                                <div className="text-5xl font-bold text-white tracking-tight mb-2 truncate">
                                    {stealthActive ? 'HIDDEN' : (showBalance ? `${rawBalance}` : '****')}
                                    <span className="text-base text-gray-500 ml-2 font-normal">{currentSymbol}</span>
                                </div>
                                <div className="text-xs font-mono text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded w-fit border border-cyan-500/20">
                                    {stealthActive ? '0xzk...masked' : (currentAddress?.slice(0, 12) + '...')}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <AnimatedButton onClick={() => setModalVisible(true)} className="bg-white/10 border-white/10 hover:bg-white/20">
                                    <Send className="w-4 h-4" /> Transfer
                                </AnimatedButton>
                                <AnimatedButton className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 border-none">
                                    <CreditCard className="w-4 h-4" /> Buy Crypto
                                </AnimatedButton>
                            </div>
                        </GlassCard>

                        {/* Chart */}
                        <div className="col-span-1 lg:col-span-2 h-[400px]">
                            <CryptoChart symbol={currentSymbol} />
                        </div>
                    </div>

                    {/* Bottom Row: Activity Table */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-400" /> On-Chain Activity
                        </h3>
                        {/* Table Header */}
                        <div className="grid grid-cols-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-4">
                            <div>Type</div>
                            <div>Hash</div>
                            <div>Asset</div>
                            <div className="text-right">Amount</div>
                        </div>

                        <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {activity.length === 0 ? (
                                <div className="text-center py-8 text-gray-600 italic">No transactions found on this network.</div>
                            ) : activity.map((tx: any) => (
                                <div key={tx.id} className="grid grid-cols-4 items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition text-sm">
                                    <div className={tx.category === 'IN' ? 'text-green-400' : 'text-red-400'}>{tx.category}</div>
                                    <div className="font-mono text-gray-400 truncate pr-4">{tx.hash}</div>
                                    <div>{tx.asset || currentSymbol}</div>
                                    <div className="text-right font-bold">{tx.value}</div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </main>
            </div>

            {/* Modals and Overlays */}
            <TransactionModal
                visible={modalVisible}
                setVisible={setModalVisible}
                type={selectedChain}
                parentalControlEnabled={parentalSettings?.enabled}
                ethPrice={2500}
                solPrice={150}
                onTransactionComplete={async (r, a) => { await handleTransactionComplete(r, a); }}
            />

            <TokenFactoryModal isOpen={activeModal === 'token'} onClose={() => setActiveModal(null)} />
            <ChildAccountModal isOpen={activeModal === 'child'} onClose={() => setActiveModal(null)} />
            <ProfileModal isOpen={activeModal === 'profile'} onClose={() => setActiveModal(null)} user={userProfile} />
            <EcosystemModal
                isOpen={activeModal === 'nft' || activeModal === 'sc'}
                onClose={() => setActiveModal(null)}
                type={activeModal === 'nft' ? 'NFTGen' : 'SCGen'}
            />
        </div>
    );
};

export default Dashboard;
