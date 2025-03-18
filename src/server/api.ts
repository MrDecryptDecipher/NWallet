import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';

const app = express();
app.use(cors());
app.use(express.json());

// API endpoints
app.get('/api/wallet-info', (req, res) => {
  try {
    const ethereumAddress = localStorage.getItem("ethereumAddress");
    const ethereumPrivateKey = localStorage.getItem("ethereumPrivateKey");
    const network = localStorage.getItem("selectedEthNetwork") || "sepolia";
    
    if (!ethereumAddress || !ethereumPrivateKey) {
      res.status(404).json({ error: 'Wallet not initialized' });
      return;
    }

    res.json({
      ethereumAddress,
      ethereumPrivateKey,
      network
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get wallet info' });
  }
});

app.post('/api/send-transaction', async (req, res) => {
  try {
    const ethPrivateKey = localStorage.getItem("ethereumPrivateKey");
    if (!ethPrivateKey) {
      res.status(404).json({ error: 'Wallet not initialized' });
      return;
    }

    const wallet = new ethers.Wallet(ethPrivateKey);
    const tx = req.body;
    const signedTx = await wallet.signTransaction(tx);
    
    res.json({ signedTransaction: signedTx });
  } catch (error) {
    res.status(500).json({ error: 'Transaction failed' });
  }
});

// Start API server
const PORT = process.env.NIJA_WALLET_API_PORT || 5177;
app.listen(PORT, () => {
  console.log(`Nija Wallet API running on port ${PORT}`);
});

export default app; 