<div align="center">

# 🌌 Nija Wallet
### The Quantum-Ready, Multi-Chain AI Wallet Architecture

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-blue.svg)](https://reactjs.org/)
[![Solana](https://img.shields.io/badge/Solana-Web3.js-purple.svg)](https://solana.com/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Ethers.js-gray.svg)](https://ethereum.org/)
[![ZK-Proof](https://img.shields.io/badge/Privacy-ZK--Snark-green.svg)]()

*Built single-handedly by **Sandeep Kumar Sahoo**, Architect of Nija, NFTGen, SCGen, and DIIA.*

[Features](#features) • [Architecture](#architecture) • [Mathematical Proofs](#mathematical-proofs) • [Installation](#installation) • [Ecosystem](#ecosystem)

</div>

---

## 🚀 Vision

Nija Wallet is not just a cryptocurrency wallet; it is a **Quantum-Resistant**, **Recursively-Derived**, **Multi-Chain Financial OS**. Designed to integrate seamlessly with the Nija Ecosystem (NFTGen, SCGen, DIIA), it leverages Account Abstraction (ERC-4337) and Zero-Knowledge principles to offer unparalleled privacy and parental oversight.

## 💎 Core Features

*   **🌌 Holographic UI**: Immersive Three.js "Interactive Galaxy" background with mouse-tracking parallax.
*   **🛡️ ZK Stealth Mode**: One-click address anonymization using simulated Zero-Knowledge Mixers.
*   **👨‍👩‍👧 Recursive Parental Control**: Create infinite depth child accounts ($Parent \to Child \to Grandchild \dots$) with granular spending limits.
*   **🏭 Universal Token Factory**: GUI-based deployment of ERC-20 (ETH) and SPL Tokens (Solana).
*   **📈 Advanced Charting**: Integrated TradingView-style technical analysis engine (`lightweight-charts`) with dark mode.
*   **🌉 Ecosystem Bridge**: Native integration points for **SCGen** (Smart Contract Generator) and **NFTGen** (NFT Generator).

---

## 🏗️ System Architecture

### 1. High-Level System Overview
```mermaid
graph TD
    User[User Interface] -->|HTTPS/WSS| Frontend[React + Vite App]
    Frontend -->|REST API| Backend[Express + Node.js Server]
    Frontend -->|RPC Calls| Blockchain[Blockchain Layer]
    
    subgraph "Backend Services"
        Backend -->|Auth| JWT[JWT Handler]
        Backend -->|Data| DB[(Prisma + SQLite)]
        Backend -->|Logs| Audit[Audit Logger]
    end
    
    subgraph "Blockchain Layer"
        Blockchain -->|EVM| Ethereum[Sepolia Network]
        Blockchain -->|SVM| Solana[Solana Devnet]
        Blockchain -->|AA| Alchemy[Alchemy Smart Accounts]
    end
```

---

## 📐 Mathematical Derivations

### Zero-Knowledge Transaction Masking (Conceptual)
The Nija Wallet implements a privacy preserver $\mathcal{P}$ such that for a transaction $T_{tx}$:

$$
\mathcal{P}(T_{tx}) \rightarrow \{ \pi, \text{Nullifier} \}
$$

Where the validity proof $\pi$ satisfies:
$$
\text{Verify}(\pi, \text{PublicInputs}) = \text{True} \iff \exists \text{Secret} \text{ s.t. } \text{Hash}(\text{Secret}) = \text{Commitment}
$$

### Recursive Account Hierarchy
The parental control system allows for $N$-depth recursion. Let $A_0$ be the Root Parent.
The set of allow-listed addresses for a child $A_n$ is defined as:
$$
\mathcal{W}(A_n) \subseteq \mathcal{W}(A_{n-1}) \cup \mathcal{L}_{local}
$$
Where $\mathcal{L}_{local}$ is the local permission set granted by $A_{n-1}$.

---

## 📊 Technical Diagrams

### 2. User Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Server
    participant DB
    
    User->>UI: Enter Credentials
    UI->>Server: POST /api/login
    Server->>DB: Find User
    DB-->>Server: User Record
    Server->>Server: Verify Hash(Password)
    Server-->>UI: JWT Token + Encrypted Mnemonic
    UI->>UI: Store Token (Session)
    UI->>User: Redirect to Dashboard
```

### 3. ZK Stealth Mode Logic
```mermaid
stateDiagram-v2
    [*] --> PublicMode
    PublicMode --> StealthMode: User Toggle
    StealthMode --> GeneratingProof: Initiate TX
    GeneratingProof --> MixerContract: Submit Proof
    MixerContract --> Relayer: Broadcast
    Relayer --> Recipient: Fund Transfer
    Recipient --> [*]
    
    note right of StealthMode
        Address is visually 
        masked in UI
    end note
```

### 4. Recursive Parental Control Structure
```mermaid
graph TD
    Root[Root Parent A0] -->|Controls| Child1[Child A1]
    Root -->|Controls| Child2[Child A2]
    Child1 -->|Controls| GrandChild1[Sub-Child A1-i]
    Child1 -->|Controls| GrandChild2[Sub-Child A1-ii]
    
    style Root fill:#f9f,stroke:#333
    style Child1 fill:#bbf,stroke:#333
    style GrandChild1 fill:#ddf,stroke:#333
```

### 5. Multi-Chain Token Factory
```mermaid
flowchart LR
    Input[Token Params] --> Switch{Chain Selection?}
    Switch -->|Ethereum| ERC20[Compiling ERC-20 Bytecode]
    Switch -->|Solana| SPL[Init SPL Token Mint]
    
    ERC20 --> DeployETH[Deploy via Viem/Ethers]
    SPL --> DeploySOL[Deploy via @solana/web3.js]
    
    DeployETH --> Log[Log to Prisma DB]
    DeploySOL --> Log
    Log --> Dashboard[Update UI]
```

### 6. Database Schema (ER Diagram)
```mermaid
erDiagram
    USER ||--o{ TOKEN_LOG : created
    USER ||--o{ USER : children
    USER {
        string id PK
        string email
        string password
        string mnemonic
        string parentId FK
        boolean isEmailVerified
    }
    TOKEN_LOG {
        string id PK
        string name
        string symbol
        string chain
        string contractAddress
    }
    AUDIT {
        string id PK
        string action
        timestamp time
    }
```

### 7. Ecosystem Integration (SCGen/NFTGen)
```mermaid
sequenceDiagram
    participant Dashboard
    participant Modal
    participant EC2_Instance
    
    Dashboard->>Modal: Open NFTGen
    Modal->>Modal: Check Requirement (16GB RAM)
    Modal->>User: Display Warning
    User->>Modal: Acknowledge
    Modal->>EC2_Instance: WebSocket Handshake (ws://localhost:5176)
    EC2_Instance-->>Dashboard: Stream Generation Status
```

### 8. Frontend Component Tree
```mermaid
graph TD
    App --> AuthProvider
    App --> AlchemyProvider
    App --> SolanaProvider
    App --> ParentalProvider
    
    ParentalProvider --> Router
    Router --> Login
    Router --> Register
    Router --> Dashboard
    
    Dashboard --> Sidebar
    Dashboard --> GlassCard
    Dashboard --> CryptoChart
    Dashboard --> InteractiveGalaxy
    Dashboard --> Modals
```

### 9. Transaction Lifecycle
```mermaid
sequenceDiagram
    participant User
    participant ParentalContext
    participant Blockchain
    
    User->>ParentalContext: Request Transfer(100 ETH)
    ParentalContext->>ParentalContext: Check Daily Limit
    alt Limit Exceeded
        ParentalContext-->>User: Block Transaction
    else Limit OK
        ParentalContext->>Blockchain: Sign & Broadcast
        Blockchain-->>User: Tx Hash
    end
```

### 10. Deployment Pipeline
```mermaid
graph LR
    Dev[Developer] -->|Push| GitHub
    GitHub -->|Hook| CI[CI/CD Pipeline]
    CI -->|Build| ViteBuild[Vite Bundle]
    CI -->|Test| Jest[Unit Tests]
    Jest -->|Pass| Deploy[Deploy to Vercel/EC2]
```

---

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/MrDecryptDecipher/NWallet.git

# Install Dependencies
npm install

# Setup Environment
cp .env.example .env

# Run Development Server
npm run dev
```

## 🌟 Acknowledgements

This entire architecture, including the Nija Wallet, and the associated **NFTGen**, **SCGen**, and **DIIA**  ecosytems, was architected and built solely by:

**Sandeep Kumar Sahoo**  
*Full Stack Blockchain Architect & Quantum Computing Researcher*

---

<div align="center">
  <p>If you find this architecture inspiring, please give it a ⭐ on GitHub!</p>
  <sub>© 2025 Nija Ecosystem. All Rights Reserved.</sub>
</div>