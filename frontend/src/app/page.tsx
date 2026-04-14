'use client';

import Navbar from '@/components/Navbar';
import NFTCard from '@/components/NFTCard';
import ActivityFeed from '@/components/ActivityFeed';
import Stats from '@/components/Stats';
import { useNFTs } from '@/hooks/useNFTs';
import { useWallet } from '@/components/WalletProvider';
import { Shield, Sparkles, Activity as ActivityIcon, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { nfts, activities, unlockingId, unlockNFT, listNFT, buyNFT, view, setView } = useNFTs();
  const { activeWallet } = useWallet();

  return (
    <main className="min-h-screen pt-28 pb-20 px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] -z-10 rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 blur-[120px] -z-10 rounded-full" />

      <Navbar />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Info & NFTs */}
        <div className="lg:col-span-8 space-y-12">
          {/* Header Section */}
          <section>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-black mb-6 leading-tight"
            >
              Unlock Premium <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                Stellar Cat Artifacts
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg max-w-xl mb-8"
            >
              Connect multiple wallets, pay XLM on-chain, and gain permanent access to exclusive multiverse cat NFTs. 
              Verified on Soroban Smart Contracts.
            </motion.p>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
                <Shield size={16} className="text-green-400" /> Secure Payments
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
                <ActivityIcon size={16} className="text-blue-400" /> 2.5s Settlement
              </div>
            </div>
          </section>

          <Stats />

          {/* View Toggler / MY NFTS */}
          <div className="flex items-center gap-4 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit">
            <button
              onClick={() => setView('explore')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                view === 'explore' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Explore NFTs
            </button>
            <button
              onClick={() => setView('my-nfts')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                view === 'my-nfts' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              My NFTs
            </button>
            <button
              onClick={() => setView('marketplace')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                view === 'marketplace' 
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingCart size={14} />
              Marketplace
            </button>
          </div>

          {/* NFT Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
            {nfts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/5 border border-white/5 rounded-3xl text-gray-500 italic">
                <p>No NFTs found in this collection.</p>
              </div>
            ) : (
              nfts.map((nft, index) => (
                <motion.div
                  key={nft.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <NFTCard 
                    nft={nft} 
                    onUnlock={unlockNFT} 
                    onList={listNFT}
                    onBuy={buyNFT}
                    isLoading={unlockingId === nft.id} 
                    isOwner={activeWallet ? (nft.owner === activeWallet.address || (nft.unlocked && !nft.owner)) : false}
                  />
                </motion.div>
              ))
            )}
          </section>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="lg:col-span-4 lg:sticky lg:top-28 h-[calc(100vh-140px)]">
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center">
        <p className="text-gray-500 text-sm">
          Built for Stellar Testnet • Powered by Soroban & Stellar Wallets Kit
        </p>
      </footer>
    </main>
  );
}
