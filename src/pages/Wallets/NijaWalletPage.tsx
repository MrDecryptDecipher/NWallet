import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AccountBalanceWallet as WalletIcon,
  SwapHoriz as TransactionIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { getWalletState } from '../../walletConnection';
import { ethers } from 'ethers';

interface NijaWalletPageProps {
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  isConnecting: boolean;
  error: Error | null;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
}

const NijaWalletPage: React.FC<NijaWalletPageProps> = ({
  onConnect,
  onDisconnect,
  isConnecting,
  error
}) => {
  const theme = useTheme();
  const walletState = getWalletState();
  const [balance, setBalance] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (walletState.provider && walletState.address) {
        try {
          setIsLoadingBalance(true);
          const balance = await walletState.provider.getBalance(walletState.address);
          setBalance(ethers.formatEther(balance));
        } catch (err) {
          console.error('Error fetching balance:', err);
        } finally {
          setIsLoadingBalance(false);
        }
      } else {
        setBalance(null);
      }
    };

    fetchBalance();
  }, [walletState.provider, walletState.address]);

  // Mock transaction data for demonstration
  useEffect(() => {
    if (walletState.address) {
      setTransactions([
        {
          hash: '0x123...abc',
          from: walletState.address,
          to: '0x456...def',
          value: '0.1',
          timestamp: Date.now() - 3600000,
          status: 'success'
        },
        {
          hash: '0x789...ghi',
          from: '0x789...jkl',
          to: walletState.address,
          value: '0.05',
          timestamp: Date.now() - 7200000,
          status: 'success'
        }
      ]);
    } else {
      setTransactions([]);
    }
  }, [walletState.address]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Paper
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Nija Wallet
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            <AlertTitle>Error</AlertTitle>
            {error.message}
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            alignItems: 'center',
          }}
        >
          {walletState.address ? (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                }}
              >
                <WalletIcon color="primary" />
                <Typography variant="body1">
                  {formatAddress(walletState.address)}
                </Typography>
                <Chip
                  label={`Chain ID: ${walletState.chainId}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>

              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Balance
                </Typography>
                {isLoadingBalance ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography variant="h4">
                    {balance ? `${balance} ETH` : '---'}
                  </Typography>
                )}
              </Box>

              <Button
                variant="contained"
                color="secondary"
                onClick={onDisconnect}
                disabled={isConnecting}
                sx={{ minWidth: 200 }}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={onConnect}
              disabled={isConnecting}
              sx={{ minWidth: 200 }}
            >
              {isConnecting ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          )}
        </Box>
      </Paper>

      {walletState.address && transactions.length > 0 && (
        <Paper
          sx={{
            p: 3,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
          <List>
            {transactions.map((tx, index) => (
              <React.Fragment key={tx.hash}>
                <ListItem>
                  <ListItemIcon>
                    <TransactionIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {tx.from === walletState.address ? 'Sent' : 'Received'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {tx.value} ETH
                        </Typography>
                        {tx.status === 'success' ? (
                          <SuccessIcon color="success" fontSize="small" />
                        ) : tx.status === 'failed' ? (
                          <ErrorIcon color="error" fontSize="small" />
                        ) : null}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="textSecondary">
                        {formatTimestamp(tx.timestamp)}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < transactions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default NijaWalletPage;
