import React from 'react';
import Button from './UI/Button';

interface HeaderProps {
  showParentalControl: boolean;
  onToggleParentalControl: () => void;
}

const Header: React.FC<HeaderProps> = ({ showParentalControl, onToggleParentalControl }) => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 p-4 shadow-lg z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="web3outline" onClick={() => { /* Browser Logic */ }}>
            Browser
          </Button>
          <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-2xl md:text-4xl font-bold">
            NIJA WALLET
          </h1>
        </div>
        <Button
          variant="web3outline"
          onClick={onToggleParentalControl}
          className="px-6 py-3 text-sm md:text-base bg-white bg-opacity-20 backdrop-blur-md text-white"
        >
          {showParentalControl ? "Parental Control: ON" : "Parental Control: OFF"}
        </Button>
      </div>
    </div>
  );
};

export default Header;
