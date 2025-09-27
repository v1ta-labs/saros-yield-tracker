'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Bell, ExternalLink, Copy, Check } from 'lucide-react';

export function TelegramIntegration() {
  const [copied, setCopied] = useState(false);
  const botUsername = "SarosYieldTrackerBot";

  const copyBotLink = async () => {
    const botLink = `https://t.me/${botUsername}`;
    await navigator.clipboard.writeText(botLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          Get Telegram Alerts
        </CardTitle>
        <CardDescription>
          Never miss a yield opportunity with our Telegram bot
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">🔔 Real-time Alerts</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Yield threshold notifications</li>
              <li>• Saros advantage alerts</li>
              <li>• Best opportunity updates</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">🤖 Bot Commands</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• /yields - Current comparison</li>
              <li>• /opportunities - Best Saros deals</li>
              <li>• /alert - Set custom alerts</li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => window.open(`https://t.me/${botUsername}`, '_blank')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Start Bot
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={copyBotLink}
            className="flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
        </div>
        
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Bot Status:</span>
            <Badge variant="success" className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Online
            </Badge>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
          💡 <strong>Pro tip:</strong> Set alerts for your favorite tokens and get notified instantly when Saros offers better yields than the competition!
        </div>
      </CardContent>
    </Card>
  );
}