'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import Link from 'next/link';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  Lock,
  Eye,
  Ban,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useCensus } from '@/lib/census-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RiskTierBadge, RiskScoreBadge } from '@/components/risk-tier-badge';
import { cn } from '@/lib/utils';
import type { ApiEndpoint, RiskTier } from '@/lib/types';

type SortKey = 'riskScore' | 'path' | 'callCount' | 'teamId' | 'lastSeen' | 'piiCount';
type SortDir = 'asc' | 'desc';

export default function ShadowApisPage() {
  const { endpoints, teams } = useCensus();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [showBlockedOnly, setShowBlockedOnly] = useState(false);
  const [showShadowOnly, setShowShadowOnly] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('riskScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const filtered = useMemo(() => {
    let result = [...endpoints];

    if (showShadowOnly) result = result.filter((e) => e.isShadow);
    if (showBlockedOnly) result = result.filter((e) => e.blocked);
    if (tierFilter !== 'all') result = result.filter((e) => e.riskTier === tierFilter);
    if (teamFilter !== 'all') result = result.filter((e) => e.teamId === teamFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.path.toLowerCase().includes(lower) ||
          e.method.toLowerCase().includes(lower) ||
          e.description.toLowerCase().includes(lower),
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'riskScore':
          cmp = a.riskScore - b.riskScore;
          break;
        case 'path':
          cmp = a.path.localeCompare(b.path);
          break;
        case 'callCount':
          cmp = a.callCount - b.callCount;
          break;
        case 'teamId':
          cmp = a.teamId.localeCompare(b.teamId);
          break;
        case 'lastSeen':
          cmp = new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime();
          break;
        case 'piiCount':
          cmp = a.piiFields.length - b.piiFields.length;
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [endpoints, search, tierFilter, teamFilter, showBlockedOnly, showShadowOnly, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />;
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            Shadow API Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} of {endpoints.length} endpoints — virtualized table handling up to 1M log lines
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by path, method, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Risk Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch id="shadow-only" checked={showShadowOnly} onCheckedChange={setShowShadowOnly} />
            <Label htmlFor="shadow-only" className="text-sm">Shadow only</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="blocked-only" checked={showBlockedOnly} onCheckedChange={setShowBlockedOnly} />
            <Label htmlFor="blocked-only" className="text-sm">Blocked only</Label>
          </div>
        </div>
      </Card>

      {/* Virtualized Table */}
      <VirtualizedApiTable
        apis={filtered}
        teams={teams}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
        SortIcon={SortIcon}
      />
    </div>
  );
}

function VirtualizedApiTable({
  apis,
  teams,
  sortKey,
  sortDir,
  onSort,
  SortIcon,
}: {
  apis: ApiEndpoint[];
  teams: { id: string; name: string; color: string }[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  SortIcon: ({ column }: { column: SortKey }) => React.ReactNode;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: apis.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  const teamMap = useMemo(() => {
    const map: Record<string, { name: string; color: string }> = {};
    teams.forEach((t) => (map[t.id] = t));
    return map;
  }, [teams]);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-secondary/30 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Showing {apis.length} endpoints (virtualized rendering)
        </span>
        <span className="text-xs text-muted-foreground">
          Sorted by {sortKey} {sortDir}
        </span>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-3 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground bg-card">
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => onSort('riskScore')}>
          Risk <SortIcon column="riskScore" />
        </button>
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => onSort('path')}>
          Endpoint <SortIcon column="path" />
        </button>
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => onSort('teamId')}>
          Team <SortIcon column="teamId" />
        </button>
        <span className="text-center w-8">PII</span>
        <span className="text-center w-8">Auth</span>
        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => onSort('callCount')}>
          Calls <SortIcon column="callCount" />
        </button>
        <span className="w-8"></span>
      </div>

      {/* Virtualized rows */}
      <div ref={parentRef} className="max-h-[65vh] overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const api = apis[virtualRow.index];
            const team = teamMap[api.teamId];
            return (
              <div
                key={api.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <Link
                  href={`/shadow-apis/${api.id}`}
                  className={cn(
                    'grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-3 items-center px-4 h-full border-b border-border/50 hover:bg-secondary/30 transition-colors group',
                    api.isShadow && api.riskTier === 'critical' && 'bg-destructive/5',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <RiskScoreBadge score={api.riskScore} />
                    <RiskTierBadge tier={api.riskTier} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs shrink-0">{api.method}</Badge>
                      <span className="text-sm font-mono truncate group-hover:text-primary transition-colors">{api.path}</span>
                      {api.blocked && (
                        <Badge variant="destructive" className="shrink-0 text-xs">
                          <Ban className="h-3 w-3 mr-1" />Blocked
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{api.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="h-2 w-2 rounded-full" style={{ background: team?.color }} />
                    <span className="text-xs text-muted-foreground hidden sm:inline">{team?.name}</span>
                  </div>
                  <div className="flex justify-center w-8">
                    {api.piiFields.length > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-destructive" title={`${api.piiFields.length} PII fields`}>
                        <Eye className="h-3.5 w-3.5" />
                        {api.piiFields.length}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/30">—</span>
                    )}
                  </div>
                  <div className="flex justify-center w-8">
                    {api.authRequired ? (
                      api.authDetected ? (
                        <Lock className="h-3.5 w-3.5 text-chart-4" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-destructive" />
                      )
                    ) : (
                      <span className="text-xs text-destructive font-bold" title="No auth required">None</span>
                    )}
                  </div>
                  <div className="text-xs tabular-nums text-muted-foreground text-right">
                    {api.callCount.toLocaleString()}
                  </div>
                  <div className="w-8 text-right">
                    <span className="text-muted-foreground group-hover:text-primary text-sm">→</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {apis.length === 0 && (
        <div className="py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-chart-4 mx-auto mb-3" />
          <p className="text-sm font-medium">No shadow APIs match your filters</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search criteria</p>
        </div>
      )}
    </Card>
  );
}
