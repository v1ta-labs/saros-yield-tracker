'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet } from 'lucide-react';

export const WalletButton = () => {
  return (
    <div className="wallet-adapter-button-trigger">
      <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !rounded-lg !px-4 !py-2 !h-10 !text-sm !font-medium !transition-all" />
    </div>
  );
};

export const WalletInfo = () => {
  const { connected, publicKey, disconnect } = useWallet();

  if (!connected || !publicKey) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Wallet className="w-4 h-4 text-primary" />
      <span className="font-mono">
        {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
      </span>
    </div>
  );
};
