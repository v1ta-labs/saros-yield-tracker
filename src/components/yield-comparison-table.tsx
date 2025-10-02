'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trophy, ArrowUpDown, Sparkles } from 'lucide-react';
import { YieldData, SUPPORTED_TOKENS, PROTOCOLS } from '@/types';
import { formatPercentage, formatNumber } from '@/lib/utils';

interface YieldComparisonTableProps {
  initialData?: YieldData[];
  loading?: boolean;
}

export function YieldComparisonTable({ initialData = [], loading: initialLoading = false }: YieldComparisonTableProps) {
  const [yields, setYields] = useState<YieldData[]>(initialData);
  const [loading, setLoading] = useState(initialLoading);
  const [sortBy, setSortBy] = useState<'token' | 'apy'>('apy');

  useEffect(() => {
    setYields(initialData);
  }, [initialData]);

  useEffect(() => {
    setLoading(initialLoading);
  }, [initialLoading]);

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

  const groupedYields = yields.reduce((acc, yieldData) => {
    if (!acc[yieldData.token]) {
      acc[yieldData.token] = {};
    }
    acc[yieldData.token][yieldData.protocol] = yieldData;
    return acc;
  }, {} as Record<string, Record<string, YieldData>>);

  const sortedTokens = [...SUPPORTED_TOKENS].sort((a, b) => {
    if (sortBy === 'token') return a.localeCompare(b);

    const aYields = Object.values(groupedYields[a] || {});
    const bYields = Object.values(groupedYields[b] || {});
    const aMax = aYields.length > 0 ? Math.max(...aYields.map(y => y.apy)) : 0;
    const bMax = bYields.length > 0 ? Math.max(...bYields.map(y => y.apy)) : 0;
    return bMax - aMax;
  });

  const getBestProtocolForToken = (token: string): { protocol: string; apy: number } | null => {
    const tokenYields = groupedYields[token];
    if (!tokenYields || Object.keys(tokenYields).length === 0) return null;

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
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span className="gradient-text">Yield Comparison</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time yields across major Solana DeFi protocols
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy(sortBy === 'token' ? 'apy' : 'token')}
            >
              <ArrowUpDown className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Sort by {sortBy === 'token' ? 'APY' : 'Token'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchYields}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold text-foreground">Token</th>
                  {Object.values(PROTOCOLS).map(protocol => (
                    <th key={protocol.name} className="text-center p-4 font-semibold">
                      <span className="text-muted-foreground">{protocol.name}</span>
                    </th>
                  ))}
                  <th className="text-center p-4 font-semibold text-foreground">Leader</th>
                </tr>
              </thead>
              <tbody>
                {sortedTokens.map(token => {
                  const tokenYields = groupedYields[token] || {};
                  const bestForToken = getBestProtocolForToken(token);
                  const sarosIsBest = isSarosBest(token);

                  return (
                    <tr key={token} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{token}</span>
                          {sarosIsBest && (
                            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                          )}
                        </div>
                      </td>

                      {Object.keys(PROTOCOLS).map(protocolKey => {
                        const protocol = PROTOCOLS[protocolKey as keyof typeof PROTOCOLS];
                        const yieldData = tokenYields[protocol.name];
                        const isBest = bestForToken?.protocol === protocol.name;
                        const isSaros = protocol.name === 'Saros';

                        return (
                          <td key={protocol.name} className="p-4 text-center">
                            {yieldData ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className={`text-base font-bold ${isBest ? 'text-primary' : 'text-foreground'}`}>
                                  {formatPercentage(yieldData.apy)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ${formatNumber(yieldData.tvl)}
                                </div>
                                {isSaros && sarosIsBest && (
                                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                                    🚀 Best
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="p-4 text-center">
                        {bestForToken && (
                          <Badge
                            variant={sarosIsBest ? "default" : "outline"}
                            className={`${sarosIsBest ? 'bg-primary/20 text-primary border-primary/30 glow-primary' : ''}`}
                          >
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
        )}

        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
          <p>📊 Data refreshes every 15 minutes</p>
          <p>🚀 Saros advantages highlighted in green</p>
        </div>
      </CardContent>
    </Card>
  );
}
