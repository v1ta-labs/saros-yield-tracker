import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json({
        success: false,
        error: 'Bot token not configured'
      }, { status: 500 });
    }
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();

    if (data.ok) {
      return NextResponse.json({
        success: true,
        bot: data.result,
        webhook: {
          configured: !!process.env.WEBHOOK_URL,
          url: process.env.WEBHOOK_URL
        },
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Bot not accessible',
        details: data
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error checking bot status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check bot status'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { webhookUrl } = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json({
        success: false,
        error: 'Bot token not configured'
      }, { status: 500 });
    }
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl
      })
    });

    const data = await response.json();

    return NextResponse.json({
      success: data.ok,
      message: data.description,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error setting webhook:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to set webhook'
    }, { status: 500 });
  }
}