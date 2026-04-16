'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, DollarSign, AlertCircle } from 'lucide-react';

interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (price: string) => void;
  nftTitle: string;
}

export default function ListModal({ isOpen, onClose, onConfirm, nftTitle }: ListModalProps) {
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setError('Please enter a valid price greater than 0');
      return;
    }
    onConfirm(price);
    setPrice('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-white mb-2">List for Sale</h3>
                <p className="text-gray-400 text-sm font-medium">
                  Set the marketplace price for <span className="text-purple-400">{nftTitle}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Listing Price (XLM)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <DollarSign size={20} className="text-purple-400" />
                  </div>
                  <input
                    autoFocus
                    type="number"
                    step="0.1"
                    value={price}
                    onChange={(e) => {
                       setPrice(e.target.value);
                       setError('');
                    }}
                    placeholder="e.g. 10.5"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-gray-600"
                  />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-red-400 text-xs font-bold mt-2 ml-1"
                  >
                    <AlertCircle size={14} /> {error}
                  </motion.p>
                )}
              </div>

              <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Marketplace Fee (0%)</span>
                  <span className="text-white font-bold">0 XLM</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-400">You will receive</span>
                  <span className="text-green-400">{price || '0'} XLM</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-900/40"
              >
                <Zap size={20} fill="currentColor" />
                CONFIRM LISTING
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
