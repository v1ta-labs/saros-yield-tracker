import type { Metadata } from 'next'
import './globals.css'
import { WalletContextProvider } from '@/components/WalletProvider'

export const metadata: Metadata = {
  title: 'Saros Yield Tracker',
  description: 'Compare yields across Solana DeFi protocols - find the best opportunities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  )
}