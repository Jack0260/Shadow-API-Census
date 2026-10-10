'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  Eye,
  Lock,
  LockOpen,
  Users,
  Activity,
  FileJson,
  Ban,
  Copy,
  Check,
  Download,
  Clock,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { useCensus } from '@/lib/census-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RiskTierBadge, RiskScoreBadge } from '@/components/risk-tier-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { HttpMethod } from '@/lib/types';

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  POST: 'bg-chart-4/15 text-chart-4 border-chart-4/30',
  PUT: 'bg-chart-2/15 text-chart-2 border-chart-2/30',
  PATCH: 'bg-chart-5/15 text-chart-5 border-chart-5/30',
  DELETE: 'bg-destructive/15 text-destructive border-destructive/30',
};

const piiTypeColors: Record<string, string> = {
  ssn: 'text-destructive bg-destructive/10',
  credit_card: 'text-destructive bg-destructive/10',
  auth_token: 'text-destructive bg-destructive/10',
  api_key: 'text-destructive bg-destructive/10',
  password: 'text-destructive bg-destructive/10',
  email: 'text-chart-2 bg-chart-2/10',
  phone: 'text-chart-2 bg-chart-2/10',
  address: 'text-chart-2 bg-chart-2/10',
  dob: 'text-chart-2 bg-chart-2/10',
  name: 'text-chart-3 bg-chart-3/10',
  ip: 'text-muted-foreground bg-muted',
};

export default function ShadowApiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { endpoints, teams, generateSpec, createBlockRule, blockRules, assignTeam } = useCensus();
  const apiId = params?.id as string;
  const api = endpoints.find((e) => e.id === apiId);

  const [activeSpec, setActiveSpec] = useState<string | null>(null);
  const [blockFormat, setBlockFormat] = useState<'nginx' | 'kong' | 'envoy'>('nginx');
  const [activeBlockRule, setActiveBlockRule] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const team = teams.find((t) => t.id === api?.teamId);
  const apiBlockRule = blockRules.find((r) => r.apiId === apiId);

  const callTimeline = useMemo(() => {
    if (!api) return [];
    return Array.from({ length: 12 }, (_, i) => ({
      time: `${i * 5}m`,
      calls: Math.floor(api.callCount / 12 * (0.5 + Math.random())),
    }));
  }, [api]);

  const statusCodeData = useMemo(() => {
    if (!api) return [];
    return Object.entries(api.statusCodeDistribution).map(([code, count]) => ({
      name: code,
      value: count,
      fill: code === '200' ? '#22c55e' : code === '401' ? '#f59e0b' : code === '403' ? '#f59e0b' : code === '404' ? '#6b7280' : '#ef4444',
    }));
  }, [api]);

  if (!api) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <Button variant="ghost" onClick={() => router.push('/shadow-apis')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Shadow APIs
        </Button>
        <div className="text-center py-20">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">API not found</p>
        </div>
      </div>
    );
  }

  const handleGenerateSpec = () => {
    const spec = generateSpec(api.id);
    setActiveSpec(spec);
  };

  const handleBlock = () => {
    const rule = createBlockRule(api.id, blockFormat);
    setActiveBlockRule(rule.rule);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Breadcrumb + header */}
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/shadow-apis')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Shadow APIs
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className={cn('font-mono text-sm border', methodColors[api.method])}>
                {api.method}
              </Badge>
              <h1 className="text-xl lg:text-2xl font-bold font-mono tracking-tight break-all">{api.path}</h1>
              {api.isShadow && <RiskTierBadge tier={api.riskTier} />}
              {api.blocked && <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Blocked</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{api.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {team?.name}</span>
              <span className="flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> {api.callCount.toLocaleString()} calls</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Last seen {new Date(api.lastSeen).toLocaleTimeString()}</span>
              {api.isShadow ? (
                <span className="flex items-center gap-1 text-destructive font-medium"><ShieldAlert className="h-3.5 w-3.5" /> Shadow API — not in Swagger</span>
              ) : api.isZombie ? (
                <span className="flex items-center gap-1 text-muted-foreground"><ShieldAlert className="h-3.5 w-3.5" /> Zombie API — documented but never called</span>
              ) : (
                <span className="flex items-center gap-1 text-chart-4"><Shield className="h-3.5 w-3.5" /> Documented & active</span>
              )}
            </div>
          </div>

          {/* Risk score gauge */}
          <Card className={cn('shrink-0', api.riskTier === 'critical' && 'glow-red')}>
            <CardContent className="pt-6 pb-6 px-8">
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Risk Score</p>
                <p className={cn(
                  'text-5xl font-bold tabular-nums',
                  api.riskTier === 'critical' && 'text-destructive text-glow-red',
                  api.riskTier === 'high' && 'text-chart-2',
                  api.riskTier === 'medium' && 'text-chart-3',
                  api.riskTier === 'low' && 'text-chart-4',
                )}>{api.riskScore}</p>
                <p className="text-xs text-muted-foreground mt-1">out of 100</p>
                <RiskTierBadge tier={api.riskTier} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="callers">Callers</TabsTrigger>
          <TabsTrigger value="data">Data Exposure</TabsTrigger>
          <TabsTrigger value="spec">OpenAPI Spec</TabsTrigger>
          <TabsTrigger value="block">Block Rule</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Risk Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Score Breakdown</CardTitle>
                <CardDescription>How each factor contributes to the total risk score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {api.riskFactors.map((factor) => (
                  <div key={factor.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{factor.label}</span>
                      <span className="text-sm tabular-nums text-muted-foreground">{factor.score}/{factor.maxScore}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          factor.score / factor.maxScore > 0.7 ? 'bg-destructive' : factor.score / factor.maxScore > 0.4 ? 'bg-chart-2' : 'bg-chart-4',
                        )}
                        style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{factor.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Status Code Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Response Status Codes</CardTitle>
                <CardDescription>Distribution of HTTP response codes observed</CardDescription>
              </CardHeader>
              <CardContent>
                {statusCodeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statusCodeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                        {statusCodeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-10">No calls recorded</p>
                )}
                <div className="flex justify-center gap-4 mt-2 flex-wrap">
                  {statusCodeData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.fill }} />
                      <span className="text-muted-foreground">{d.name}: {d.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Endpoint metadata */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={<Lock className="h-4 w-4" />} label="Authentication" value={api.authRequired ? 'Required' : 'Not Required'} subtext={api.authDetected ? 'Tokens detected' : 'No tokens observed'} danger={!api.authRequired || (!api.authDetected && api.authRequired)} />
            <MetricCard icon={<Eye className="h-4 w-4" />} label="PII Fields" value={api.piiFields.length.toString()} subtext={api.piiFields.filter(p => p.sensitivity === 'high').length > 0 ? `${api.piiFields.filter(p => p.sensitivity === 'high').length} high sensitivity` : 'No high-sensitivity PII'} danger={api.piiFields.filter(p => p.sensitivity === 'high').length > 0} />
            <MetricCard icon={<Users className="h-4 w-4" />} label="Distinct Callers" value={api.callerCount.toString()} subtext={api.distinctCallers.filter(c => !c.hasAuth).length > 0 ? `${api.distinctCallers.filter(c => !c.hasAuth).length} without auth` : 'All authenticated'} danger={api.distinctCallers.filter(c => !c.hasAuth).length > 0} />
            <MetricCard icon={<Activity className="h-4 w-4" />} label="Avg Response Time" value={`${api.avgResponseTimeMs}ms`} subtext={`First seen ${new Date(api.firstSeen).toLocaleTimeString()}`} />
          </div>

          {/* Team ownership */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team Ownership</CardTitle>
              <CardDescription>Assign or transfer ownership of this shadow API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: team?.color }} />
                  <span className="text-sm font-medium">{team?.name}</span>
                  <span className="text-xs text-muted-foreground">— {team?.ownerName}</span>
                </div>
                <Select value={api.teamId} onValueChange={(v) => assignTeam(api.id, v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Callers Tab */}
        <TabsContent value="callers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Call Frequency Over Time</CardTitle>
              <CardDescription>Calls to this endpoint during the 1-hour census window</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={callTimeline}>
                  <defs>
                    <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="calls" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ fill: 'hsl(var(--destructive))', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distinct Callers</CardTitle>
              <CardDescription>{api.distinctCallers.length} services called this endpoint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {api.distinctCallers.map((caller) => (
                <div key={caller.ip} className="flex items-center gap-4 rounded-lg border border-border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                    <Server className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium">{caller.ip}</span>
                      {caller.hasAuth ? (
                        <Badge variant="outline" className="text-chart-4 border-chart-4/30 text-xs"><Lock className="h-3 w-3 mr-1" />Auth</Badge>
                      ) : (
                        <Badge variant="outline" className="text-destructive border-destructive/30 text-xs"><LockOpen className="h-3 w-3 mr-1" />No Auth</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{caller.service}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">{caller.callCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">calls</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Exposure Tab */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">PII Data Exposure Analysis</CardTitle>
              <CardDescription>Sensitive data fields observed in API responses</CardDescription>
            </CardHeader>
            <CardContent>
              {api.piiFields.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="h-10 w-10 text-chart-4 mx-auto mb-3" />
                  <p className="text-sm font-medium">No PII fields detected in responses</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {api.piiFields.map((pii) => (
                    <div key={pii.field} className="flex items-center gap-4 rounded-lg border border-border p-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-md', piiTypeColors[pii.type] || 'bg-muted')}>
                        <Eye className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium">{pii.field}</span>
                          <Badge variant="outline" className="text-xs">{pii.type.replace('_', ' ')}</Badge>
                          {pii.sensitivity === 'high' && <Badge variant="destructive" className="text-xs"><Zap className="h-3 w-3 mr-1" />High</Badge>}
                          {pii.sensitivity === 'medium' && <Badge variant="outline" className="text-xs text-chart-2 border-chart-2/30">Medium</Badge>}
                          {pii.sensitivity === 'low' && <Badge variant="outline" className="text-xs">Low</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {pii.inResponse ? 'Exposed in response body' : 'Found in request'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sample Request/Response */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sample Request Body</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-secondary/50 rounded-lg p-4 overflow-auto max-h-64">
{Object.keys(api.requestSample).length > 0
  ? JSON.stringify(api.requestSample, null, 2)
  : 'No request body (GET/DELETE)'}
                </pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sample Response Body</CardTitle>
                {api.piiFields.length > 0 && (
                  <CardDescription className="text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Contains PII — handle with care
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-secondary/50 rounded-lg p-4 overflow-auto max-h-64">
{JSON.stringify(api.responseSample, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* OpenAPI Spec Tab */}
        <TabsContent value="spec" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-primary" />
                    Auto-Generated OpenAPI 3.0 Spec
                  </CardTitle>
                  <CardDescription>Inferred from live traffic patterns — review before publishing</CardDescription>
                </div>
                <div className="flex gap-2">
                  {activeSpec && (
                    <Button variant="outline" size="sm" onClick={() => handleCopy(activeSpec)}>
                      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                  <Button size="sm" onClick={handleGenerateSpec}>
                    <FileJson className="h-4 w-4 mr-1" />
                    {activeSpec ? 'Regenerate' : 'Generate Spec'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeSpec ? (
                <pre className="text-xs font-mono bg-secondary/50 rounded-lg p-4 overflow-auto max-h-[60vh] border border-border">
{activeSpec}
                </pre>
              ) : (
                <div className="text-center py-12">
                  <FileJson className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Generate Spec" to auto-create an OpenAPI 3.0 definition for this shadow endpoint,
                    inferred from observed request/response patterns.
                  </p>
                  <Button onClick={handleGenerateSpec}>
                    <FileJson className="h-4 w-4 mr-2" />
                    Generate OpenAPI Spec
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Block Rule Tab */}
        <TabsContent value="block" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ban className="h-5 w-5 text-destructive" />
                    One-Click Block Rule
                  </CardTitle>
                  <CardDescription>Generate a proxy rule to block this shadow API at the gateway</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={blockFormat} onValueChange={(v) => setBlockFormat(v as 'nginx' | 'kong' | 'envoy')}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nginx">NGINX</SelectItem>
                      <SelectItem value="kong">Kong</SelectItem>
                      <SelectItem value="envoy">Envoy</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="destructive" size="sm" onClick={handleBlock} disabled={api.blocked}>
                    <Ban className="h-4 w-4 mr-1" />
                    {api.blocked ? 'Already Blocked' : 'Block This API'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {api.blocked && apiBlockRule ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border border-chart-4/30 bg-chart-4/10 p-3">
                    <CheckCircle2 className="h-5 w-5 text-chart-4" />
                    <div>
                      <p className="text-sm font-medium">Block rule active</p>
                      <p className="text-xs text-muted-foreground">
                        {apiBlockRule.format.toUpperCase()} rule deployed on {new Date(apiBlockRule.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(apiBlockRule.rule)}>
                      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? 'Copied' : 'Copy Rule'}
                    </Button>
                  </div>
                  <pre className="text-xs font-mono bg-secondary/50 rounded-lg p-4 overflow-auto max-h-[50vh] border border-border">
{apiBlockRule.rule}
                  </pre>
                </div>
              ) : activeBlockRule ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border border-chart-4/30 bg-chart-4/10 p-3">
                    <CheckCircle2 className="h-5 w-5 text-chart-4" />
                    <p className="text-sm font-medium">Block rule generated and activated</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(activeBlockRule)}>
                      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? 'Copied' : 'Copy Rule'}
                    </Button>
                  </div>
                  <pre className="text-xs font-mono bg-secondary/50 rounded-lg p-4 overflow-auto max-h-[50vh] border border-border">
{activeBlockRule}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Ban className="h-12 w-12 text-destructive/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Generate a {blockFormat.toUpperCase()} proxy rule to immediately block this shadow API at your gateway.
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    The rule will return 403 Forbidden for all requests to this endpoint and log the attempt.
                  </p>
                  <Button variant="destructive" onClick={handleBlock}>
                    <Ban className="h-4 w-4 mr-2" />
                    Generate & Activate Block Rule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ icon, label, value, subtext, danger }: { icon: React.ReactNode; label: string; value: string; subtext: string; danger?: boolean }) {
  return (
    <Card className={cn(danger && 'border-destructive/30')}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={cn('text-lg font-bold mt-1', danger && 'text-destructive')}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
          </div>
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', danger ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground')}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
