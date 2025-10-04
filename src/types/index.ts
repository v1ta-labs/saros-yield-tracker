export interface YieldData {
  protocol: string;
  token: string;
  apy: number;
  tvl: number;
  poolAddress: string;
  lastUpdated: Date;
  category: 'farming' | 'lending' | 'staking';
}

export interface Opportunity {
  token: string;
  bestProtocol: string;
  bestAPY: number;
  sarosAPY: number;
  advantage: number; // Percentage difference
  score: number; // 1-5 stars
  tvlDifference: number;
}

export interface Protocol {
  name: string;
  color: string;
  website: string;
  description: string;
}

export interface TelegramUser {
  id: number;
  username?: string;
  firstName: string;
  lastName?: string;
  alerts: YieldAlert[];
}

export interface YieldAlert {
  id: string;
  userId: number;
  token: string;
  minAPY: number;
  protocol?: string;
  active: boolean;
  createdAt: Date;
}

export interface BotCommand {
  command: string;
  description: string;
  handler: (ctx: any) => Promise<void>;
}

export const SUPPORTED_TOKENS = ['SOL', 'USDC', 'USDT', 'JitoSOL', 'mSOL'] as const;
export type SupportedToken = typeof SUPPORTED_TOKENS[number];

export const PROTOCOLS = {
  SAROS: { name: 'Saros', color: '#10B981', website: 'https://saros.finance', description: 'DLMM DEX' },
  METEORA: { name: 'Meteora', color: '#3B82F6', website: 'https://meteora.ag', description: 'DLMM' },
  RAYDIUM: { name: 'Raydium', color: '#7C3AED', website: 'https://raydium.io', description: 'AMM' },
  KAMINO: { name: 'Kamino', color: '#EF4444', website: 'https://kamino.finance', description: 'Lending' },
  ORCA: { name: 'Orca', color: '#FF6B9D', website: 'https://orca.so', description: 'Whirlpools' },
  MARINADE: { name: 'Marinade', color: '#00D4AA', website: 'https://marinade.finance', description: 'Staking' },
  SOLEND: { name: 'Solend', color: '#6C63FF', website: 'https://solend.fi', description: 'Lending' },
} as const;