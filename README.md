# 🐱 Multi-Wallet Pay-to-Unlock NFT Access System

A premium full-stack Web3 dApp built on **Stellar Soroban**, allowing users to connect multiple wallets and pay XLM to unlock exclusive NFT content.

## 🚀 Features

- **Multi-Wallet Support**: Integrated with Stellar Wallets Kit (Freighter, Albedo).
- **Dynamic Wallet Switching**: Switch between connected wallets instantly with updated access states.
- **Soroban Smart Contract**: On-chain access control logic (`pay_and_unlock`, `check_access`).
- **Real-Time Updates**: Live transaction feed with pending/success/failure states.
- **Performance Dashboard**: Real-time stats display for total value unlocked and active collectors.
- **Premium Aesthetics**: High-fidelity dark mode UI with glassmorphism, animations, and custom generated NFT art.

## 🛠 Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, Framer Motion, Lucide Icons.
- **Testing**: Vitest, React Testing Library.
- **Blockchain**: Stellar Testnet, Soroban Smart Contracts.

## 🧪 Testing

The project includes comprehensive unit tests for both the smart contract and frontend components.

### Frontend Tests
```bash
cd frontend
npm test
```
*Tests cover components like ActivityFeed and NFTCard ensuring correct state rendering and interaction.*

### Smart Contract Tests
```bash
cd contracts
cargo test
```

## 🚀 Setup & Installation

```text
/contracts   - Soroban Rust Smart Contract (lib.rs)
/frontend
  /public    - NFT images and assets
  /src
    /app     - Next.js App Router (Layout, Page)
    /components - UI components (Navbar, NFTCard, ActivityFeed)
    /hooks   - Logic for NFT state and payments
    /utils   - Stellar/Soroban configurations
```

## 📜 Smart Contract Logic

The contract `NFTAccessControl` implements:
- `pay_and_unlock(user, amount)`: Stores access status and emits events.
- `check_access(user)`: Returns boolean access state.

## 🚀 Setup & Installation

### Prerequisites
- Node.js & npm
- Freighter Wallet (browser extension)
- Rust & Soroban CLI (for contract deployment)

### Steps

1. **Clone and Install Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Deploy Contract (Optional):**
   ```bash
   cd contracts
   soroban contract build
   soroban contract deploy --network testnet --source <YOUR_ACCOUNT> --wasm target/wasm32-unknown-unknown/release/nft_access_control.wasm
   ```
   *Note: Current contract ID is a placeholder in `src/utils/stellar.ts`.*

## 📸 Screenshots

- **Wallet Connection:** Supports Freighter and Albedo.
- **Transaction Flow:** Pending animation -> Success badge -> Content Unlocked.

## 🔗 Contract Information (Placeholder)
- **Contract ID:** `CCGZ...` (Stellar Testnet)
- **Explorer:** [Stellar Expert Testnet](https://stellar.expert/explorer/testnet)

---
*Built with ❤️ for the Stellar Community.*
