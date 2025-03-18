import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { networks, switchNetwork } from '../../walletConnection';

interface HeaderProps {
  isWalletConnected: boolean;
  ethAddress: string;
  onToggleParentalControl: () => void;
  showParentalControl: boolean;
}

const Header: React.FC<HeaderProps> = ({
  isWalletConnected,
  ethAddress,
  onToggleParentalControl,
  showParentalControl
}) => {
  const theme = useTheme();
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  useEffect(() => {
    const handleChainChanged = (event: CustomEvent) => {
      const chainId = event.detail.chainId;
      const network = Object.entries(networks).find(([_, config]) => config.chainId === chainId);
      if (network) {
        setSelectedNetwork(network[0]);
      }
    };

    window.addEventListener('chainChanged', handleChainChanged as EventListener);
    return () => {
      window.removeEventListener('chainChanged', handleChainChanged as EventListener);
    };
  }, []);

  const handleNetworkChange = async (event: SelectChangeEvent) => {
    const newNetwork = event.target.value as keyof typeof networks;
    try {
      setIsSwitchingNetwork(true);
      await switchNetwork(newNetwork);
      setSelectedNetwork(newNetwork);
    } catch (error) {
      console.error('Failed to switch network:', error);
      // Revert to previous selection on error
      setSelectedNetwork(selectedNetwork);
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceWalletIcon />
          <Typography variant="h6" component="div">
            Nija Wallet
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {isWalletConnected && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl
              size="small"
              sx={{
                minWidth: 120,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.87)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '& .MuiSvgIcon-root': {
                  color: 'white',
                },
              }}
            >
              <Select
                value={selectedNetwork}
                onChange={handleNetworkChange}
                displayEmpty
                sx={{ color: 'white' }}
                disabled={isSwitchingNetwork}
                IconComponent={isSwitchingNetwork ? () => <CircularProgress size={20} sx={{ mr: 1 }} /> : undefined}
              >
                {Object.entries(networks).map(([id, config]) => (
                  <MenuItem key={id} value={id}>
                    {config.chainName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography
              variant="body2"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '4px 8px',
                borderRadius: 1,
                fontSize: '0.75rem',
              }}
            >
              {ethAddress.slice(0, 6)}...{ethAddress.slice(-4)}
            </Typography>

            <IconButton
              color="inherit"
              onClick={onToggleParentalControl}
              size="small"
              sx={{
                backgroundColor: showParentalControl
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'transparent',
                '&:hover': {
                  backgroundColor: showParentalControl
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {showParentalControl ? <LockIcon /> : <LockOpenIcon />}
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header; 