'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from './WalletProvider';
import { horizonServer } from '@/utils/stellar';
import { Wallet, RefreshCcw, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WalletBalance() {
  const { activeWallet } = useWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    if (!activeWallet?.address) return;
    setLoading(true);
    try {
      const account = await horizonServer.loadAccount(activeWallet.address);
      const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
      setBalance(nativeBalance ? parseFloat(nativeBalance.balance).toFixed(2) : '0.00');
    } catch (err: any) {
      // If account doesn't exist, it means it's not funded (0 balance)
      if (err.response?.status === 404) {
        setBalance('0.00');
      } else {
        console.error('Error fetching balance:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [activeWallet?.address]);

  if (!activeWallet) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 rounded-3xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group"
    >
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors" />
      
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 shadow-inner">
              <Wallet className="text-purple-400 w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Wallet</h4>
              <p className="text-sm font-bold text-white truncate max-w-[150px]">
                {activeWallet.name}
              </p>
            </div>
          </div>
          <button 
            onClick={fetchBalance}
            disabled={loading}
            className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCcw size={14} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-white tracking-tight">
              {balance ?? '---'}
            </span>
            <span className="text-lg font-bold text-purple-400 mb-1">XLM</span>
          </div>
          <p className="text-[10px] text-gray-500 font-mono truncate">
            {activeWallet.address}
          </p>
        </div>

        <div className="pt-2 flex gap-2">
          <a
            href={`https://stellar.expert/explorer/testnet/account/${activeWallet.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2 text-[10px] font-bold text-gray-300 uppercase tracking-tighter"
          >
            Explorer <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
