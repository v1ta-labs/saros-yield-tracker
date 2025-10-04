'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { Wallet } from 'lucide-react';

// Dynamically import WalletMultiButton to prevent SSR issues
const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export const WalletButton = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="wallet-adapter-button-trigger">
        <div className="inline-flex items-center justify-center !bg-primary hover:!bg-primary/90 !rounded-lg !px-4 !py-2 !h-10 !text-sm !font-medium !transition-all">
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-adapter-button-trigger">
      <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !rounded-lg !px-4 !py-2 !h-10 !text-sm !font-medium !transition-all" />
    </div>
  );
};

export const WalletInfo = () => {
  const { connected, publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !connected || !publicKey) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Wallet className="w-4 h-4 text-primary" />
      <span className="font-mono">
        {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
      </span>
    </div>
  );
};
