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
  SAROS: { name: 'Saros', color: '#10B981', website: 'https://saros.finance' },
  JUPITER: { name: 'Jupiter', color: '#FCD34D', website: 'https://jup.ag' },
  RAYDIUM: { name: 'Raydium', color: '#7C3AED', website: 'https://raydium.io' },
  METEORA: { name: 'Meteora', color: '#3B82F6', website: 'https://meteora.ag' },
  KAMINO: { name: 'Kamino', color: '#EF4444', website: 'https://kamino.finance' },
} as const;