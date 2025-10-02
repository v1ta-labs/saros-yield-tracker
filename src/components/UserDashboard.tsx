'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle,
  Zap,
  BarChart3,
  Coins,
  Activity,
} from 'lucide-react';
import { UserPortfolio, OptimizationRecommendation } from '@/lib/user-positions.service';

interface UserDashboardProps {
  portfolio: UserPortfolio | null;
  recommendations: OptimizationRecommendation[];
  marketComparison: {
    performanceVsMarket: number;
    rank: string;
    betterThan: number;
  } | null;
}

export const UserDashboard = ({
  portfolio,
  recommendations,
  marketComparison,
}: UserDashboardProps) => {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to see your positions and personalized recommendations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolio) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">Scanning your DLMM positions...</p>
            <p className="text-xs text-muted-foreground/70">Checking pools for your liquidity positions</p>
            <p className="text-xs text-muted-foreground/50 mt-2">Using Helius RPC for faster results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if portfolio is empty
  const hasPositions = portfolio.positionCount > 0;

  if (!hasPositions) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Coins className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Positions Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You don't have any active positions on Saros Finance yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Start by adding liquidity to DLMM pools or participating in farms and staking.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${portfolio.totalValueUSD.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {portfolio.positionCount} position{portfolio.positionCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your APY
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {portfolio.weightedAvgAPY.toFixed(2)}%
            </div>
            {marketComparison && marketComparison.performanceVsMarket != null && (
              <p className="text-xs text-muted-foreground mt-1">
                {marketComparison.performanceVsMarket > 0 ? '+' : ''}
                {marketComparison.performanceVsMarket.toFixed(2)}% vs market
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily Earnings
            </CardTitle>
            <Coins className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${portfolio.totalDailyEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ${(portfolio.totalDailyEarnings * 365).toFixed(2)}/year
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unclaimed Rewards
            </CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              ${portfolio.totalUnclaimedRewards.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready to claim</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison */}
      {marketComparison && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Performance vs Market
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                  <p className="text-2xl font-bold text-primary">{marketComparison.rank}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Better Than</p>
                  <p className="text-2xl font-bold">{marketComparison.betterThan.toFixed(0)}%</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${marketComparison.betterThan}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                {marketComparison.performanceVsMarket > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">
                      Outperforming market by {marketComparison.performanceVsMarket.toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">
                      Underperforming market by {Math.abs(marketComparison.performanceVsMarket).toFixed(2)}%
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Recommendations */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Portfolio Optimized!</h3>
              <p className="text-sm text-muted-foreground">
                Your portfolio is performing well. Keep monitoring for new opportunities.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    rec.priority === 'high'
                      ? 'border-red-500/30 bg-red-500/5'
                      : rec.priority === 'medium'
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-blue-500/30 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        rec.priority === 'high'
                          ? 'text-red-500'
                          : rec.priority === 'medium'
                          ? 'text-yellow-500'
                          : 'text-blue-500'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <Badge
                          variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      {rec.potentialGain > 0 && (
                        <p className="text-sm font-medium text-green-500 mb-2">
                          Potential gain: +{rec.potentialGain.toFixed(2)}% APY
                        </p>
                      )}
                      <p className="text-xs text-primary font-medium">{rec.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Positions Breakdown */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Your DLMM Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolio.dlmmPositions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No DLMM positions</p>
          ) : (
            <div className="space-y-3">
              {portfolio.dlmmPositions.map((pos, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-semibold text-base">
                        {pos.tokenXSymbol}/{pos.tokenYSymbol}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Bins: {pos.lowerBinId} → {pos.upperBinId}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      {pos.currentAPY.toFixed(2)}% APY
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Total Value</p>
                      <p className="font-medium">${pos.totalValueUSD.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Daily Earnings</p>
                      <p className="font-medium text-green-500">
                        ${pos.estimatedDailyEarnings.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">{pos.tokenXSymbol} Amount</p>
                      <p className="font-medium">{pos.tokenXAmount.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">{pos.tokenYSymbol} Amount</p>
                      <p className="font-medium">{pos.tokenYAmount.toFixed(4)}</p>
                    </div>
                  </div>
                  {(pos.unclaimedFeesX > 0 || pos.unclaimedFeesY > 0) && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-yellow-500 font-medium">
                        Unclaimed Fees: {pos.unclaimedFeesX.toFixed(4)} {pos.tokenXSymbol} + {pos.unclaimedFeesY.toFixed(4)} {pos.tokenYSymbol}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
