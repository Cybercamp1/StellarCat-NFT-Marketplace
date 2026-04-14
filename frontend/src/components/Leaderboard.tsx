'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, User } from 'lucide-react';
import { shortenAddress } from '@/utils/stellar';

const LEADERBOARD_DATA = [
  { id: 1, address: 'GBVM5MJUKE2LAQWE6EKPBMYBHJGIORVXK6SN7HVXJ42OMJHIMVDK2WLK', collection: 12, spent: '45.5 XLM', status: 'Whale' },
  { id: 2, address: 'GDAZZ...K7L2', collection: 8, spent: '32.1 XLM', status: 'Collector' },
  { id: 3, address: 'GCBB2...R8T9', collection: 5, spent: '18.9 XLM', status: 'Collector' },
  { id: 4, address: 'GD9W...P2Q0', collection: 3, spent: '12.0 XLM', status: 'Novice' },
  { id: 5, address: 'GBX1...A3B5', collection: 2, spent: '8.5 XLM', status: 'Novice' },
];

export default function Leaderboard() {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="text-yellow-400" size={20} />;
      case 2: return <Medal className="text-slate-300" size={20} />;
      case 3: return <Award className="text-amber-600" size={20} />;
      default: return <span className="text-gray-500 font-bold text-sm">{rank}</span>;
    }
  };

  return (
    <div className="bg-[#121212] border border-white/10 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="text-yellow-500" size={22} />
          Top Collectors
        </h2>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded">
          Live Rankings
        </span>
      </div>

      <div className="space-y-3">
        {LEADERBOARD_DATA.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i }}
            className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
              i === 0 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-white/5 border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center">
                {getRankIcon(user.id)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white font-mono">{shortenAddress(user.address)}</span>
                <span className="text-[10px] text-gray-500 font-medium">{user.status}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-black text-white">{user.collection} NFTs</div>
              <div className="text-[10px] text-purple-400 font-bold">{user.spent}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-400 transition-colors">
          View Full Leaderboard
        </button>
      </div>
    </div>
  );
}
