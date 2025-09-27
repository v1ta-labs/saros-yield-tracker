import { NextRequest, NextResponse } from 'next/server';
import { SarosYieldBot } from '@/bot/index';

let botInstance: SarosYieldBot | null = null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!botInstance) {
      botInstance = new SarosYieldBot();
    }
    const bot = botInstance.getBotInstance();
    await bot.handleUpdate(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Telegram webhook endpoint',
    status: 'active',
    timestamp: new Date().toISOString()
  });
}