import { NextRequest, NextResponse } from 'next/server';
import { YieldService } from '@/lib/yield.service';

const yieldService = new YieldService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const protocol = searchParams.get('protocol');

    let yields;
    
    if (token) {
      yields = await yieldService.getYieldsByToken(token);
    } else if (protocol) {
      yields = await yieldService.getYieldsByProtocol(protocol);
    } else {
      yields = await yieldService.getAllYields();
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
    yieldService.clearCache();
    const yields = await yieldService.getAllYields();
    
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