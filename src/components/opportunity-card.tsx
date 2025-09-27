'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { Opportunity } from '@/types';
import { formatPercentage } from '@/lib/utils';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const isAdvantage = opportunity.advantage > 0;
  const advantageColor = isAdvantage ? 'text-green-600' : 'text-red-600';
  const TrendIcon = isAdvantage ? TrendingUp : TrendingDown;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">{opportunity.token}</CardTitle>
            <CardDescription>
              {isAdvantage ? 'Saros Advantage' : 'Competition Leads'}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {[...Array(Math.floor(opportunity.score))].map((_, i) => (
              <span key={i} className="text-yellow-400">★</span>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">Saros APY</div>
            <div className="font-semibold text-green-600">
              {formatPercentage(opportunity.sarosAPY)}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Best Alternative ({opportunity.bestProtocol})
            </div>
            <div className="font-semibold">
              {formatPercentage(opportunity.bestAPY)}
            </div>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Difference</div>
              <div className={`font-bold flex items-center gap-1 ${advantageColor}`}>
                <TrendIcon className="w-4 h-4" />
                {isAdvantage ? '+' : ''}{formatPercentage(opportunity.advantage)}
              </div>
            </div>
          </div>
          
          {isAdvantage && (
            <Badge variant="success" className="w-full justify-center">
              🚀 Saros Advantage!
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}