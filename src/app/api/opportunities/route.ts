import { NextRequest, NextResponse } from 'next/server';
import { YieldFetcher } from '@/lib/yield-fetcher';

const yieldFetcher = new YieldFetcher();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const minAdvantage = parseFloat(searchParams.get('min_advantage') || '0');

    let opportunities = await yieldFetcher.getBestOpportunities();
    
    if (minAdvantage > 0) {
      opportunities = opportunities.filter(op => op.advantage >= minAdvantage);
    }
    
    if (limit > 0) {
      opportunities = opportunities.slice(0, limit);
    }
    const sarosAdvantages = opportunities.filter(op => op.advantage > 0);
    const totalSarosAdvantages = sarosAdvantages.length;
    const avgAdvantage = sarosAdvantages.length > 0 
      ? sarosAdvantages.reduce((sum, op) => sum + op.advantage, 0) / sarosAdvantages.length 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        opportunities,
        stats: {
          totalOpportunities: opportunities.length,
          sarosAdvantages: totalSarosAdvantages,
          averageAdvantage: avgAdvantage,
          bestAdvantage: opportunities[0]?.advantage || 0
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch opportunities' 
      },
      { status: 500 }
    );
  }
}