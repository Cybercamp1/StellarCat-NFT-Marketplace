'use client';

import { useState, useEffect, useCallback } from 'react';
import { NFT, Activity, TransactionStatus } from '@/types';
import { useWallet } from '@/components/WalletProvider';
import { rpcServer, CONTRACT_ID, STELLAR_NETWORK, horizonServer, TREASURY_ADDRESS } from '@/utils/stellar';
import { 
  TransactionBuilder, 
  Operation, 
  xdr, 
  scValToNative,
  nativeToScVal,
  Address,
  rpc,
  Asset
} from '@stellar/stellar-sdk';
import { toast } from 'react-hot-toast';

// ─── NFT Data ─────────────────────────────────────────────────────────────
const INITIAL_NFTS: NFT[] = [
  {
    id: '1',
    title: 'Cosmic Astronaut Cat',
    image: '/nfts/cosmic.png',
    price: '1 XLM',
    description: 'A stellar feline exploring the deep galaxies.',
    unlocked: false,
  },
  {
    id: '2',
    title: 'Cyberpunk Neon Cat',
    image: '/nfts/cyberpunk.png',
    price: '1.5 XLM',
    description: 'Hacker elite from the rainy streets of Neo-Tokyo.',
    unlocked: false,
  },
  {
    id: '3',
    title: 'Samurai Blade Cat',
    image: '/nfts/samurai.png',
    price: '2 XLM',
    description: 'Protector of the ancient blockchain ruins.',
    unlocked: false,
  },
  {
    id: '4',
    title: 'Ghost Hacker Cat',
    image: '/nfts/hacker.png',
    price: '2.5 XLM',
    description: 'Master of encrypted protocols and zero-day exploits.',
    unlocked: false,
  },
  {
    id: '5',
    title: 'Stellar Galaxy Cat',
    image: '/nfts/cosmic.png', // Reusing for demo
    price: '3 XLM',
    description: 'A cat forged from pure Stellar energy and stardust.',
    unlocked: false,
  },
  {
    id: '6',
    title: 'Logo Master Cat',
    image: '/nfts/cyberpunk.png', // Reusing for demo
    price: '5 XLM',
    description: 'The ultimate guardian of the Stellar network protocol.',
    unlocked: false,
  },
];

// ─── Per-wallet access cache (simulates contract storage locally for UI) ──
const walletAccessCache: Record<string, Set<string>> = {};

export function useNFTs() {
  const { activeWallet, kit } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>(INITIAL_NFTS);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [view, setView] = useState<'explore' | 'my-nfts' | 'marketplace'>('explore');

  // 1. Fetch User Access from Contract
  const fetchContractAccess = useCallback(async () => {
    if (!activeWallet || !CONTRACT_ID || CONTRACT_ID.includes('YOUR_CONTRACT_ID')) return;

    try {
      // Build a simulated call to check_access
      const account = await horizonServer.loadAccount(activeWallet.address);
      const tx = new TransactionBuilder(account, {
        fee: '1000',
        networkPassphrase: STELLAR_NETWORK,
      })
      .addOperation(
        Operation.invokeHostFunction({
          func: xdr.HostFunction.hostFunctionTypeInvokeContract(
            new xdr.InvokeContractArgs({
              contractAddress: Address.fromString(CONTRACT_ID).toDefaultAddress(),
              functionName: 'check_access',
              args: [
                nativeToScVal(activeWallet.address, { type: 'address' }),
              ],
            })
          ),
          auth: []
        })
      )
      .setTimeout(0)
      .build();

      const simulation = await rpcServer.simulateTransaction(tx);
      
      if (!rpc.Api.isSimulationError(simulation) && simulation.result) {
        // Parse result (bool)
        const hasAccess = scValToNative(simulation.result.retval);
        
        if (hasAccess) {
          // If contract says true, unlock all NFTs for this wallet in our local state
          if (!walletAccessCache[activeWallet.address]) {
            walletAccessCache[activeWallet.address] = new Set();
          }
          INITIAL_NFTS.forEach(n => walletAccessCache[activeWallet.address].add(n.id));
        }
      }
    } catch (e) {
      console.warn('On-chain access check failed (contract likely not deployed)', e);
    }
  }, [activeWallet]);

  // 2. Sync local cache with UI
  const syncNFTState = useCallback(() => {
    if (activeWallet) {
      const unlocked = walletAccessCache[activeWallet.address] ?? new Set();
      setNfts(INITIAL_NFTS.map(n => ({ ...n, unlocked: unlocked.has(n.id) })));
    } else {
      setNfts(INITIAL_NFTS.map(n => ({ ...n, unlocked: false })));
    }
  }, [activeWallet]);

  useEffect(() => {
    const init = async () => {
      await fetchContractAccess();
      syncNFTState();
    };
    init();
  }, [activeWallet, fetchContractAccess, syncNFTState]);

  // Filtered NFTs for UI
  const filteredNFTs = 
    view === 'explore' ? nfts : 
    view === 'my-nfts' ? nfts.filter(n => n.unlocked) :
    nfts.filter(n => n.listingPrice); // Marketplace view

  // 2. Real RPC Event Verification
  const fetchLiveEvents = async () => {
    if (!CONTRACT_ID || CONTRACT_ID.includes('YOUR_CONTRACT_ID')) return;

    try {
      const events = await rpcServer.getEvents({
        startLedger: 0, // In production, store the last seen ledger
        filters: [{
          type: 'contract',
          contractIds: [CONTRACT_ID]
        }],
        limit: 10
      });

      if (events.events.length > 0) {
        const newActivities: Activity[] = events.events.map(event => {
          // Simplistic parsing of event (in reality, use ScVal decode)
          // Event segment could be: topic[0]=unlock, topic[1]=address, value=nftId
          return {
            id: event.id,
            type: 'unlock',
            status: 'success',
            address: 'Unknown (Event)', // In real app, parse from topics
            timestamp: new Date(),
            hash: event.txHash
          };
        });

        // Dedup and merge
        setActivities(prev => {
          const ids = new Set(prev.map(a => a.id));
          const additions = newActivities.filter(a => !ids.has(a.id));
          return [...additions, ...prev].slice(0, 20);
        });
      }
    } catch (e) {
      console.error('Failed to fetch RPC events:', e);
    }
  };

  // Poll for events every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchLiveEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const unlockNFT = async (nftId: string) => {
    const nft = nfts.find(n => n.id === nftId);
    if (!nft) return;

    if (!activeWallet || !kit) {
      toast.error('Please connect your wallet');
      return;
    }

    const toastId = toast.loading(`Initiating unlock for ${nft.title}...`);
    const activityId = Date.now().toString();
    setStatus('pending');
    setUnlockingId(nftId);

    setActivities(prev => [{
      id: activityId,
      type: 'unlock',
      status: 'pending',
      address: activeWallet.address,
      timestamp: new Date()
    }, ...prev].slice(0, 20));

    const isContractDeployed = CONTRACT_ID && !CONTRACT_ID.includes('YOUR_CONTRACT_ID');

    try {
      const account = await horizonServer.loadAccount(activeWallet.address);
      let txHash = '';

      if (!isContractDeployed) {
        // ── PATH A: Direct XLM Payment (no contract required) ──────────────
        const xlmAmount = nft.price.replace(' XLM', '').trim();

        const tx = new TransactionBuilder(account, {
          fee: '1000',
          networkPassphrase: STELLAR_NETWORK,
        })
        .addOperation(Operation.payment({
          destination: TREASURY_ADDRESS,
          asset: Asset.native(),
          amount: xlmAmount,
        }))
        .setTimeout(0)
        .build();

        toast.loading(`✍️ Confirm payment of ${nft.price} in your wallet...`, { id: toastId });
        const { signedTxXdr } = await kit.signTransaction(tx.toXDR());

        toast.loading(`🚀 Submitting payment to Testnet...`, { id: toastId });
        const result = await horizonServer.submitTransaction(
          TransactionBuilder.fromXDR(signedTxXdr, STELLAR_NETWORK)
        );
        txHash = result.hash;
      } else {
        // ── PATH B: Soroban Smart Contract Call ─────────────────────────────
        const amountInt = BigInt(parseFloat(nft.price) * 10_000_000);

        let tx = new TransactionBuilder(account, {
          fee: '10000',
          networkPassphrase: STELLAR_NETWORK,
        })
        .addOperation(
          Operation.invokeHostFunction({
            func: xdr.HostFunction.hostFunctionTypeInvokeContract(
              new xdr.InvokeContractArgs({
                contractAddress: Address.fromString(CONTRACT_ID).toDefaultAddress(),
                functionName: 'pay_and_unlock',
                args: [
                  nativeToScVal(activeWallet.address, { type: 'address' }),
                  nativeToScVal(amountInt, { type: 'i128' }),
                ],
              })
            ),
            auth: []
          })
        )
        .setTimeout(0)
        .build();

        toast.loading(`🔍 Simulating transaction...`, { id: toastId });
        const simulation = await rpcServer.simulateTransaction(tx);
        if (rpc.Api.isSimulationError(simulation)) {
          throw new Error(`Simulation failed: ${simulation.error}`);
        }
        tx = rpc.assembleTransaction(tx, simulation).build();

        toast.loading(`✍️ Waiting for wallet signature...`, { id: toastId });
        const { signedTxXdr } = await kit.signTransaction(tx.toXDR());

        toast.loading(`🚀 Submitting to Testnet...`, { id: toastId });
        const response = await rpcServer.sendTransaction(
          TransactionBuilder.fromXDR(signedTxXdr, STELLAR_NETWORK)
        );
        txHash = response.hash;

        if (response.status === 'ERROR') throw new Error('Transaction submission failed');

        let txResult = await rpcServer.getTransaction(response.hash);
        while (txResult.status === 'NOT_FOUND' || txResult.status === 'PENDING') {
          await new Promise(r => setTimeout(r, 1500));
          txResult = await rpcServer.getTransaction(response.hash);
        }
        if (txResult.status === 'FAILED') throw new Error('Transaction execution failed on-chain');
      }

      // ── SUCCESS ─────────────────────────────────────────────────────────────
      toast.success(
        () => (
          <span>
            <b>✅ {nft.title} unlocked!</b>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 underline text-xs mt-1 block"
            >
              View on Stellar Expert ↗
            </a>
          </span>
        ),
        { id: toastId, duration: 6000 }
      );
      setStatus('success');

      // Cache unlock state
      if (!walletAccessCache[activeWallet.address]) {
        walletAccessCache[activeWallet.address] = new Set();
      }
      walletAccessCache[activeWallet.address].add(nftId);

      // Update UI
      setNfts(prev => prev.map(n => n.id === nftId ? { ...n, unlocked: true } : n));
      setActivities(prev =>
        prev.map(a => a.id === activityId ? { ...a, status: 'success', hash: txHash } : a)
      );

    } catch (error: any) {
      console.error('Unlock error:', error);
      const msg = error?.message || String(error);
      setStatus('failed');
      
      if (msg.includes('rejected') || msg.includes('cancel')) {
        toast.error('❌ Transaction rejected by user', { id: toastId });
      } else if (msg.includes('balance') || msg.includes('insufficient')) {
        toast.error('❌ Insufficient balance', { id: toastId });
      } else {
        toast.error(`❌ Error: ${msg.slice(0, 50)}...`, { id: toastId });
      }

      setActivities(prev =>
        prev.map(a => a.id === activityId ? { ...a, status: 'failed' } : a)
      );
    } finally {
      setTimeout(() => {
        setStatus('idle');
        setUnlockingId(null);
      }, 3000);
    }
  };

  const listNFT = async (nftId: string, price: string) => {
    if (!activeWallet || !kit) return toast.error('Connect wallet first');
    
    const isContractDeployed = CONTRACT_ID && !CONTRACT_ID.includes('YOUR_CONTRACT_ID');
    const toastId = toast.loading(`Listing NFT for ${price} XLM...`);
    
    try {
      if (isContractDeployed) {
        const amountInt = BigInt(parseFloat(price) * 10_000_000);
        const account = await horizonServer.loadAccount(activeWallet.address);

        let tx = new TransactionBuilder(account, {
          fee: '10000',
          networkPassphrase: STELLAR_NETWORK,
        })
        .addOperation(
          Operation.invokeHostFunction({
            func: xdr.HostFunction.hostFunctionTypeInvokeContract(
              new xdr.InvokeContractArgs({
                contractAddress: Address.fromString(CONTRACT_ID).toDefaultAddress(),
                functionName: 'list_nft',
                args: [
                  nativeToScVal(activeWallet.address, { type: 'address' }),
                  nativeToScVal(parseInt(nftId), { type: 'u32' }),
                  nativeToScVal(amountInt, { type: 'i128' }),
                ],
              })
            ),
            auth: []
          })
        )
        .setTimeout(0)
        .build();

        const simulation = await rpcServer.simulateTransaction(tx);
        if (rpc.Api.isSimulationError(simulation)) throw new Error('Simulation failed');
        tx = rpc.assembleTransaction(tx, simulation).build();

        const { signedTxXdr } = await kit.signTransaction(tx.toXDR());
        await rpcServer.sendTransaction(TransactionBuilder.fromXDR(signedTxXdr, STELLAR_NETWORK));
      } else {
        // ── DEMO MODE FALLBACK ──
        await new Promise(r => setTimeout(r, 1500)); // Simulate lag
        console.log('Demo Mode: Simulating listing on-chain...');
      }

      setNfts(prev => prev.map(n => n.id === nftId ? { ...n, listingPrice: price } : n));
      toast.success('NFT listed successfully (Demo Mode)!', { id: toastId });
    } catch (e: any) {
      toast.error(`Listing failed: ${e.message}`, { id: toastId });
    }
  };

  const buyNFT = async (nftId: string) => {
    const nft = nfts.find(n => n.id === nftId);
    if (!nft || !nft.listingPrice) return;
    if (!activeWallet || !kit) return toast.error('Connect wallet first');

    const isContractDeployed = CONTRACT_ID && !CONTRACT_ID.includes('YOUR_CONTRACT_ID');
    const toastId = toast.loading(`Buying ${nft.title} for ${nft.listingPrice} XLM...`);
    
    try {
      if (isContractDeployed) {
        const account = await horizonServer.loadAccount(activeWallet.address);

        let tx = new TransactionBuilder(account, {
          fee: '10000',
          networkPassphrase: STELLAR_NETWORK,
        })
        .addOperation(
          Operation.invokeHostFunction({
            func: xdr.HostFunction.hostFunctionTypeInvokeContract(
              new xdr.InvokeContractArgs({
                contractAddress: Address.fromString(CONTRACT_ID).toDefaultAddress(),
                functionName: 'buy_nft',
                args: [
                  nativeToScVal(activeWallet.address, { type: 'address' }),
                  nativeToScVal(parseInt(nftId), { type: 'u32' }),
                ],
              })
            ),
            auth: []
          })
        )
        .setTimeout(0)
        .build();

        const simulation = await rpcServer.simulateTransaction(tx);
        if (rpc.Api.isSimulationError(simulation)) throw new Error('Simulation failed');
        tx = rpc.assembleTransaction(tx, simulation).build();

        const { signedTxXdr } = await kit.signTransaction(tx.toXDR());
        await rpcServer.sendTransaction(TransactionBuilder.fromXDR(signedTxXdr, STELLAR_NETWORK));
      } else {
         // ── DEMO MODE FALLBACK ──
         await new Promise(r => setTimeout(r, 2000));
         console.log('Demo Mode: Simulating purchase on-chain...');
      }

      setNfts(prev => prev.map(n => n.id === nftId ? { ...n, unlocked: true, listingPrice: undefined, owner: activeWallet.address } : n));
      toast.success('NFT purchased successfully (Demo Mode)!', { id: toastId });
    } catch (e: any) {
      toast.error(`Purchase failed: ${e.message}`, { id: toastId });
    }
  };

  return { 
    nfts: filteredNFTs, 
    allNFTs: nfts, 
    activities, 
    status, 
    unlockingId, 
    unlockNFT, 
    listNFT,
    buyNFT,
    view, 
    setView 
  };
}
