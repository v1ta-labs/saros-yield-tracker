'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { Opportunity } from '@/types';
import { formatPercentage } from '@/lib/utils';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const isAdvantage = opportunity.advantage > 0;
  const advantageColor = isAdvantage ? 'text-primary' : 'text-red-500';
  const TrendIcon = isAdvantage ? TrendingUp : TrendingDown;

  return (
    <Card className={`group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 ${isAdvantage ? 'hover:border-primary/50 hover:glow-primary' : ''}`}>
      {isAdvantage && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      )}

      <CardHeader className="relative pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-bold text-foreground">
              {opportunity.token}
            </CardTitle>
            {isAdvantage && (
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            )}
          </div>
          <div className="flex gap-0.5">
            {[...Array(Math.floor(opportunity.score))].map((_, i) => (
              <span key={i} className="text-yellow-500 text-sm">★</span>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isAdvantage ? '🎯 Saros Advantage' : '📊 Market Comparison'}
        </p>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Saros APY</div>
              <div className="text-lg font-bold text-primary">
                {formatPercentage(opportunity.sarosAPY)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="flex justify-between items-center p-3 rounded-lg bg-accent/50">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {opportunity.bestProtocol}
              </div>
              <div className="text-lg font-bold text-foreground">
                {formatPercentage(opportunity.bestAPY)}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              Best Alt
            </Badge>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Difference</span>
            <div className={`font-bold flex items-center gap-1.5 ${advantageColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-lg">
                {isAdvantage ? '+' : ''}{formatPercentage(opportunity.advantage)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
