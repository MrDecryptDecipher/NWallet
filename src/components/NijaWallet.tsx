import { useWallet } from '../contexts/WalletContext';

const NijaWallet = () => {
  const { ethAddress, chainId } = useWallet();
  
  const handleNFTGenClick = () => {
    // Create a session with wallet data
    const sessionData = {
      address: ethAddress,
      chainId: chainId?.toString(16),
      timestamp: Date.now()
    };
    
    // Store session in localStorage
    localStorage.setItem('nija_wallet_session', JSON.stringify(sessionData));
    
    // Open NFTGen with session parameter
    const sessionParam = encodeURIComponent(JSON.stringify(sessionData));
    window.open(`http://3.111.22.56:5175?session=${sessionParam}`, '_blank');
  };

  // ... rest of the component code ...
}; 