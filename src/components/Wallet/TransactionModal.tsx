import React, { useState, useEffect } from 'react';
import { useParental } from '../../contexts/ParentalContext';
import { Button } from '../../components/UI';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { 
  Keypair, 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL, 
  Transaction, 
  SystemProgram 
} from '@solana/web3.js';

interface TransactionModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  type: 'ETH' | 'SOL';  // Changed from 'chain' to 'type' for consistency
  parentalControlEnabled: boolean;
  ethPrice: number | null;
  solPrice: number | null;
  onTransactionComplete: (recipient: string, amount: string) => Promise<void>;
}

interface TransactionStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  txHash?: string;
  explorerUrl?: string;
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
  const { settings, checkTransaction } = useParental();
  const [isParentalControlActive, setParentalControlActive] = useState(false);
  const [formData, setFormData] = useState({
    recipient: '',
    amount: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    status: 'idle'
  });

  useEffect(() => {
    setParentalControlActive(settings.enabled);
  }, [settings.enabled]);

  const validateAddress = (address: string): boolean => {
    try {
      if (type === 'ETH') {
        return ethers.isAddress(address);
      } else {
        new PublicKey(address);
        return true;
      }
    } catch {
      return false;
    }
  };

  const calculateTransactionFee = async (recipient: string, amount: string): Promise<string> => {
    try {
      if (type === 'ETH') {
        const provider = new ethers.JsonRpcProvider(
          parentalControlEnabled 
            ? 'https://eth-sepolia.g.alchemy.com/v2/gRcliAnQ2ysaJacOBBlOCd7eT9NxGLd0'
            : 'https://eth-mainnet.g.alchemy.com/v2/gRcliAnQ2ysaJacOBBlOCd7eT9NxGLd0'
        );
        const feeData = await provider.getFeeData();
        if (!feeData?.maxFeePerGas) {
          console.error('ETH fee data unavailable');
          return '0';
        }
        const gasLimit = BigInt(21000);
        const gasCost = feeData.maxFeePerGas * gasLimit;
        return ethers.formatEther(gasCost);
      } else {
        const connection = new Connection(
          parentalControlEnabled
            ? 'https://solana-devnet.g.alchemy.com/v2/gRcliAnQ2ysaJacOBBlOCd7eT9NxGLd0'
            : 'https://solana-mainnet.g.alchemy.com/v2/gRcliAnQ2ysaJacOBBlOCd7eT9NxGLd0'
        );
        const prioritizationFees = await connection.getRecentPrioritizationFees();
        return (prioritizationFees[0]?.prioritizationFee ?? 5000).toString();
      }
    } catch (error) {
      console.error('Error calculating fee:', error);
      return '0';
    }
  };

  const isValidAmount = (): boolean => {
    const amount = parseFloat(formData.amount);
    return !isNaN(amount) && amount > 0;
  };

  const validateTransaction = async (): Promise<boolean> => {
    if (!validateAddress(formData.recipient)) {
      setValidationError('Invalid recipient address');
      return false;
    }

    if (!isValidAmount()) {
      setValidationError('Invalid amount');
      return false;
    }

    if (isParentalControlActive) {
      const amountUSD = parseFloat(formData.amount) * 
        (type === 'ETH' ? ethPrice || 0 : solPrice || 0);
      const result = checkTransaction(amountUSD, formData.recipient);
      if (!result.allowed) {
        setValidationError(result.reason ?? 'Transaction not allowed by parental controls');
        return false;
      }
    }

    try {
      if (type === 'SOL') {
        const connection = new Connection(
          parentalControlEnabled
            ? 'https://solana-devnet.g.alchemy.com/v2/gRcliAnQ2ysaJacOBBlOCd7eT9NxGLd0'
            : 'https://solana-mainnet.g.alchemy.com/v2/gRcliAnQ2ysaJacOBBlOCd7eT9NxGLd0'
        );
        const recipientPubkey = new PublicKey(formData.recipient);
        await connection.getAccountInfo(recipientPubkey);
      }
    } catch (error) {
      setValidationError('Invalid recipient account');
      return false;
    }

    const fee = await calculateTransactionFee(formData.recipient, formData.amount);
    console.log('Estimated transaction fee:', fee);

    setValidationError(null);
    return true;
  };

  const handleSend = async () => {
    const isValid = await validateTransaction();
    if (!isValid) return;

    setIsLoading(true);
    setTransactionStatus({ status: 'pending' });
    try {
      await onTransactionComplete(formData.recipient, formData.amount);
      setTransactionStatus({
        status: 'success',
        txHash: 'txHashPlaceholder',
        explorerUrl: type === 'ETH'
          ? `https://${parentalControlEnabled ? 'sepolia.' : ''}etherscan.io/tx/txHashPlaceholder`
          : `https://solscan.io/tx/txHashPlaceholder?cluster=${parentalControlEnabled ? 'devnet' : 'mainnet'}`
      });
      toast.success('Transaction successful');
      setFormData({ recipient: '', amount: '' });
    } catch (error) {
      console.error('Transaction error:', error);
      setTransactionStatus({ status: 'error' });
      toast.error('Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (transactionStatus.status) {
      case 'pending': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-white';
    }
  };

  return (
    visible ? (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-purple-900/50 to-slate-900/50 rounded-lg p-8 max-w-md w-full border border-white/10 shadow-lg">
          <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-2xl font-bold mb-6">
            Send {type}
          </h2>
          
          <div className="space-y-4">
            <input
              type="text"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              placeholder="Recipient Address"
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              disabled={isLoading}
            />
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Amount"
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              disabled={isLoading}
            />
            
            {transactionStatus.status !== 'idle' && (
              <div className={`${getStatusColor()} text-sm`}>
                {transactionStatus.status === 'pending' && 'Processing transaction...'}
                {transactionStatus.status === 'success' && (
                  <div>
                    Transaction successful!{' '}
                    <a
                      href={transactionStatus.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-purple-300"
                    >
                      View on {type === 'ETH' ? 'Etherscan' : 'Solscan'}
                    </a>
                  </div>
                )}
                {transactionStatus.status === 'error' && 'Transaction failed'}
              </div>
            )}

            {validationError && (
              <p className="text-red-400 text-sm" role="alert">
                {validationError}
              </p>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => setVisible(false)}
                variant="ghost"
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                variant="web3"
                disabled={
                  isLoading || 
                  validationError !== null || 
                  !isValidAmount() ||
                  !formData.recipient
                }
                className="flex-1"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    ) : null
  );
};

export default TransactionModal;