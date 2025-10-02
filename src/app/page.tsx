'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OpportunityCard } from '@/components/opportunity-card';
import { YieldComparisonTable } from '@/components/yield-comparison-table';
import { WalletButton } from '@/components/WalletButton';
import { UserDashboard } from '@/components/UserDashboard';
import {
  TrendingUp,
  DollarSign,
  Activity,
  Percent,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  User
} from 'lucide-react';
import { Opportunity, YieldData } from '@/types';
import { UserPortfolio, OptimizationRecommendation } from '@/lib/user-positions.service';

export default function Home() {
  const { connected, publicKey } = useWallet();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [yields, setYields] = useState<YieldData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [userPortfolio, setUserPortfolio] = useState<UserPortfolio | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [marketComparison, setMarketComparison] = useState<any>(null);
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    sarosAdvantages: 0,
    averageAdvantage: 0,
    bestAdvantage: 0
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserData();
    } else {
      setUserPortfolio(null);
      setRecommendations([]);
      setMarketComparison(null);
    }
  }, [connected, publicKey]);

  const fetchData = async () => {
    if (!loading) setRefreshing(true);

    try {
      const [opportunitiesRes, yieldsRes] = await Promise.all([
        fetch('/api/opportunities'),
        fetch('/api/yields')
      ]);

      const opportunitiesData = await opportunitiesRes.json();
      const yieldsData = await yieldsRes.json();

      if (opportunitiesData.success) {
        setOpportunities(opportunitiesData.data.opportunities);
        setStats(opportunitiesData.data.stats);
      }

      if (yieldsData.success) {
        setYields(yieldsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserData = async () => {
    if (!publicKey) return;

    try {
      const res = await fetch(`/api/user/portfolio?wallet=${publicKey.toBase58()}`);
      const data = await res.json();

      if (data.success) {
        setUserPortfolio(data.data.portfolio);
        setRecommendations(data.data.recommendations);
        setMarketComparison(data.data.marketComparison);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const topOpportunities = opportunities.slice(0, 6);
  const sarosAdvantages = opportunities.filter(op => op.advantage > 0);
  const totalTVL = yields.reduce((sum, y) => sum + y.tvl, 0);
  const avgAPY = yields.length > 0 ? yields.reduce((sum, y) => sum + y.apy, 0) / yields.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="grid-pattern fixed inset-0 z-0 opacity-30" />

      <div className="relative z-10">
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 glow-primary">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold gradient-text">
                    Saros Yield Tracker
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Real-time DeFi Intelligence
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="gap-2 px-3 border-primary/30">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs">Live</span>
                </Badge>
                {connected && (
                  <Button
                    onClick={() => setShowUserDashboard(!showUserDashboard)}
                    size="sm"
                    variant={showUserDashboard ? "default" : "outline"}
                    className="gap-2 text-foreground hover:text-foreground"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {showUserDashboard ? 'Market View' : 'My Portfolio'}
                    </span>
                  </Button>
                )}
                <Button
                  onClick={fetchData}
                  disabled={refreshing}
                  size="sm"
                  variant="outline"
                  className="gap-2 text-foreground hover:text-foreground"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <WalletButton />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showUserDashboard && connected ? (
            <UserDashboard
              portfolio={userPortfolio}
              recommendations={recommendations}
              marketComparison={marketComparison}
            />
          ) : (
            <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Value Locked
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${(totalTVL / 1_000_000).toFixed(2)}M
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {yields.length} pools
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average APY
                </CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {avgAPY.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Market average
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 glow-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saros Advantages
                </CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {stats.sarosAdvantages}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Leading opportunities
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Best Advantage
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  +{stats.bestAdvantage.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  vs competition
                </p>
              </CardContent>
            </Card>
          </div>

          {sarosAdvantages.length > 0 && (
            <div className="mb-8">
              <div className="rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 glow-primary flex-shrink-0">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      🎯 Saros Leading in {sarosAdvantages.length} Markets
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Saros is currently offering superior yields on{' '}
                      <span className="text-primary font-semibold">
                        {sarosAdvantages.map(op => op.token).join(', ')}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Activity className="w-3 h-3" />
                      <span>Average advantage: {stats.averageAdvantage.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  Top Opportunities
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Best yield opportunities across Solana DeFi
                </p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse bg-card/50">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded w-5/6" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topOpportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.token}
                    opportunity={opportunity}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <YieldComparisonTable initialData={yields} loading={loading} />
          </div>
            </>
          )}
        </main>

        <footer className="border-t border-border mt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                <p>Built for the Saros ecosystem • Data updates every 15 minutes</p>
              </div>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  Powered by Solana
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  Real-time data
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-purple-500" />
                  5+ protocols
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
