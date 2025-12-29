import React, { useState, useEffect } from 'react';
import { useAlchemy } from '../../context/AlchemyContext';
import { getNFTs } from '../../services/alchemy';

export const NFTGen: React.FC = () => {
  const { address } = useAlchemy();
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      setLoading(true);
      getNFTs(address)
        .then(data => setNfts(data.ownedNfts || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [address]);

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-6">NFT Gallery</h2>
      
      {!address ? (
        <p>Connect wallet to view NFTs.</p>
      ) : loading ? (
        <p>Loading...</p>
      ) : nfts.length === 0 ? (
        <p>No NFTs found on Sepolia.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {nfts.map((nft: any, i) => (
            <div key={i} className="bg-gray-800 p-4 rounded">
              {nft.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
