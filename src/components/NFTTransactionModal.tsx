import React from 'react';

interface NFTData {
  name: string;
  imageUrl: string;
  metadataUrl: string;
  fractions: number;
  royaltyFee: number;
}

interface NFTTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  txData: {
    id: string;
    type: string;
    status: string;
    timestamp: number;
    hash: string;
    from: string;
    to: string;
    nftData?: NFTData;
  } | null;
}

const NFTTransactionModal: React.FC<NFTTransactionModalProps> = ({ isOpen, onClose, txData }) => {
  if (!isOpen || !txData || !txData.nftData) return null;

  const getNftTypeLabel = (type: string) => {
    switch (type) {
      case 'mint': return 'NFT Minted';
      case 'transfer': return 'NFT Transferred';
      case 'fractionalize': return 'NFT Fractionalized';
      case 'sell': return 'NFT Sold';
      case 'buy': return 'NFT Purchased';
      default: return 'NFT Transaction';
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600 text-yellow-100';
      case 'failed': return 'bg-red-600 text-red-100';
      case 'confirmed': return 'bg-green-600 text-green-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      case 'confirmed': return 'Confirmed';
      default: return 'Unknown';
    }
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Format the IPFS URL for display
  const formatIpfsUrl = (url: string) => {
    return url.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');
  };
  
  const handleMetadataClick = () => {
    if (txData.nftData?.metadataUrl) {
      window.open(formatIpfsUrl(txData.nftData.metadataUrl), '_blank');
    }
  };
  
  const handleViewTransaction = () => {
    const networkName = 'mainnet'; // This would ideally come from the transaction data
    const etherscanUrl = `https://${networkName === 'mainnet' ? '' : networkName + '.'}etherscan.io/tx/${txData.hash}`;
    window.open(etherscanUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        {/* Modal */}
        <div className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-xl font-medium text-gray-200">
              {getNftTypeLabel(txData.type)}
            </h3>
            <button 
              type="button" 
              className="text-gray-400 hover:text-gray-200"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="px-6 py-4">
            {/* NFT Image */}
            <div className="flex justify-center mb-4">
              <div className="h-56 w-56 rounded-lg overflow-hidden border border-gray-700">
                <img 
                  src={formatIpfsUrl(txData.nftData.imageUrl)} 
                  alt={txData.nftData.name} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/200?text=NFT+Image';
                  }}
                />
              </div>
            </div>
            
            {/* NFT Details */}
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-purple-300 text-center">{txData.nftData.name}</p>
                <div className="mt-1 flex justify-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(txData.status)}`}>
                    {getStatusLabel(txData.status)}
                  </span>
                  
                  {txData.nftData.fractions > 1 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-600 text-blue-100">
                      {txData.nftData.fractions} Fractions
                    </span>
                  )}
                  
                  {txData.nftData.royaltyFee > 0 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-600 text-purple-100">
                      {txData.nftData.royaltyFee}% Royalty
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="col-span-1 text-gray-400">Transaction:</div>
                <div className="col-span-2 text-gray-200 font-mono text-xs truncate">{txData.hash}</div>
                
                <div className="col-span-1 text-gray-400">Date:</div>
                <div className="col-span-2 text-gray-200">{formatDate(txData.timestamp)}</div>
                
                <div className="col-span-1 text-gray-400">From:</div>
                <div className="col-span-2 text-gray-200 font-mono text-xs truncate">{txData.from}</div>
                
                <div className="col-span-1 text-gray-400">To:</div>
                <div className="col-span-2 text-gray-200 font-mono text-xs truncate">{txData.to}</div>
              </div>
            </div>
          </div>
          
          {/* Footer with buttons */}
          <div className="px-6 py-4 border-t border-gray-700 flex justify-between">
            <button
              type="button"
              onClick={handleMetadataClick}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Metadata
            </button>
            
            <button
              type="button"
              onClick={handleViewTransaction}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on Etherscan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTTransactionModal; 