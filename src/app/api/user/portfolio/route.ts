import { NextRequest, NextResponse } from 'next/server';
import { userPositionsService } from '@/lib/user-positions.service';
import { sarosService } from '@/lib/saros.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      console.warn('[API /user/portfolio] Missing wallet address');
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    console.log(`[API /user/portfolio] Fetching portfolio for wallet: ${walletAddress.slice(0, 8)}...`);
    // Fetch user portfolio
    const portfolio = await userPositionsService.getUserPortfolio(walletAddress);
    console.log(`[API /user/portfolio] Found ${portfolio.positionCount} positions`);

    // Fetch market data for comparison
    const dlmmPools = await sarosService.getDLMMPools();
    const marketData = dlmmPools.map(pool => ({
      token: `${pool.tokenXSymbol}/${pool.tokenYSymbol}`,
      apy: pool.apy,
      tvl: pool.tvl,
    }));

    // Get optimization recommendations
    const recommendations = await userPositionsService.getOptimizationRecommendations(
      portfolio,
      marketData
    );

    // Compare with market
    const marketComparison = await userPositionsService.compareWithMarket(
      portfolio,
      marketData
    );

    console.log(`[API /user/portfolio] Sending portfolio data with ${recommendations.length} recommendations`);
    return NextResponse.json({
      success: true,
      data: {
        portfolio,
        recommendations,
        marketComparison,
      },
    });
  } catch (error) {
    console.error('[API /user/portfolio] Error fetching user portfolio:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio',
      },
      { status: 500 }
    );
  }
}
