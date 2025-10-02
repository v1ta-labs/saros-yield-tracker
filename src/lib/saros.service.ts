import { Connection, PublicKey } from '@solana/web3.js';
import DLMM from '@saros-finance/dlmm-sdk';

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
  private dlmmInstance: DLMM | null = null;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, 'confirmed');
  }

  private async initializeDLMM(): Promise<DLMM> {
    if (!this.dlmmInstance) {
      this.dlmmInstance = await DLMM.create(this.connection);
    }
    return this.dlmmInstance;
  }

  async getDLMMPools(): Promise<SarosDLMMPool[]> {
    try {
      const dlmm = await this.initializeDLMM();
      const pools = await dlmm.getAllLbPairs();

      const enrichedPools: SarosDLMMPool[] = [];

      for (const pool of pools) {
        try {
          const poolData = await dlmm.getActiveBin(new PublicKey(pool.address));
          const fees = await dlmm.getFeeRate(new PublicKey(pool.address));

          const tvl = this.calculateTVL(poolData);
          const volume24h = this.estimateVolume24h(poolData);
          const fees24h = volume24h * (fees / 10000);
          const apr = this.calculateAPR(fees24h, tvl);
          const apy = this.aprToApy(apr);

          enrichedPools.push({
            address: pool.address,
            tokenX: pool.tokenX.toString(),
            tokenY: pool.tokenY.toString(),
            tokenXSymbol: await this.getTokenSymbol(pool.tokenX.toString()),
            tokenYSymbol: await this.getTokenSymbol(pool.tokenY.toString()),
            tvl,
            volume24h,
            fees24h,
            apr,
            apy
          });
        } catch (error) {
          console.error(`Error processing pool ${pool.address}:`, error);
          continue;
        }
      }

      return enrichedPools.filter(pool => pool.tvl > 1000);
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

  private calculateTVL(poolData: any): number {
    try {
      if (!poolData || !poolData.reserveX || !poolData.reserveY) {
        return 0;
      }

      const reserveXValue = Number(poolData.reserveX) * (poolData.priceX || 1);
      const reserveYValue = Number(poolData.reserveY) * (poolData.priceY || 1);

      return reserveXValue + reserveYValue;
    } catch (error) {
      return 0;
    }
  }

  private estimateVolume24h(poolData: any): number {
    try {
      if (!poolData || !poolData.volume) {
        return 0;
      }
      return Number(poolData.volume || 0);
    } catch (error) {
      return 0;
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
