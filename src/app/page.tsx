'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OpportunityCard } from '@/components/opportunity-card';
import { YieldComparisonTable } from '@/components/yield-comparison-table';
import { TelegramIntegration } from '@/components/telegram-integration';
import { TrendingUp, DollarSign, Target, Zap } from 'lucide-react';
import { Opportunity, YieldData } from '@/types';

export default function Home() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [yields, setYields] = useState<YieldData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    sarosAdvantages: 0,
    averageAdvantage: 0,
    bestAdvantage: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
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
    }
  };

  const topOpportunities = opportunities.slice(0, 3);
  const sarosAdvantages = opportunities.filter(op => op.advantage > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Saros Yield Tracker
              </h1>
              <p className="text-gray-600">
                Find the best yields on Solana DeFi
              </p>
            </div>
            <Badge variant="success" className="hidden sm:flex">
              🟢 Live Data
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
            <CardContent className="p-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">
                  Discover Superior Yields with Saros
                </h2>
                <p className="text-xl mb-6 opacity-90">
                  Compare yields across Jupiter, Raydium, Meteora, and Kamino
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalOpportunities}</div>
                    <div className="text-sm opacity-80">Total Pools</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.sarosAdvantages}</div>
                    <div className="text-sm opacity-80">Saros Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {stats.averageAdvantage.toFixed(1)}%
                    </div>
                    <div className="text-sm opacity-80">Avg Advantage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {stats.bestAdvantage.toFixed(1)}%
                    </div>
                    <div className="text-sm opacity-80">Best Lead</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold">🎯 Top Opportunities</h3>
              <p className="text-gray-600">
                Best yield opportunities right now
              </p>
            </div>
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topOpportunities.map((opportunity) => (
              <OpportunityCard 
                key={opportunity.token} 
                opportunity={opportunity} 
              />
            ))}
          </div>

          {sarosAdvantages.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                🚀 Saros Advantages Found!
              </h4>
              <p className="text-green-700 text-sm">
                Saros is currently offering better yields than competitors on{' '}
                <span className="font-semibold">
                  {sarosAdvantages.map(op => op.token).join(', ')}
                </span>
              </p>
            </div>
          )}
        </section>

        <section className="mb-8">
          <TelegramIntegration />
        </section>

        <section className="mb-8">
          <YieldComparisonTable initialData={yields} />
        </section>

        <footer className="text-center py-8 text-gray-500">
          <div className="space-y-2">
            <p className="text-sm">
              Built for the Saros ecosystem • Data updates every 15 minutes
            </p>
            <div className="flex justify-center items-center gap-4 text-xs">
              <span>🔗 Powered by Solana</span>
              <span>📊 Real-time DeFi data</span>
              <span>🤖 Telegram alerts</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}