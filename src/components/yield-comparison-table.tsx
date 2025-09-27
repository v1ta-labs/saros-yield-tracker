'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trophy, ArrowUpDown } from 'lucide-react';
import { YieldData, SUPPORTED_TOKENS, PROTOCOLS } from '@/types';
import { formatPercentage, formatNumber } from '@/lib/utils';

interface YieldComparisonTableProps {
  initialData?: YieldData[];
}

export function YieldComparisonTable({ initialData = [] }: YieldComparisonTableProps) {
  const [yields, setYields] = useState<YieldData[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'token' | 'apy'>('token');

  const fetchYields = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/yields');
      const data = await response.json();
      if (data.success) {
        setYields(data.data);
      }
    } catch (error) {
      console.error('Error fetching yields:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData.length === 0) {
      fetchYields();
    }
  }, [initialData.length]);

  const groupedYields = yields.reduce((acc, yieldData) => {
    if (!acc[yieldData.token]) {
      acc[yieldData.token] = {};
    }
    acc[yieldData.token][yieldData.protocol] = yieldData;
    return acc;
  }, {} as Record<string, Record<string, YieldData>>);

  const sortedTokens = SUPPORTED_TOKENS.sort((a, b) => {
    if (sortBy === 'token') return a.localeCompare(b);
    
    const aMax = Math.max(...Object.values(groupedYields[a] || {}).map(y => y.apy));
    const bMax = Math.max(...Object.values(groupedYields[b] || {}).map(y => y.apy));
    return bMax - aMax;
  });

  const getBestProtocolForToken = (token: string): { protocol: string; apy: number } | null => {
    const tokenYields = groupedYields[token];
    if (!tokenYields) return null;
    
    const best = Object.values(tokenYields).reduce((bestYield, current) => 
      current.apy > bestYield.apy ? current : bestYield
    );
    
    return { protocol: best.protocol, apy: best.apy };
  };

  const isSarosBest = (token: string): boolean => {
    const best = getBestProtocolForToken(token);
    return best?.protocol === 'Saros';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Yield Comparison
            </CardTitle>
            <CardDescription>
              Compare yields across all major Solana DeFi protocols
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy(sortBy === 'token' ? 'apy' : 'token')}
            >
              <ArrowUpDown className="w-4 h-4 mr-1" />
              Sort by {sortBy === 'token' ? 'APY' : 'Token'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchYields}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Token</th>
                {Object.values(PROTOCOLS).map(protocol => (
                  <th key={protocol.name} className="text-center p-3 font-semibold">
                    <span style={{ color: protocol.color }}>{protocol.name}</span>
                  </th>
                ))}
                <th className="text-center p-3 font-semibold">Best</th>
              </tr>
            </thead>
            <tbody>
              {sortedTokens.map(token => {
                const tokenYields = groupedYields[token] || {};
                const bestForToken = getBestProtocolForToken(token);
                const sarosIsBest = isSarosBest(token);
                
                return (
                  <tr key={token} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-semibold">{token}</td>
                    
                    {Object.keys(PROTOCOLS).map(protocolKey => {
                      const protocol = PROTOCOLS[protocolKey as keyof typeof PROTOCOLS];
                      const yieldData = tokenYields[protocol.name];
                      const isBest = bestForToken?.protocol === protocol.name;
                      const isSaros = protocol.name === 'Saros';
                      
                      return (
                        <td key={protocol.name} className="p-3 text-center">
                          {yieldData ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-semibold ${isBest ? 'text-green-600' : ''}`}>
                                {formatPercentage(yieldData.apy)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                TVL: {formatNumber(yieldData.tvl)}
                              </span>
                              {isSaros && sarosIsBest && (
                                <Badge variant="success" className="text-xs">
                                  Leader
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      );
                    })}
                    
                    <td className="p-3 text-center">
                      {bestForToken && (
                        <Badge 
                          variant={sarosIsBest ? "success" : "secondary"}
                          className="flex items-center gap-1"
                        >
                          {sarosIsBest && "🚀"}
                          {bestForToken.protocol}
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>📊 Data refreshes every 15 minutes • 🚀 Green badges indicate Saros advantages</p>
        </div>
      </CardContent>
    </Card>
  );
}