import { NextRequest, NextResponse } from 'next/server';
import { userPositionsService } from '@/lib/user-positions.service';
import { sarosService } from '@/lib/saros.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Fetch user portfolio
    const portfolio = await userPositionsService.getUserPortfolio(walletAddress);

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

    return NextResponse.json({
      success: true,
      data: {
        portfolio,
        recommendations,
        marketComparison,
      },
    });
  } catch (error) {
    console.error('Error fetching user portfolio:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio',
      },
      { status: 500 }
    );
  }
}
