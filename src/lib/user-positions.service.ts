import { Connection, PublicKey } from '@solana/web3.js';
import { LiquidityBookServices, MODE } from '@saros-finance/dlmm-sdk';

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export interface UserDLMMPosition {
  poolAddress: string;
  positionMint: string;
  tokenX: string;
  tokenY: string;
  tokenXSymbol: string;
  tokenYSymbol: string;
  tokenXAmount: number;
  tokenYAmount: number;
  totalValueUSD: number;
  unclaimedFeesX: number;
  unclaimedFeesY: number;
  currentAPY: number;
  estimatedDailyEarnings: number;
  lowerBinId: number;
  upperBinId: number;
}

export interface UserPortfolio {
  totalValueUSD: number;
  dlmmPositions: UserDLMMPosition[];
  totalDailyEarnings: number;
  weightedAvgAPY: number;
  totalUnclaimedRewards: number;
  positionCount: number;
}

export interface OptimizationRecommendation {
  type: 'rebalance' | 'migrate' | 'claim' | 'add_liquidity' | 'diversify';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialGain: number;
  currentPosition?: string;
  recommendedPosition?: string;
  action: string;
}

export class UserPositionsService {
  private connection: Connection;
  private lbServices: LiquidityBookServices;
  private poolAddressesCache: string[] | null = null;
  private poolAddressesCacheTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

  async getUserPortfolio(walletAddress: string): Promise<UserPortfolio> {
    const dlmmPositions = await this.getUserDLMMPositions(walletAddress);

    const totalValueUSD = dlmmPositions.reduce((sum, p) => sum + p.totalValueUSD, 0);
    const totalDailyEarnings = dlmmPositions.reduce((sum, p) => sum + p.estimatedDailyEarnings, 0);
    const totalUnclaimedRewards = dlmmPositions.reduce((sum, p) => sum + p.unclaimedFeesX + p.unclaimedFeesY, 0);
    const weightedAvgAPY = totalValueUSD > 0 ? ((totalDailyEarnings * 365) / totalValueUSD) * 100 : 0;

    return {
      totalValueUSD,
      dlmmPositions,
      totalDailyEarnings,
      weightedAvgAPY,
      totalUnclaimedRewards,
      positionCount: dlmmPositions.length,
    };
  }

  async getUserDLMMPositions(walletAddress: string): Promise<UserDLMMPosition[]> {
    try {
      const userPubkey = new PublicKey(walletAddress);
      const allPositions: UserDLMMPosition[] = [];

      // Fetch pool addresses with caching
      let poolAddresses: string[];
      const now = Date.now();

      if (this.poolAddressesCache && (now - this.poolAddressesCacheTime) < this.CACHE_DURATION) {
        poolAddresses = this.poolAddressesCache;
      } else {
        poolAddresses = await this.lbServices.fetchPoolAddresses();
        this.poolAddressesCache = poolAddresses;
        this.poolAddressesCacheTime = now;
      }

      // DRASTICALLY reduce to 10 pools and process sequentially
      const poolsToCheck = poolAddresses.slice(0, 10);
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Process ONE pool at a time to avoid rate limiting
      for (let i = 0; i < poolsToCheck.length; i++) {
        const poolAddress = poolsToCheck[i];

        try {
          const pair = new PublicKey(poolAddress);

          // Get user positions for this pool
          const positions = await this.lbServices.getUserPositions({
            payer: userPubkey,
            pair: pair,
          });

          if (!positions || positions.length === 0) {
            // Wait before checking next pool
            await delay(800);
            continue;
          }

          // Fetch pool metadata
          const poolMetadata = await this.lbServices.fetchPoolMetadata(poolAddress);
          const tokenXSymbol = this.getTokenSymbol(poolMetadata.baseMint);
          const tokenYSymbol = this.getTokenSymbol(poolMetadata.quoteMint);

          // Process each position in this pool
          for (const pos of positions) {
            try {
              const positionPubkey = new PublicKey(pos.publicKey);
              const positionAccount = await this.lbServices.getPositionAccount(positionPubkey);

              const totalXAmount = positionAccount.positionData?.totalXAmount || 0;
              const totalYAmount = positionAccount.positionData?.totalYAmount || 0;

              const tokenXAmount = Number(totalXAmount) / Math.pow(10, poolMetadata.extra.tokenBaseDecimal);
              const tokenYAmount = Number(totalYAmount) / Math.pow(10, poolMetadata.extra.tokenQuoteDecimal);
              const totalValueUSD = tokenXAmount + tokenYAmount;

              const feeX = positionAccount.positionData?.feeX || 0;
              const feeY = positionAccount.positionData?.feeY || 0;
              const unclaimedFeesX = Number(feeX) / Math.pow(10, poolMetadata.extra.tokenBaseDecimal);
              const unclaimedFeesY = Number(feeY) / Math.pow(10, poolMetadata.extra.tokenQuoteDecimal);

              const volume24h = totalValueUSD * 0.15;
              const fees24h = volume24h * (poolMetadata.tradeFee / 10000);
              const currentAPY = totalValueUSD > 0 ? ((fees24h * 365) / totalValueUSD) * 100 : 0;
              const estimatedDailyEarnings = (totalValueUSD * currentAPY / 100) / 365;

              allPositions.push({
                poolAddress,
                positionMint: pos.publicKey?.toString() || '',
                tokenX: poolMetadata.baseMint,
                tokenY: poolMetadata.quoteMint,
                tokenXSymbol,
                tokenYSymbol,
                tokenXAmount,
                tokenYAmount,
                totalValueUSD,
                unclaimedFeesX,
                unclaimedFeesY,
                currentAPY,
                estimatedDailyEarnings,
                lowerBinId: positionAccount.lowerBinId || 0,
                upperBinId: positionAccount.upperBinId || 0,
              });

              // Small delay between positions
              await delay(200);
            } catch (error) {
              console.error(`Error processing position in pool ${poolAddress}:`, error);
            }
          }
        } catch (error) {
          // Silently continue to next pool
        }

        // Wait 1 second between each pool check
        if (i < poolsToCheck.length - 1) {
          await delay(1000);
        }
      }

      return allPositions;
    } catch (error) {
      console.error('Error fetching user DLMM positions:', error);
      return [];
    }
  }

  private getTokenSymbol(mintAddress: string): string {
    const knownTokens: { [key: string]: string } = {
      'So11111111111111111111111111111111111111112': 'SOL',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'JitoSOL',
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
      'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': 'bSOL',
      '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': 'stSOL',
      'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': 'PYTH',
      '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ETH',
    };

    return knownTokens[mintAddress] || mintAddress.slice(0, 4);
  }

  async getOptimizationRecommendations(
    userPortfolio: UserPortfolio,
    marketData: any[]
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    if (userPortfolio.totalUnclaimedRewards > 5) {
      recommendations.push({
        type: 'claim',
        priority: 'high',
        title: 'Claim Unclaimed Rewards',
        description: `You have $${userPortfolio.totalUnclaimedRewards.toFixed(2)} in unclaimed fees. Claiming and reinvesting could increase your yields.`,
        potentialGain: userPortfolio.totalUnclaimedRewards * 0.15,
        action: 'Claim all pending rewards and consider reinvesting in high-yield pools',
      });
    }

    const lowApyPositions = userPortfolio.dlmmPositions.filter(p => p.currentAPY < 10);
    if (lowApyPositions.length > 0 && marketData.length > 0) {
      const avgMarketAPY = marketData.reduce((sum, p) => sum + (p.apy || 0), 0) / marketData.length;

      if (avgMarketAPY > 0) {
        const avgLowAPY = lowApyPositions.reduce((s, p) => s + p.currentAPY, 0) / lowApyPositions.length;

        recommendations.push({
          type: 'migrate',
          priority: 'medium',
          title: 'Migrate Low-Performing Positions',
          description: `${lowApyPositions.length} position(s) are earning below 10% APY. Consider migrating to higher-yielding pools.`,
          potentialGain: Math.max(0, avgMarketAPY - avgLowAPY),
          currentPosition: `Average APY: ${avgLowAPY.toFixed(2)}%`,
          recommendedPosition: `Market Average: ${avgMarketAPY.toFixed(2)}%`,
          action: 'Review alternative pools with higher APY',
        });
      }
    }

    if (userPortfolio.positionCount === 1 && userPortfolio.totalValueUSD > 500) {
      recommendations.push({
        type: 'diversify',
        priority: 'medium',
        title: 'Diversify Your Portfolio',
        description: 'Your portfolio has only one position. Diversifying across multiple pools can reduce risk.',
        potentialGain: 0,
        action: 'Consider adding 1-2 more positions in different token pairs',
      });
    }

    const maxPositionValue = Math.max(...userPortfolio.dlmmPositions.map(p => p.totalValueUSD));
    const concentration = userPortfolio.totalValueUSD > 0
      ? (maxPositionValue / userPortfolio.totalValueUSD) * 100
      : 0;

    if (concentration > 70 && userPortfolio.positionCount > 1) {
      recommendations.push({
        type: 'rebalance',
        priority: 'low',
        title: 'Rebalance Portfolio Concentration',
        description: `${concentration.toFixed(0)}% of your portfolio is in a single position. Consider rebalancing for better risk distribution.`,
        potentialGain: 0,
        action: 'Spread liquidity more evenly across positions',
      });
    }

    if (marketData.length > 0 && userPortfolio.weightedAvgAPY > 0) {
      const highYieldPools = marketData
        .filter(p => p.apy > userPortfolio.weightedAvgAPY * 1.3)
        .sort((a, b) => b.apy - a.apy);

      if (highYieldPools.length > 0) {
        recommendations.push({
          type: 'add_liquidity',
          priority: 'high',
          title: 'High-Yield Opportunities Available',
          description: `${highYieldPools.length} pool(s) are offering 30%+ higher yields than your current average.`,
          potentialGain: highYieldPools[0].apy - userPortfolio.weightedAvgAPY,
          recommendedPosition: `Top pool: ${highYieldPools[0].token} at ${highYieldPools[0].apy.toFixed(2)}% APY`,
          action: 'Consider allocating additional capital to high-performing pools',
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async compareWithMarket(
    userPortfolio: UserPortfolio,
    marketData: any[]
  ): Promise<{
    performanceVsMarket: number;
    rank: string;
    betterThan: number;
  }> {
    if (marketData.length === 0) {
      return {
        performanceVsMarket: 0,
        rank: 'N/A',
        betterThan: 50,
      };
    }

    const marketAvgAPY = marketData.reduce((sum, p) => sum + (p.apy || 0), 0) / marketData.length;
    const performanceVsMarket = userPortfolio.weightedAvgAPY - marketAvgAPY;

    const betterThan = performanceVsMarket > 0
      ? Math.min(95, 50 + (performanceVsMarket / marketAvgAPY) * 50)
      : Math.max(5, 50 - Math.abs(performanceVsMarket / marketAvgAPY) * 50);

    let rank = 'Average';
    if (betterThan > 80) rank = 'Excellent';
    else if (betterThan > 60) rank = 'Good';
    else if (betterThan < 30) rank = 'Needs Improvement';

    return {
      performanceVsMarket,
      rank,
      betterThan,
    };
  }
}

export const userPositionsService = new UserPositionsService();
