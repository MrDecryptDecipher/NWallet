import { useState } from 'react';
import { useParentalControl } from '../contexts/ParentalControlContext';
import { toast } from 'react-toastify';
import { formatEther, parseEther } from 'ethers';

interface TransactionParams {
  to: string;
  value: string;
  tokenAddress?: string;
}

export function useTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const { isTransactionAllowed } = useParentalControl();

  const sendTransaction = async ({ to, value, tokenAddress }: TransactionParams) => {
    try {
      setIsLoading(true);

      // Convert value to a number for parental control checks
      const valueInEth = parseFloat(formatEther(parseEther(value)));

      // Check if the transaction is allowed by parental controls
      const isAllowed = await isTransactionAllowed(to, valueInEth, tokenAddress);
      if (!isAllowed) {
        throw new Error('Transaction blocked by parental controls');
      }

      // Proceed with the transaction if allowed
      // ... existing transaction code ...

      toast.success('Transaction submitted successfully');
    } catch (error) {
      console.error('Transaction failed:', error);
      toast.error(error instanceof Error ? error.message : 'Transaction failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendTransaction,
    isLoading,
  };
} 