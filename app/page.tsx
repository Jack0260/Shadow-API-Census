'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Eye,
  Lock,
  TrendingUp,
  ArrowRight,
  FileJson,
  Ban,
  Network,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { useCensus } from '@/lib/census-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RiskTierBadge } from '@/components/risk-tier-badge';
import { cn } from '@/lib/utils';

const tierColors: Record<string, string> = {
  critical: 'hsl(var(--chart-1))',
  high: 'hsl(var(--chart-2))',
  medium: 'hsl(var(--chart-3))',
  low: 'hsl(var(--chart-4))',
};

export default function DashboardPage() {
  const { censusResult, endpoints, auditLog, teams } = useCensus();

  const shadowApis = endpoints.filter((e) => e.isShadow);
  const topShadowApis = [...shadowApis]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const tierData = [
    { name: 'Critical', count: censusResult.criticalCount, fill: tierColors.critical },
    { name: 'High', count: censusResult.highCount, fill: tierColors.high },
    { name: 'Medium', count: censusResult.mediumCount, fill: tierColors.medium },
    { name: 'Low', count: censusResult.lowCount, fill: tierColors.low },
  ];

  const coverageData = [
    { name: 'Documented', value: censusResult.documentedApis, fill: 'hsl(var(--chart-4))' },
    { name: 'Shadow', value: censusResult.shadowApis, fill: 'hsl(var(--chart-1))' },
    { name: 'Zombie', value: censusResult.zombieApis, fill: 'hsl(var(--muted-foreground))' },
  ];

  // Generate hourly call distribution
  const hourlyData = Array.from({ length: 12 }, (_, i) => {
    const hour = i * 5;
    const shadowCalls = Math.floor(Math.random() * 800) + 100 + i * 50;
    const legitCalls = Math.floor(Math.random() * 3000) + 1000 + i * 200;
    return {
      time: `${hour}m`,
      shadow: shadowCalls,
      legitimate: legitCalls,
    };
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shadow API Census</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comparing 1 hour of live API Gateway traffic against your Swagger documentation
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/api-map">
            <Button variant="outline" size="sm">
              <Network className="h-4 w-4 mr-2" />
              API Map
            </Button>
          </Link>
          <Link href="/shadow-apis">
            <Button size="sm">
              <ShieldAlert className="h-4 w-4 mr-2" />
              View Shadow APIs
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ShieldAlert className="h-5 w-5" />}
          label="Shadow APIs Found"
          value={censusResult.shadowApis}
          subtext={`${censusResult.criticalCount} critical risk`}
          accent="destructive"
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Total Calls Analyzed"
          value={censusResult.totalCalls.toLocaleString()}
          subtext="1-hour window"
          accent="primary"
        />
        <StatCard
          icon={<Eye className="h-5 w-5" />}
          label="PII-Exposing Endpoints"
          value={censusResult.piiExposedCount}
          subtext="Undocumented endpoints"
          accent="warning"
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="API Surface Coverage"
          value={`${censusResult.coveragePercent}%`}
          subtext={`${censusResult.documentedApis} of ${censusResult.totalApis} documented`}
          accent="success"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Traffic chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Traffic Comparison — Shadow vs Documented</CardTitle>
            <CardDescription>API calls over the 1-hour census window (5-min intervals)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="shadowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="legitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="legitimate"
                  name="Documented APIs"
                  stroke="hsl(var(--chart-3))"
                  fill="url(#legitGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="shadow"
                  name="Shadow APIs"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#shadowGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Coverage radial */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API Documentation Coverage</CardTitle>
            <CardDescription>Documented vs undocumented endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadialBarChart
                innerRadius="50%"
                outerRadius="90%"
                data={coverageData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, censusResult.totalApis]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={6} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {coverageData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ background: d.fill }} />
                  <span className="text-xs text-muted-foreground">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk distribution + Top shadow APIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Tier Distribution</CardTitle>
            <CardDescription>Shadow APIs by risk level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tierData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top shadow APIs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Highest-Risk Shadow APIs</CardTitle>
                <CardDescription>Endpoints called in production but missing from your Swagger</CardDescription>
              </div>
              <Link href="/shadow-apis">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {topShadowApis.map((api) => {
              const team = teams.find((t) => t.id === api.teamId);
              return (
                <Link
                  key={api.id}
                  href={`/shadow-apis/${api.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/50 hover:bg-secondary/50 transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive font-bold text-xs">
                    {api.riskScore}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {api.method}
                      </Badge>
                      <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {api.path}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {api.piiFields.length > 0
                        ? `${api.piiFields.length} PII fields exposed · `
                        : ''}
                      {api.callCount.toLocaleString()} calls · {team?.name}
                    </p>
                  </div>
                  <RiskTierBadge tier={api.riskTier} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions + Recent audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/api-map">
              <Button variant="outline" className="w-full justify-start">
                <Network className="h-4 w-4 mr-2" />
                View API Dependency Map
              </Button>
            </Link>
            <Link href="/shadow-apis">
              <Button variant="outline" className="w-full justify-start">
                <ShieldAlert className="h-4 w-4 mr-2" />
                Review Shadow API Inventory
              </Button>
            </Link>
            <Link href="/teams">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Assign Team Ownership
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Audit Activity</CardTitle>
                <CardDescription>Latest census and security events</CardDescription>
              </div>
              <Link href="/audit-log">
                <Button variant="ghost" size="sm">
                  Full Log
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {auditLog.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <div
                  className={cn(
                    'mt-0.5 h-2 w-2 rounded-full shrink-0',
                    entry.severity === 'critical'
                      ? 'bg-destructive'
                      : entry.severity === 'warning'
                        ? 'bg-chart-2'
                        : 'bg-primary',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{entry.action}</span>
                  <span className="text-muted-foreground"> — {entry.targetApiPath}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Security badges */}
      <div className="flex flex-wrap gap-3 pb-6">
        <SecurityBadge icon={<Ban />} label="1-Click Block Rules" />
        <SecurityBadge icon={<FileJson />} label="Auto-OpenAPI Spec Generation" />
        <SecurityBadge icon={<Lock />} label="Auth Gap Detection" />
        <SecurityBadge icon={<Eye />} label="PII Exposure Scanning" />
        <SecurityBadge icon={<Shield />} label="Multi-Team Ownership" />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
  accent: 'destructive' | 'primary' | 'warning' | 'success';
}) {
  const accentClasses = {
    destructive: 'text-destructive bg-destructive/10',
    primary: 'text-primary bg-primary/10',
    warning: 'text-chart-2 bg-chart-2/10',
    success: 'text-chart-4 bg-chart-4/10',
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', accentClasses[accent])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
      <span className="text-primary [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      {label}
    </div>
  );
}
