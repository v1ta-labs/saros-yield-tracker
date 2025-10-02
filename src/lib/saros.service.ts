import { Connection, PublicKey } from '@solana/web3.js';
import { LiquidityBookServices, MODE } from '@saros-finance/dlmm-sdk';
import { getListFarmSaros, getListStakeSaros, getSwapAmountSaros } from '@saros-finance/sdk';

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export interface SarosDLMMPool {
  address: string;
  tokenX: string;
  tokenY: string;
  tokenXSymbol: string;
  tokenYSymbol: string;
  tvl: number;
  volume24h: number;
  fees24h: number;
  apr: number;
  apy: number;
}

export interface SarosAMMPool {
  address: string;
  tokenA: string;
  tokenB: string;
  tokenASymbol: string;
  tokenBSymbol: string;
  liquidity: number;
  volume24h: number;
  apy: number;
}

export interface SarosFarmPool {
  address: string;
  lpToken: string;
  rewardToken: string;
  lpTokenSymbol: string;
  rewardTokenSymbol: string;
  tvl: number;
  apr: number;
  apy: number;
}

export class SarosService {
  private connection: Connection;
  private lbServices: LiquidityBookServices;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, 'confirmed');
    this.lbServices = new LiquidityBookServices({
      mode: MODE.MAINNET,
      options: {
        rpcUrl: RPC_ENDPOINT,
        commitmentOrConfig: 'confirmed'
      }
    });
  }

  async getDLMMPools(): Promise<SarosDLMMPool[]> {
    try {
      const poolAddresses = await this.lbServices.fetchPoolAddresses();
      const enrichedPools: SarosDLMMPool[] = [];

      for (const address of poolAddresses.slice(0, 20)) {
        try {
          const metadata = await this.lbServices.fetchPoolMetadata(address);
          const pairAccount = await this.lbServices.getPairAccount(new PublicKey(address));

          const reserveX = parseFloat(metadata.baseReserve) / Math.pow(10, metadata.extra.tokenBaseDecimal);
          const reserveY = parseFloat(metadata.quoteReserve) / Math.pow(10, metadata.extra.tokenQuoteDecimal);

          const tokenXSymbol = await this.getTokenSymbol(metadata.baseMint);
          const tokenYSymbol = await this.getTokenSymbol(metadata.quoteMint);

          const tvl = reserveX + reserveY;
          const volume24h = tvl * 0.1;
          const fees24h = volume24h * (metadata.tradeFee / 10000);
          const apr = this.calculateAPR(fees24h, tvl);
          const apy = this.aprToApy(apr);

          if (tvl > 1000) {
            enrichedPools.push({
              address,
              tokenX: metadata.baseMint,
              tokenY: metadata.quoteMint,
              tokenXSymbol,
              tokenYSymbol,
              tvl,
              volume24h,
              fees24h,
              apr,
              apy
            });
          }
        } catch (error) {
          console.error(`Error processing pool ${address}:`, error);
          continue;
        }
      }

      return enrichedPools;
    } catch (error) {
      console.error('Error fetching DLMM pools:', error);
      return [];
    }
  }

  async getTopDLMMPoolsByTVL(limit: number = 10): Promise<SarosDLMMPool[]> {
    const pools = await this.getDLMMPools();
    return pools
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, limit);
  }

  async getTopDLMMPoolsByAPY(limit: number = 10): Promise<SarosDLMMPool[]> {
    const pools = await this.getDLMMPools();
    return pools
      .filter(pool => pool.apy > 0 && pool.apy < 1000)
      .sort((a, b) => b.apy - a.apy)
      .slice(0, limit);
  }

  async getPoolByTokens(tokenA: string, tokenB: string): Promise<SarosDLMMPool | null> {
    try {
      const pools = await this.getDLMMPools();
      return pools.find(pool =>
        (pool.tokenXSymbol === tokenA && pool.tokenYSymbol === tokenB) ||
        (pool.tokenXSymbol === tokenB && pool.tokenYSymbol === tokenA)
      ) || null;
    } catch (error) {
      console.error('Error finding pool by tokens:', error);
      return null;
    }
  }

  private calculateAPR(fees24h: number, tvl: number): number {
    if (tvl === 0) return 0;
    return (fees24h * 365 / tvl) * 100;
  }

  private aprToApy(apr: number): number {
    const n = 365;
    return (Math.pow(1 + (apr / 100) / n, n) - 1) * 100;
  }

  private async getTokenSymbol(mintAddress: string): Promise<string> {
    const knownTokens: { [key: string]: string } = {
      'So11111111111111111111111111111111111111112': 'SOL',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'JitoSOL',
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
      'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': 'bSOL',
      '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': 'stSOL'
    };

    return knownTokens[mintAddress] || mintAddress.slice(0, 4);
  }

  async getAMMPools(): Promise<SarosAMMPool[]> {
    try {
      // Note: @saros-finance/sdk doesn't have direct pool listing
      // This is a placeholder - actual implementation would require
      // fetching pool data from Saros API or on-chain accounts
      return [];
    } catch (error) {
      console.error('Error fetching AMM pools:', error);
      return [];
    }
  }

  async getFarmPools(): Promise<SarosFarmPool[]> {
    try {
      const farms = await getListFarmSaros();
      const enrichedFarms: SarosFarmPool[] = [];

      for (const farm of farms) {
        try {
          // Extract farm data
          const tvl = parseFloat(farm.tvl || '0');
          const apr = parseFloat(farm.apr || '0');
          const apy = this.aprToApy(apr);

          enrichedFarms.push({
            address: farm.farmId || farm.address,
            lpToken: farm.lpMint || '',
            rewardToken: farm.rewardMint || '',
            lpTokenSymbol: await this.getTokenSymbol(farm.lpMint || ''),
            rewardTokenSymbol: await this.getTokenSymbol(farm.rewardMint || ''),
            tvl,
            apr,
            apy,
          });
        } catch (error) {
          console.error('Error processing farm:', error);
          continue;
        }
      }

      return enrichedFarms;
    } catch (error) {
      console.error('Error fetching farm pools:', error);
      return [];
    }
  }

  async getStakePools(): Promise<any[]> {
    try {
      const stakes = await getListStakeSaros();
      return stakes || [];
    } catch (error) {
      console.error('Error fetching stake pools:', error);
      return [];
    }
  }

  async getAllPools(): Promise<{
    dlmm: SarosDLMMPool[];
    amm: SarosAMMPool[];
    farms: SarosFarmPool[];
    stakes: any[];
  }> {
    const [dlmm, amm, farms, stakes] = await Promise.all([
      this.getDLMMPools(),
      this.getAMMPools(),
      this.getFarmPools(),
      this.getStakePools(),
    ]);

    return { dlmm, amm, farms, stakes };
  }

  async getHealthStatus(): Promise<{
    connected: boolean;
    rpcEndpoint: string;
    blockHeight: number | null;
  }> {
    try {
      const blockHeight = await this.connection.getBlockHeight();
      return {
        connected: true,
        rpcEndpoint: RPC_ENDPOINT,
        blockHeight
      };
    } catch (error) {
      return {
        connected: false,
        rpcEndpoint: RPC_ENDPOINT,
        blockHeight: null
      };
    }
  }
}

export const sarosService = new SarosService();
