'use client';

import React, { useState, useMemo } from 'react';
import { ScrollText, Search, Filter, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { useCensus } from '@/lib/census-context';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function AuditLogPage() {
  const { auditLog } = useCensus();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const actions = useMemo(() => {
    const set = new Set(auditLog.map((e) => e.action));
    return Array.from(set);
  }, [auditLog]);

  const filtered = useMemo(() => {
    let result = auditLog;
    if (severityFilter !== 'all') result = result.filter((e) => e.severity === severityFilter);
    if (actionFilter !== 'all') result = result.filter((e) => e.action === actionFilter);
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.action.toLowerCase().includes(lower) ||
          e.targetApiPath.toLowerCase().includes(lower) ||
          e.details.toLowerCase().includes(lower) ||
          e.actor.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [auditLog, severityFilter, actionFilter, search]);

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" />
          Audit Log
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete trail of all census actions, spec generations, block rule deployments, and ownership changes.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by action, endpoint, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Audit entries */}
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-secondary/30 px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {filtered.length} entries
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filtered view
          </span>
        </div>
        <div className="divide-y divide-border/50 max-h-[70vh] overflow-auto">
          {filtered.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 p-4 hover:bg-secondary/20 transition-colors">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md shrink-0',
                entry.severity === 'critical' && 'bg-destructive/10 text-destructive',
                entry.severity === 'warning' && 'bg-chart-2/10 text-chart-2',
                entry.severity === 'info' && 'bg-primary/10 text-primary',
              )}>
                {entry.severity === 'critical' ? <ShieldAlert className="h-4 w-4" /> : entry.severity === 'warning' ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{entry.action}</span>
                  {entry.targetApiPath !== '-' && (
                    <Badge variant="outline" className="font-mono text-xs">{entry.targetApiPath}</Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">{entry.actor}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{entry.details}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                {new Date(entry.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Info className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No audit entries match your filters</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
