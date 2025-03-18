# Nija Wallet Documentation

Welcome to the Nija Wallet documentation. This directory contains comprehensive guides and troubleshooting information for the Nija Wallet application.

## Available Documentation

- [Alchemy API Integration Guide](./alchemy-guide.md) - Comprehensive guide for integrating Alchemy APIs with Nija Wallet, including wallet connectivity, transaction management, and blockchain data access.
- [Troubleshooting Guide](./troubleshooting-guide.md) - Solutions for common issues encountered when using Nija Wallet, including connection problems, transaction failures, and integration issues with NFTGen.

## Application Overview

Nija Wallet is a full-featured Ethereum wallet application that provides:

1. Secure management of cryptocurrency assets
2. Transaction creation and signing
3. NFT viewing and management
4. Multi-network support (Ethereum, Polygon, etc.)
5. Integration with NFTGen for NFT minting and management

## Getting Started

To start using Nija Wallet:

1. Ensure the Nija Wallet application is running:
   ```
   pm2 list
   ```

2. If not running, start it:
   ```
   cd /home/ubuntu/Sandeep/projects/Nwallet
   pm2 start npm --name nwallet -- run dev -- --port 5174
   pm2 save
   ```

3. Access the application at the configured port (default: 5174)

## Configuration

Nija Wallet requires the following configuration:

1. Alchemy API keys for blockchain interaction
2. Network configurations for supported blockchains
3. Security settings for key management
4. Integration settings for NFTGen

Configuration is typically stored in `.env` files. See the application source code for specific configuration options.

## Security Considerations

Nija Wallet handles sensitive cryptographic keys and financial transactions. Please follow these security best practices:

1. Never share your private keys or recovery phrases
2. Use strong, unique passwords for wallet encryption
3. Consider using hardware wallets for additional security
4. Verify all transaction details before signing
5. Be cautious of phishing attempts and only use trusted dApps

## Support

If you encounter issues not covered in the documentation, please:

1. Check the application logs:
   ```
   pm2 logs nwallet --lines 100
   ```

2. Consult the troubleshooting guide for common solutions

3. Report detailed information about your issue, including browser version, operating system, network, and exact error messages 