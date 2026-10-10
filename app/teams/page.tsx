'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Users, ShieldAlert, Shield, Activity, Mail, TrendingUp, ArrowRight } from 'lucide-react';
import { useCensus } from '@/lib/census-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RiskTierBadge } from '@/components/risk-tier-badge';
import { cn } from '@/lib/utils';

export default function TeamsPage() {
  const { endpoints, teams } = useCensus();

  const teamStats = useMemo(() => {
    return teams.map((team) => {
      const teamApis = endpoints.filter((e) => e.teamId === team.id);
      const shadowApis = teamApis.filter((e) => e.isShadow);
      const documentedApis = teamApis.filter((e) => e.isDocumented && !e.isZombie);
      const zombieApis = teamApis.filter((e) => e.isZombie);
      const criticalCount = shadowApis.filter((e) => e.riskTier === 'critical').length;
      const highCount = shadowApis.filter((e) => e.riskTier === 'high').length;
      const piiCount = shadowApis.filter((e) => e.piiFields.length > 0).length;
      const totalCalls = teamApis.reduce((sum, e) => sum + e.callCount, 0);

      return {
        ...team,
        totalApis: teamApis.length,
        shadowCount: shadowApis.length,
        documentedCount: documentedApis.length,
        zombieCount: zombieApis.length,
        criticalCount,
        highCount,
        piiCount,
        totalCalls,
        topShadowApis: [...shadowApis].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3),
      };
    });
  }, [endpoints, teams]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Team Ownership
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Shadow API inventory organized by owning team. Assign ownership to ensure accountability for undocumented endpoints.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Teams</p>
            <p className="text-3xl font-bold mt-2">{teams.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Unassigned Shadow APIs</p>
            <p className="text-3xl font-bold mt-2 text-destructive">
              {endpoints.filter((e) => e.isShadow).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical Risk Teams</p>
            <p className="text-3xl font-bold mt-2 text-destructive">
              {teamStats.filter((t) => t.criticalCount > 0).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total API Calls</p>
            <p className="text-3xl font-bold mt-2">
              {endpoints.reduce((s, e) => s + e.callCount, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teamStats.map((team) => (
          <Card key={team.id} className="overflow-hidden">
            <CardHeader className="border-b border-border" style={{ borderTopColor: team.color, borderTopWidth: 3 }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${team.color}20`, color: team.color }}>
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{team.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" /> {team.ownerName}
                    </CardDescription>
                  </div>
                </div>
                {team.criticalCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse-slow">
                    {team.criticalCount} Critical
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Stat row */}
              <div className="grid grid-cols-4 gap-2">
                <StatBox label="Total APIs" value={team.totalApis} />
                <StatBox label="Shadow" value={team.shadowCount} danger={team.shadowCount > 0} />
                <StatBox label="Documented" value={team.documentedCount} />
                <StatBox label="Zombie" value={team.zombieCount} muted={team.zombieCount > 0} />
              </div>

              {/* Risk heatmap bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Risk Distribution</span>
                  <span className="text-xs text-muted-foreground">{team.totalCalls.toLocaleString()} calls</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
                  {team.totalApis > 0 && (
                    <>
                      <div className="bg-destructive" style={{ width: `${(team.criticalCount / team.totalApis) * 100}%` }} />
                      <div className="bg-chart-2" style={{ width: `${(team.highCount / team.totalApis) * 100}%` }} />
                      <div className="bg-chart-3" style={{ width: `${((team.shadowCount - team.criticalCount - team.highCount) / team.totalApis) * 100}%` }} />
                      <div className="bg-primary" style={{ width: `${(team.documentedCount / team.totalApis) * 100}%` }} />
                      <div className="bg-muted-foreground/30" style={{ width: `${(team.zombieCount / team.totalApis) * 100}%` }} />
                    </>
                  )}
                </div>
              </div>

              {/* Top shadow APIs */}
              {team.topShadowApis.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                    Top Shadow APIs
                  </span>
                  {team.topShadowApis.map((api) => (
                    <Link
                      key={api.id}
                      href={`/shadow-apis/${api.id}`}
                      className="flex items-center gap-2 rounded-md border border-border p-2 hover:border-primary/50 hover:bg-secondary/30 transition-all group"
                    >
                      <span className={cn(
                        'flex h-7 w-7 items-center justify-center rounded text-xs font-bold',
                        api.riskTier === 'critical' ? 'bg-destructive/10 text-destructive' : api.riskTier === 'high' ? 'bg-chart-2/10 text-chart-2' : 'bg-secondary text-muted-foreground',
                      )}>
                        {api.riskScore}
                      </span>
                      <Badge variant="outline" className="font-mono text-xs shrink-0">{api.method}</Badge>
                      <span className="text-xs font-mono truncate flex-1 group-hover:text-primary transition-colors">
                        {api.path.replace('/api/v1/', '')}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              )}

              {team.shadowCount === 0 && (
                <div className="flex items-center gap-2 rounded-md bg-chart-4/10 p-3">
                  <Shield className="h-4 w-4 text-chart-4" />
                  <span className="text-sm text-chart-4 font-medium">No shadow APIs — fully documented</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value, danger, muted }: { label: string; value: number; danger?: boolean; muted?: boolean }) {
  return (
    <div className="rounded-lg border border-border p-2.5 text-center">
      <p className={cn(
        'text-xl font-bold tabular-nums',
        danger && 'text-destructive',
        muted && 'text-muted-foreground',
      )}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
