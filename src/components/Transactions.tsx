import React, { useState, useEffect, useMemo } from 'react';
import { formatEther } from 'ethers';
import { useNFTGenIntegration, NFTGenActivity } from '../hooks/useNFTGenIntegration';
import { shortenAddress } from '../utils/addressUtils';
import NFTTransactionModal from './NFTTransactionModal';

// Safe access to window.ethereum
const safelyAccessEthereum = (): any => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum;
  }
  return null;
};

export default function Transactions() {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showNetworkFilter, setShowNetworkFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get NFTGen activities
  const { activities: nftgenActivities, updateActivityStatus } = useNFTGenIntegration();
  
  // Fetch wallet address and transactions
  useEffect(() => {
    const fetchAddressAndTransactions = async () => {
      try {
        setLoading(true);
        // Get current wallet address from localStorage or provider
        const ethereum = safelyAccessEthereum();
        const currentAddress = localStorage.getItem('walletAddress') || ethereum?.selectedAddress;
        if (currentAddress) {
          setAddress(currentAddress);
          // Fetch transactions from API or provider history
          const txHistory = await fetchTransactionHistory(currentAddress);
          setTransactions(txHistory);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAddressAndTransactions();
    
    // Setup event listener for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        fetchAddressAndTransactions();
      } else {
        setAddress(null);
        setTransactions([]);
      }
    };
    
    // Safely add ethereum event listener
    const ethereum = safelyAccessEthereum();
    if (ethereum && typeof ethereum.on === 'function') {
      ethereum.on('accountsChanged', handleAccountsChanged);
    }
    
    return () => {
      // Safely remove ethereum event listener
      if (ethereum && typeof ethereum.removeListener === 'function') {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);
  
  // Mock function to fetch transaction history
  // In a real app, this would call your backend API or chain provider
  const fetchTransactionHistory = async (walletAddress: string): Promise<any[]> => {
    // This is a placeholder - in a real app you would fetch real transaction data
    return [
      {
        id: '1',
        type: 'sent',
        status: 'confirmed',
        timestamp: Date.now() - 3600000, // 1 hour ago
        hash: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
        from: walletAddress,
        to: '0xabcdef123456789abcdef123456789abcdef1234',
        value: '1000000000000000000', // 1 ETH
        gasUsed: '21000',
        gasPrice: '20000000000',
        fee: '420000000000000',
        network: 'mainnet'
      },
      {
        id: '2',
        type: 'received',
        status: 'confirmed',
        timestamp: Date.now() - 86400000, // 1 day ago
        hash: '0xabcdef123456789abcdef123456789abcdef123456789abcdef123456789abcd',
        from: '0xfedcba9876543210fedcba9876543210fedcba98',
        to: walletAddress,
        value: '500000000000000000', // 0.5 ETH
        gasUsed: '21000',
        gasPrice: '20000000000',
        fee: '420000000000000',
        network: 'mainnet'
      },
      {
        id: '3',
        type: 'sent',
        status: 'pending',
        timestamp: Date.now() - 1800000, // 30 minutes ago
        hash: '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef',
        from: walletAddress,
        to: '0x1234567890abcdef1234567890abcdef12345678',
        value: '250000000000000000', // 0.25 ETH
        gasUsed: '21000',
        gasPrice: '25000000000',
        fee: '525000000000000',
        network: 'sepolia'
      }
    ];
  };
  
  // Apply filters to transactions whenever filter criteria or transactions change
  useEffect(() => {
    const applyFilters = () => {
      const filtered = transactions.filter(tx => {
        // Apply network filter
        if (networkName !== 'all' && tx.network && tx.network !== networkName) {
          return false;
        }
        
        // Apply type filter
        if (typeFilter === 'sent' && tx.type !== 'sent') {
          return false;
        }
        if (typeFilter === 'received' && tx.type !== 'received') {
          return false;
        }
        // NFT filter will be applied at the combined transaction level
        
        return true;
      });
      
      setFilteredTransactions(filtered);
    };
    
    applyFilters();
  }, [transactions, networkName, typeFilter]);

  // Combine regular transactions with NFTGen activities
  const allTransactions = useMemo(() => {
    const combinedTransactions = [...transactions];
    
    // Convert NFTGen activities to the transaction format
    const nftgenTransactions = nftgenActivities.map(activity => ({
      id: activity.hash,
      type: activity.type,
      status: activity.status,
      timestamp: activity.timestamp,
      hash: activity.hash,
      from: address || 'Unknown', // Use connected wallet address
      to: '0x0000000000000000000000000000000000000000', // NFT Contract
      value: '0',
      gasUsed: '0',
      gasPrice: '0',
      fee: '0',
      isNFTGenActivity: true,
      nftData: {
        name: activity.details.name,
        imageUrl: activity.details.asset.imageUrl,
        metadataUrl: activity.details.asset.metadataUrl,
        fractions: activity.details.fractions,
        royaltyFee: activity.details.royaltyFee
      }
    }));
    
    // Add NFTGen transactions to the list
    combinedTransactions.push(...nftgenTransactions);
    
    // Sort all transactions by timestamp (newest first)
    return combinedTransactions.sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, nftgenActivities, address]);

  const handleTransactionClick = (tx: any) => {
    if (tx.isNFTGenActivity) {
      setSelectedTransaction(tx);
      setIsModalOpen(true);
    }
  };

  const renderTransactionRow = (tx: any) => {
    const isPending = tx.status === 'pending';
    const isFailed = tx.status === 'failed';
    const isNFTGenActivity = tx.isNFTGenActivity === true;
    
    // Format transaction type more user-friendly
    const formatTransactionType = (type: string) => {
      if (isNFTGenActivity) {
        switch (type) {
          case 'mint': return 'NFT Mint';
          case 'transfer': return 'NFT Transfer';
          case 'fractionalize': return 'NFT Fractionalize';
          case 'sell': return 'NFT Sale';
          case 'buy': return 'NFT Purchase';
          default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
      }
      
      // Default formatting for regular transactions
      return type === 'received' ? 'Received' : 'Sent';
    };
    
    return (
      <div 
        key={tx.id} 
        className={`p-4 border-b border-gray-700 ${isPending ? 'bg-opacity-20 bg-yellow-900' : isFailed ? 'bg-opacity-20 bg-red-900' : ''} 
                    ${isNFTGenActivity ? 'cursor-pointer hover:bg-gray-700' : ''}`}
        onClick={() => isNFTGenActivity && handleTransactionClick(tx)}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            {isPending && (
              <span className="flex h-4 w-4">
                <span className="animate-ping absolute h-4 w-4 rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
            )}
            {isFailed && (
              <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
              </svg>
            )}
            <span className="font-medium">{formatTransactionType(tx.type)}</span>
            {isNFTGenActivity && tx.nftData && (
              <span className="text-sm text-purple-400 ml-2">
                {tx.nftData.name}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            {new Date(tx.timestamp).toLocaleString()}
          </div>
        </div>
        
        {/* Transaction details */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
          <div>
            <span className="text-gray-400">From: </span>
            <span className="text-gray-200 font-mono text-xs">{shortenAddress(tx.from)}</span>
          </div>
          <div>
            <span className="text-gray-400">To: </span>
            <span className="text-gray-200 font-mono text-xs">{shortenAddress(tx.to)}</span>
          </div>
        </div>
        
        {/* Value and status */}
        <div className="flex justify-between items-center">
          {isNFTGenActivity ? (
            <div className="flex items-center">
              {/* NFT image thumbnail if available */}
              {tx.nftData && tx.nftData.imageUrl && (
                <div className="h-8 w-8 mr-2 overflow-hidden rounded-md">
                  <img 
                    src={tx.nftData.imageUrl.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/')} 
                    alt={tx.nftData.name || 'NFT'} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/32?text=NFT';
                    }}
                  />
                </div>
              )}
              <div>
                {tx.nftData && (
                  <div className="text-xs text-gray-400">
                    {tx.nftData.fractions > 1 ? `${tx.nftData.fractions} fractions` : 'Single token'} 
                    {tx.nftData.royaltyFee > 0 ? ` • ${tx.nftData.royaltyFee}% royalty` : ''}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`font-medium ${tx.type === 'received' ? 'text-green-400' : 'text-red-400'}`}>
              {tx.type === 'received' ? '+' : '-'} {formatEther(tx.value)} ETH
            </div>
          )}
          
          <div className="flex space-x-2 items-center">
            {/* Status indicator */}
            <span className={`px-2 py-1 rounded-full text-xs ${
              isPending ? 'bg-yellow-900 text-yellow-200' : 
              isFailed ? 'bg-red-900 text-red-200' : 
              'bg-green-900 text-green-200'
            }`}>
              {isPending ? 'Pending' : isFailed ? 'Failed' : 'Confirmed'}
            </span>
            
            {/* Link to block explorer */}
            <a 
              href={`https://${networkName === 'mainnet' ? '' : networkName + '.'}etherscan.io/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
              onClick={(e) => e.stopPropagation()} // Prevent row click from triggering
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
            </a>
          </div>
        </div>
        
        {/* Manual confirmation for pending NFTGen transactions (for demo/testing) */}
        {isNFTGenActivity && isPending && (
          <div className="mt-2 flex justify-end space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click from triggering
                updateActivityStatus(tx.hash, 'confirmed');
              }}
              className="px-2 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-xs"
            >
              Mark as Confirmed
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click from triggering
                updateActivityStatus(tx.hash, 'failed');
              }}
              className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs"
            >
              Mark as Failed
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="transaction-list max-h-full overflow-y-auto rounded-lg bg-gray-800 border border-gray-700">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Transactions</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowNetworkFilter(!showNetworkFilter)}
            className="text-sm px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 transition text-white"
          >
            {networkName === 'all' ? 'All Networks' : networkName.charAt(0).toUpperCase() + networkName.slice(1)}
          </button>
          
          <button 
            onClick={() => setShowTypeFilter(!showTypeFilter)}
            className="text-sm px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 transition text-white"
          >
            {typeFilter === 'all' ? 'All Types' : 
             typeFilter === 'sent' ? 'Sent' :
             typeFilter === 'received' ? 'Received' : 
             typeFilter === 'nft' ? 'NFTs' : 'Custom'
            }
          </button>
        </div>
        
        {/* Network filter dropdown */}
        {showNetworkFilter && (
          <div className="absolute right-4 mt-32 w-48 rounded-md shadow-lg bg-gray-700 ring-1 ring-gray-600 z-50">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <button 
                onClick={() => { setNetworkName('all'); setShowNetworkFilter(false); }}
                className="block px-4 py-2 text-sm text-white hover:bg-gray-600 w-full text-left"
              >
                All Networks
              </button>
              <button 
                onClick={() => { setNetworkName('mainnet'); setShowNetworkFilter(false); }}
                className="block px-4 py-2 text-sm text-white hover:bg-gray-600 w-full text-left"
              >
                Mainnet
              </button>
              <button 
                onClick={() => { setNetworkName('sepolia'); setShowNetworkFilter(false); }}
                className="block px-4 py-2 text-sm text-white hover:bg-gray-600 w-full text-left"
              >
                Sepolia
              </button>
            </div>
          </div>
        )}
        
        {/* Type filter dropdown */}
        {showTypeFilter && (
          <div className="absolute right-4 mt-32 w-48 rounded-md shadow-lg bg-gray-700 ring-1 ring-gray-600 z-50">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <button 
                onClick={() => { setTypeFilter('all'); setShowTypeFilter(false); }}
                className="block px-4 py-2 text-sm text-white hover:bg-gray-600 w-full text-left"
              >
                All Types
              </button>
              <button 
                onClick={() => { setTypeFilter('sent'); setShowTypeFilter(false); }}
                className="block px-4 py-2 text-sm text-white hover:bg-gray-600 w-full text-left"
              >
                Sent
              </button>
              <button 
                onClick={() => { setTypeFilter('received'); setShowTypeFilter(false); }}
                className="block px-4 py-2 text-sm text-white hover:bg-gray-600 w-full text-left"
              >
                Received
              </button>
              <button 
                onClick={() => { setTypeFilter('nft'); setShowTypeFilter(false); }}
                className="block px-4 py-2 text-sm text-white hover:bg-gray-600 w-full text-left"
              >
                NFTs
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Filter transactions for display */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : allTransactions.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 text-gray-400">
          <svg className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No transactions found</p>
          <p className="text-sm mt-2">
            {address ? 'Try different filters or networks' : 'Connect your wallet to view transactions'}
          </p>
        </div>
      ) : (
        <div>
          {allTransactions
            .filter(tx => {
              // Apply network filter
              if (networkName !== 'all' && tx.network && tx.network !== networkName) {
                return false;
              }
              
              // Apply type filter
              if (typeFilter === 'sent' && tx.type !== 'sent') {
                return false;
              }
              if (typeFilter === 'received' && tx.type !== 'received') {
                return false;
              }
              if (typeFilter === 'nft' && !tx.isNFTGenActivity) {
                return false;
              }
              
              return true;
            })
            .map(renderTransactionRow)
          }
        </div>
      )}
      
      {/* NFT Transaction Modal */}
      <NFTTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        txData={selectedTransaction}
      />
    </div>
  );
} 