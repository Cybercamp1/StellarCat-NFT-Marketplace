import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NFTCard from '../components/NFTCard';
import { NFT } from '../types';

describe('NFTCard', () => {
  const mockNFT: NFT = {
    id: '1',
    title: 'Space Cat',
    image: '/cat.png',
    price: '10 XLM',
    description: 'A cat in space',
    unlocked: false
  };

  it('renders correctly when locked', () => {
    render(<NFTCard nft={mockNFT} onUnlock={vi.fn()} onList={vi.fn()} onBuy={vi.fn()} isLoading={false} />);
    expect(screen.getByText('Space Cat')).toBeInTheDocument();
    expect(screen.getByText('LOCKED')).toBeInTheDocument();
  });

  it('calls onUnlock when button is clicked', () => {
    const onUnlock = vi.fn();
    render(<NFTCard nft={mockNFT} onUnlock={onUnlock} onList={vi.fn()} onBuy={vi.fn()} isLoading={false} />);
    fireEvent.click(screen.getByText(/Unlock for 10 XLM/i));
    expect(onUnlock).toHaveBeenCalledWith('1');
  });

  it('renders correctly when unlocked', () => {
    const unlockedNFT = { ...mockNFT, unlocked: true };
    render(
      <NFTCard 
        nft={unlockedNFT} 
        onUnlock={vi.fn()} 
        onList={vi.fn()} 
        onBuy={vi.fn()} 
        isLoading={false} 
      />
    );
    expect(screen.getByText('OWNED')).toBeInTheDocument();
    expect(screen.getByText('Owned & Private')).toBeInTheDocument();
  });
});
