'use client'; 

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  StellarWalletsKit,
  Networks,
} from '@creit.tech/stellar-wallets-kit';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { FreighterModule, FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit/modules/freighter';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Wallet {
  address: string;
  name: string;
  id: string;
}

interface WalletContextType {
  wallets: Wallet[];
  activeWallet: Wallet | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchWallet: (address: string) => void;
  kit: typeof StellarWalletsKit | null;
}

// ─── Context ───────────────────────────────────────────────────────────────
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────────────────
export function WalletProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<Wallet | null>(null);

  // Initialize Stellar Wallets Kit on mount (client-side only)
  useEffect(() => {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: [
        new FreighterModule(),
        new AlbedoModule(),
      ],
    });
    setIsInitialized(true);
  }, []);

  /**
   * Open the wallet selection modal and connect.
   * Handles: wallet not installed, user cancelled, connection error.
   */
  const connect = async () => {
    if (!isInitialized) return;

    try {
      // Open the built-in wallet picker modal
      const { address } = await StellarWalletsKit.authModal();
      
      // Get the selected module to find its name and ID
      const module = StellarWalletsKit.selectedModule;
      const walletName = module.productName || 'Connected Wallet';
      const walletId = module.productId;

      const newWallet: Wallet = { 
        address, 
        name: walletName,
        id: walletId
      };

      // Add to wallets list if not already present
      setWallets(prev => {
        if (prev.find(w => w.address === address)) return prev;
        return [...prev, newWallet];
      });
      setActiveWallet(newWallet);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // User closed the modal — not a real error
      if (msg.includes('closed') || msg.includes('cancel')) return;
      console.warn('Connection warning:', e);
    }
  };

  /** Disconnect all wallets */
  const disconnect = () => {
    StellarWalletsKit.disconnect();
    setWallets([]);
    setActiveWallet(null);
  };

  /** Switch the active wallet to a previously connected address */
  const switchWallet = (address: string) => {
    const found = wallets.find(w => w.address === address);
    if (found) {
      StellarWalletsKit.setWallet(found.id);
      setActiveWallet(found);
    }
  };

  return (
    <WalletContext.Provider value={{ wallets, activeWallet, connect, disconnect, switchWallet, kit: StellarWalletsKit }}>
      {children}
    </WalletContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
