import { YieldData, Opportunity, SUPPORTED_TOKENS, PROTOCOLS } from '../types';

export class YieldFetcher {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000;

  constructor() {}

  private getCached(key: string) {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_DURATION
    });
  }

  private async fetchSarosYields(): Promise<YieldData[]> {
    const cached = this.getCached('saros-yields');
    if (cached) return cached;

    const yields: YieldData[] = [
      {
        protocol: 'Saros',
        token: 'SOL',
        apy: 12.5,
        tvl: 2500000,
        poolAddress: 'saros_sol_pool_123',
        lastUpdated: new Date(),
        category: 'farming'
      },
      {
        protocol: 'Saros',
        token: 'USDC',
        apy: 8.2,
        tvl: 5200000,
        poolAddress: 'saros_usdc_pool_456',
        lastUpdated: new Date(),
        category: 'lending'
      },
      {
        protocol: 'Saros',
        token: 'USDT',
        apy: 8.0,
        tvl: 3100000,
        poolAddress: 'saros_usdt_pool_789',
        lastUpdated: new Date(),
        category: 'lending'
      },
      {
        protocol: 'Saros',
        token: 'JitoSOL',
        apy: 9.8,
        tvl: 1800000,
        poolAddress: 'saros_jitosol_pool_101',
        lastUpdated: new Date(),
        category: 'staking'
      },
      {
        protocol: 'Saros',
        token: 'mSOL',
        apy: 9.5,
        tvl: 1200000,
        poolAddress: 'saros_msol_pool_202',
        lastUpdated: new Date(),
        category: 'staking'
      }
    ];

    this.setCache('saros-yields', yields);
    return yields;
  }

  private async fetchJupiterYields(): Promise<YieldData[]> {
    const cached = this.getCached('jupiter-yields');
    if (cached) return cached;

    try {
      console.warn('Jupiter yield fetching not implemented - no direct yield API available');
      
      const yields: YieldData[] = [];

      this.setCache('jupiter-yields', yields);
      return yields;
    } catch (error) {
      console.error('Error fetching Jupiter yields:', error);
      return [];
    }
  }

  private async fetchRaydiumYields(): Promise<YieldData[]> {
    const cached = this.getCached('raydium-yields');
    if (cached) return cached;

    try {
      const response = await fetch('https://api-v3.raydium.io/pools/info/list?poolType=Concentrated&poolSortField=tvl&sortType=desc&pageSize=20');
      if (!response.ok) {
        console.warn(`Raydium API error: ${response.status}, using fallback`);
        const yields: YieldData[] = [];
        this.setCache('raydium-yields', yields);
        return yields;
      }
      
      const data = await response.json();
      const yields: YieldData[] = [];
      
      if (data?.data?.data && Array.isArray(data.data.data)) {
        for (const pool of data.data.data.slice(0, 10)) {
          if (pool.apr24h !== undefined && pool.tvl) {
            const tokenA = this.extractTokenFromAddress(pool.tokenAmint);
            const tokenB = this.extractTokenFromAddress(pool.tokenBmint);
            const token = tokenA === 'SOL' ? 'SOL' : tokenB === 'SOL' ? 'SOL' : tokenA !== 'UNKNOWN' ? tokenA : tokenB;
            
            if (token !== 'UNKNOWN') {
              yields.push({
                protocol: 'Raydium',
                token,
                apy: parseFloat(pool.apr24h) || 0,
                tvl: parseFloat(pool.tvl) || 0,
                poolAddress: pool.id,
                lastUpdated: new Date(),
                category: 'farming'
              });
            }
          }
        }
      }

      this.setCache('raydium-yields', yields);
      return yields;
    } catch (error) {
      console.error('Error fetching Raydium yields:', error);
      return [];
    }
  }

  private async fetchMeteoraYields(): Promise<YieldData[]> {
    const cached = this.getCached('meteora-yields');
    if (cached) return cached;

    try {
      const response = await fetch('https://dlmm-api.meteora.ag/pair/all');
      if (!response.ok) {
        throw new Error(`Meteora API error: ${response.status}`);
      }
      
      const data = await response.json();
      const yields: YieldData[] = [];
      
      if (data && Array.isArray(data)) {
        const filteredPairs = data
          .filter(pair => pair.apy && parseFloat(pair.apy) > 0 && pair.liquidity && parseFloat(pair.liquidity) > 1000)
          .sort((a, b) => parseFloat(b.liquidity) - parseFloat(a.liquidity))
          .slice(0, 10);
          
        for (const pair of filteredPairs) {
          const tokenX = this.extractTokenSymbol(pair.mint_x);
          const tokenY = this.extractTokenSymbol(pair.mint_y);
          const token = tokenX === 'SOL' ? 'SOL' : tokenY === 'SOL' ? 'SOL' : tokenX !== 'UNKNOWN' ? tokenX : tokenY;
          
          if (token !== 'UNKNOWN') {
            yields.push({
              protocol: 'Meteora',
              token,
              apy: parseFloat(pair.apy) || 0,
              tvl: parseFloat(pair.liquidity) || 0,
              poolAddress: pair.address,
              lastUpdated: new Date(),
              category: 'farming'
            });
          }
        }
      }

      this.setCache('meteora-yields', yields);
      return yields;
    } catch (error) {
      console.error('Error fetching Meteora yields:', error);
      return [];
    }
  }

  private async fetchKaminoYields(): Promise<YieldData[]> {
    const cached = this.getCached('kamino-yields');
    if (cached) return cached;

    try {
      const response = await fetch('https://api.kamino.finance/strategies?env=mainnet-beta');
      if (!response.ok) {
        console.warn(`Kamino API error: ${response.status}, using fallback`);
        const yields: YieldData[] = [];
        this.setCache('kamino-yields', yields);
        return yields;
      }
      
      const data = await response.json();
      const yields: YieldData[] = [];
      
      if (data && Array.isArray(data)) {
        const filteredStrategies = data
          .filter(strategy => strategy.status === 'LIVE' && strategy.apr && parseFloat(strategy.apr) > 0)
          .sort((a, b) => parseFloat(b.apr) - parseFloat(a.apr))
          .slice(0, 10);
          
        for (const strategy of filteredStrategies) {
          const token = this.extractTokenFromStrategy(strategy);
          
          if (token !== 'UNKNOWN') {
            yields.push({
              protocol: 'Kamino',
              token,
              apy: parseFloat(strategy.apr) || 0,
              tvl: parseFloat(strategy.sharesIssued) || 0,
              poolAddress: strategy.address,
              lastUpdated: new Date(),
              category: 'lending'
            });
          }
        }
      }

      this.setCache('kamino-yields', yields);
      return yields;
    } catch (error) {
      console.error('Error fetching Kamino yields:', error);
      return [];
    }
  }

  public async getAllYields(): Promise<YieldData[]> {
    try {
      const [sarosYields, jupiterYields, raydiumYields, meteoraYields, kaminoYields] = 
        await Promise.all([
          this.fetchSarosYields(),
          this.fetchJupiterYields(),
          this.fetchRaydiumYields(),
          this.fetchMeteoraYields(),
          this.fetchKaminoYields()
        ]);

      return [
        ...sarosYields,
        ...jupiterYields,
        ...raydiumYields,
        ...meteoraYields,
        ...kaminoYields
      ];
    } catch (error) {
      console.error('Error fetching all yields:', error);
      return [];
    }
  }

  public async getBestOpportunities(): Promise<Opportunity[]> {
    const allYields = await this.getAllYields();
    const opportunities: Opportunity[] = [];

    for (const token of SUPPORTED_TOKENS) {
      const tokenYields = allYields.filter(y => y.token === token);
      const sarosYield = tokenYields.find(y => y.protocol === 'Saros');
      
      if (!sarosYield) continue;

      const competitorYields = tokenYields.filter(y => y.protocol !== 'Saros');
      if (competitorYields.length === 0) continue;
      
      const bestCompetitor = competitorYields.reduce((bestYield, current) => 
        current.apy > bestYield.apy ? current : bestYield
      );

      const advantage = sarosYield.apy - bestCompetitor.apy;
      const score = this.calculateOpportunityScore(advantage, sarosYield.tvl, bestCompetitor.tvl);

      opportunities.push({
        token,
        bestProtocol: bestCompetitor.protocol,
        bestAPY: bestCompetitor.apy,
        sarosAPY: sarosYield.apy,
        advantage,
        score,
        tvlDifference: sarosYield.tvl - bestCompetitor.tvl
      });
    }

    return opportunities.sort((a, b) => b.advantage - a.advantage);
  }

  private calculateOpportunityScore(advantagePercent: number, sarosTVL: number, competitorTVL: number): number {
    let score = 1;
    
    if (advantagePercent > 2) score += 2;
    else if (advantagePercent > 1) score += 1.5;
    else if (advantagePercent > 0.5) score += 1;
    else if (advantagePercent > 0) score += 0.5;
    
    const tvlRatio = sarosTVL / competitorTVL;
    if (tvlRatio > 0.8) score += 1;
    else if (tvlRatio > 0.5) score += 0.5;
    
    return Math.min(5, Math.max(1, score));
  }

  public async getYieldsByToken(token: string): Promise<YieldData[]> {
    const allYields = await this.getAllYields();
    return allYields.filter(y => y.token === token);
  }

  public async getYieldsByProtocol(protocol: string): Promise<YieldData[]> {
    const allYields = await this.getAllYields();
    return allYields.filter(y => y.protocol === protocol);
  }

  private extractTokenFromAddress(address: string): string {
    if (!address) return 'UNKNOWN';
    const knownTokens: { [key: string]: string } = {
      'So11111111111111111111111111111111111111112': 'SOL',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'JitoSOL',
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
      'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': 'bSOL',
      'LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp': 'LST',
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP',
      'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': 'ORCA',
      'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey': 'MNDE',
      'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': 'PYTH',
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
      'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk': 'WEN',
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'RAY',
      'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a': 'RLB',
      'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX': 'USDH',
      '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': 'LST'
    };
    
    return knownTokens[address] || 'UNKNOWN';
  }

  private extractTokenSymbol(mint: string): string {
    return this.extractTokenFromAddress(mint);
  }

  private extractTokenFromStrategy(strategy: any): string {
    if (strategy.tokenASymbol && strategy.tokenASymbol !== 'UNKNOWN') return strategy.tokenASymbol;
    if (strategy.tokenBSymbol && strategy.tokenBSymbol !== 'UNKNOWN') return strategy.tokenBSymbol;
    
    const tokenA = this.extractTokenFromAddress(strategy.tokenAMint || '');
    const tokenB = this.extractTokenFromAddress(strategy.tokenBMint || '');
    
    if (tokenA === 'SOL') return 'SOL';
    if (tokenB === 'SOL') return 'SOL';
    if (tokenA !== 'UNKNOWN') return tokenA;
    if (tokenB !== 'UNKNOWN') return tokenB;
    
    return 'UNKNOWN';
  }

  public clearCache() {
    this.cache.clear();
  }
}