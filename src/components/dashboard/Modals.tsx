import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { AnimatedButton } from '../ui/AnimatedButton';
import { X, Save, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const BaseModal = ({ isOpen, onClose, title, children }: BaseModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <GlassCard className="w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        {title}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                {children}
            </GlassCard>
        </div>
    );
};

// --- Token Factory Modal ---
export const TokenFactoryModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { token: authToken } = useAuth();
    const [formData, setFormData] = useState({ name: '', symbol: '', supply: '1000000', chain: 'ETH' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Mock Deployment Delay
            await new Promise(r => setTimeout(r, 2000));

            await apiClient('/api/tokens', {
                token: authToken,
                data: { ...formData, contractAddress: '0x' + Math.random().toString(16).slice(2, 42) }
            });
            toast.success("Token Deployed Successfully!");
            onClose();
        } catch (e) {
            toast.error("Deployment Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Token Factory">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Chain</label>
                    <div className="flex gap-2">
                        {['ETH', 'SOL'].map(c => (
                            <button
                                key={c}
                                onClick={() => setFormData({ ...formData, chain: c })}
                                className={`flex-1 py-2 rounded-lg border ${formData.chain === c ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'border-white/10 hover:bg-white/5'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
                <input
                    placeholder="Token Name (e.g. Nija Coin)"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500/50"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                    placeholder="Symbol (e.g. NIJA)"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500/50"
                    value={formData.symbol}
                    onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                />
                <input
                    placeholder="Total Supply"
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500/50"
                    value={formData.supply}
                    onChange={e => setFormData({ ...formData, supply: e.target.value })}
                />
                <AnimatedButton onClick={handleSubmit} disabled={loading} className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-blue-600">
                    {loading ? 'Deploying Smart Contract...' : 'create Token'}
                </AnimatedButton>
            </div>
        </BaseModal>
    );
};

// --- Child Account Modal ---
export const ChildAccountModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { token: authToken } = useAuth();
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const handleSubmit = async () => {
        try {
            await apiClient('/api/children', { token: authToken, data: formData });
            toast.success("Child Account Created");
            onClose();
        } catch (e) {
            toast.error("Failed to create account");
        }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Create Child Account">
            <div className="space-y-4">
                <input
                    placeholder="Child Name"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-purple-500/50"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                    placeholder="Email"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-purple-500/50"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
                <input
                    placeholder="Password"
                    type="password"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-purple-500/50"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-200 flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    This account will be linked to yours recursively. The child can login independently but restricted by your policies.
                </div>
                <AnimatedButton onClick={handleSubmit} className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600">
                    Create Sub-Account
                </AnimatedButton>
            </div>
        </BaseModal>
    );
};

// --- Ecosystem Modal ---
export const EcosystemModal = ({ isOpen, onClose, type }: { isOpen: boolean, onClose: () => void, type: string }) => {
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={`${type} Integration`}>
            <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-gray-300 leading-relaxed">
                    Please ensure the ecosystem product
                    <strong className="text-white"> {type} </strong>
                    is running in an <span className="text-cyan-400">EC2 Environment</span> with at least <span className="text-cyan-400">16GB RAM</span>.
                </p>
                <div className="bg-black/40 p-4 rounded-lg text-left text-sm text-gray-400 font-mono border border-white/10">
                    &gt; Verify NGINX Ports<br />
                    &gt; Establish WebSocket Handshake<br />
                    &gt; Sync Database
                </div>
                <AnimatedButton onClick={onClose} className="w-full bg-white/10 hover:bg-white/20">
                    Acknowledge & Connect
                </AnimatedButton>
            </div>
        </BaseModal>
    );
};

// --- Profile Modal ---
export const ProfileModal = ({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: any }) => {
    const { token: authToken } = useAuth();
    const [formData, setFormData] = useState({ name: user?.name || '', phone: user?.phone || '' });

    const handleSave = async () => {
        try {
            await apiClient('/api/profile', { token: authToken, data: formData });
            toast.success("Profile Updated");
            onClose();
        } catch (e) { toast.error("Update failed"); }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="User Profile">
            <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-xl font-bold">
                        {user?.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className="text-white font-medium">{user?.email}</div>
                        <div className="text-xs text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Verified Identity
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase text-gray-500 font-bold tracking-wider">Display Name</label>
                    <input
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs uppercase text-gray-500 font-bold tracking-wider">Phone Number</label>
                    <input
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <AnimatedButton onClick={handleSave} className="w-full bg-blue-600/80 hover:bg-blue-600">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                </AnimatedButton>
            </div>
        </BaseModal>
    );
}
