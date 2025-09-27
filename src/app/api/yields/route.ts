import { NextRequest, NextResponse } from 'next/server';
import { YieldFetcher } from '@/lib/yield-fetcher';

const yieldFetcher = new YieldFetcher();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const protocol = searchParams.get('protocol');

    let yields;
    
    if (token) {
      yields = await yieldFetcher.getYieldsByToken(token);
    } else if (protocol) {
      yields = await yieldFetcher.getYieldsByProtocol(protocol);
    } else {
      yields = await yieldFetcher.getAllYields();
    }

    return NextResponse.json({
      success: true,
      data: yields,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching yields:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch yield data' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    yieldFetcher.clearCache();
    const yields = await yieldFetcher.getAllYields();
    
    return NextResponse.json({
      success: true,
      message: 'Yield data refreshed',
      data: yields,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error refreshing yields:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to refresh yield data' 
      },
      { status: 500 }
    );
  }
}