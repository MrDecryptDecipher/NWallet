import React from 'react';
import Button from './UI/Button';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useTheme } from '../contexts/ThemeContext';
import { useConnect } from 'wagmi';
import { CodeIcon } from '@heroicons/react/24/outline'

interface HeaderProps {
  showParentalControl: boolean;
  onToggleParentalControl: () => void;
}

const Header: React.FC<HeaderProps> = ({ showParentalControl, onToggleParentalControl }) => {
  const { open } = useWeb3Modal();
  const { toggleTheme } = useTheme();
  const { connect, connectors, isConnected } = useConnect();

  const handleNFTGenClick = async () => {
    if (!isConnected) {
      open(); // Open Web3Modal to connect
    }
    // Assuming the first connector is the one the user chose
    window.open('https://nftgenrtr.surge.sh/', '_blank');
  };

  return (
    <div className="fixed top-0 left-0 right-0  p-4 shadow-lg z-50 dark:bg-background bg-gradient-to-r from-purple-500 to-pink-500">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="web3outline" onClick={() => { /* Browser Logic */ }}>
            Browser
          </Button>
          <Button variant="web3outline"  onClick={() => window.open('https://scgen.surge.sh/', '_blank')}>
            SCGen
          </Button>
          <Button variant="web3outline" onClick={handleNFTGenClick}>
            NFTGen
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="web3outline"
            onClick={toggleTheme}
            className="px-6 py-3 text-sm md:text-base bg-white bg-opacity-20 backdrop-blur-md text-white"
          >
            Toggle Theme
          </Button>
          <Button
            variant="web3outline"
            onClick={() => open()}
            className="px-6 py-3 text-sm md:text-base bg-white bg-opacity-20 backdrop-blur-md text-white"
          >
            Connect Wallet
          </Button>
          <Button
            variant="web3outline"
            onClick={onToggleParentalControl}
            className="px-6 py-3 text-sm md:text-base bg-white bg-opacity-20 backdrop-blur-md text-white"
          >
            {showParentalControl ? "Parental Control: ON" : "Parental Control: OFF"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Header;