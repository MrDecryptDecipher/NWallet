# 👛 Nija Wallet - Multi-Chain Custodian Wallet

<div align="center">
  <img src="public/logo.png" alt="Nija Wallet Logo" width="200"/>
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.0.7-purple.svg)](https://vitejs.dev/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.0-38B2AC.svg)](https://tailwindcss.com/)
  [![Ethereum](https://img.shields.io/badge/Ethereum-1.21.4-627EEA.svg)](https://ethereum.org/)
  [![Solana](https://img.shields.io/badge/Solana-1.87.6-9945FF.svg)](https://solana.com/)
</div>

## 🌟 Overview

Nija Wallet is a secure, multi-chain custodian wallet that supports both Ethereum and Solana networks. Built with a focus on security and user experience, it provides a comprehensive solution for managing digital assets across multiple blockchain networks. The wallet features parental controls and advanced security measures to ensure safe and controlled access to digital assets.

## ✨ Features

- 💼 **Multi-Chain Support**
  - Ethereum (Mainnet & Sepolia)
  - Solana (Mainnet & Devnet)
- 🔒 **Advanced Security**
  - Parental Controls
  - Transaction Limits
  - Spending Restrictions
- 📱 **3D Interactive Interface**
- 💰 **Portfolio Management**
- 📊 **Real-time Price Charts**
- 🔄 **Transaction History**
- 📲 **QR Code Support**
- 🔐 **Secure Key Management**
- 🌐 **Web3 Integration**
- 📱 **Responsive Design**

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Web3 wallet (MetaMask, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nwallet.git
cd nwallet
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
VITE_SOLANA_RPC_URL=your_solana_rpc_url
VITE_WS_URL=your_websocket_url
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Query
- **Blockchain Integration**: 
  - ethers.js
  - @solana/web3.js
  - wagmi
  - viem
- **3D Graphics**: Three.js
- **Charts**: Chart.js
- **UI Components**: Material-UI
- **Type Safety**: TypeScript

## 📁 Project Structure

```
nwallet/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API and blockchain services
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   └── assets/        # Static assets
├── public/            # Public assets
├── api/              # API server
└── scripts/          # Build and deployment scripts
```

## 🔧 Configuration

The application can be configured through environment variables:

- `VITE_ALCHEMY_API_KEY`: Your Alchemy API key
- `VITE_SOLANA_RPC_URL`: Your Solana RPC URL
- `VITE_WS_URL`: Your WebSocket URL
- `VITE_NETWORK`: Target network (mainnet/sepolia/devnet)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ethereum](https://ethereum.org/)
- [Solana](https://solana.com/)
- [Material-UI](https://mui.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [Three.js](https://threejs.org/)

## 📞 Support

For support, email support@nijawallet.com or join our Discord channel.

---

<div align="center">
  Made with ❤️ by the Nija Wallet Team
</div> 