'use client';

import React, { useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Position,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Network, Filter, AlertTriangle, Eye, EyeOff, Zap } from 'lucide-react';
import { useCensus } from '@/lib/census-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RiskTierBadge } from '@/components/risk-tier-badge';
import { cn } from '@/lib/utils';
import type { ApiEndpoint, RiskTier } from '@/lib/types';

interface ApiNodeData {
  api: ApiEndpoint;
  label: string;
}

const tierColors: Record<RiskTier, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#22c55e',
};

export default function ApiMapPage() {
  const { endpoints, teams, setSelectedApiId } = useCensus();
  const [showShadowOnly, setShowShadowOnly] = useState(false);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [groupByTeam, setGroupByTeam] = useState(true);

  const { initialNodes, initialEdges } = useMemo(() => {
    return buildGraph(endpoints, teams, groupByTeam, showShadowOnly, showCriticalOnly);
  }, [endpoints, teams, groupByTeam, showShadowOnly, showCriticalOnly]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    const { initialNodes, initialEdges } = buildGraph(endpoints, teams, groupByTeam, showShadowOnly, showCriticalOnly);
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [endpoints, teams, groupByTeam, showShadowOnly, showCriticalOnly, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({ apiNode: ApiNodeComponent, teamNode: TeamNodeComponent }), []);

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            API Dependency Map
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visual map of all discovered APIs. Red glowing nodes are shadow APIs — undocumented endpoints actively called in production.
          </p>
        </div>
      </div>

      {/* Filter controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="shadow-only"
                checked={showShadowOnly}
                onCheckedChange={setShowShadowOnly}
              />
              <Label htmlFor="shadow-only" className="text-sm flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                Shadow APIs only
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="critical-only"
                checked={showCriticalOnly}
                onCheckedChange={setShowCriticalOnly}
              />
              <Label htmlFor="critical-only" className="text-sm flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-destructive" />
                Critical & High only
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="group-team"
                checked={groupByTeam}
                onCheckedChange={setGroupByTeam}
              />
              <Label htmlFor="group-team" className="text-sm">
                Group by team
              </Label>
            </div>
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse-slow" /> Shadow
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Documented
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" /> Zombie
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ReactFlow canvas */}
      <Card className="overflow-hidden">
        <div style={{ height: '70vh', minHeight: 500 }} className="bg-grid-pattern">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => {
              const api = (node.data as ApiNodeData).api;
              if (api) setSelectedApiId(api.id);
            }}
            fitView
            fitViewOptions={{ padding: 0.15, maxZoom: 1.2 }}
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
            <Controls className="!bg-card !border-border !shadow-lg" />
            <MiniMap
              nodeColor={(node) => {
                const api = (node.data as ApiNodeData)?.api;
                if (!api) return '#888';
                if (api.isShadow) return tierColors[api.riskTier];
                if (api.isZombie) return 'hsl(var(--muted-foreground) / 0.4)';
                return 'hsl(var(--primary))';
              }}
              nodeStrokeWidth={3}
              className="!bg-card !border-border"
              maskColor="hsl(var(--background) / 0.7)"
            />
          </ReactFlow>
        </div>
      </Card>
    </div>
  );
}

function buildGraph(
  endpoints: ApiEndpoint[],
  teams: { id: string; name: string; color: string }[],
  groupByTeam: boolean,
  shadowOnly: boolean,
  criticalOnly: boolean,
): { initialNodes: Node[]; initialEdges: Edge[] } {
  let filtered = endpoints;
  if (shadowOnly) filtered = filtered.filter((e) => e.isShadow);
  if (criticalOnly) filtered = filtered.filter((e) => e.riskTier === 'critical' || e.riskTier === 'high');

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (groupByTeam) {
    // Group by team: team nodes in center, API nodes around them
    const teamGroups: Record<string, ApiEndpoint[]> = {};
    for (const ep of filtered) {
      if (!teamGroups[ep.teamId]) teamGroups[ep.teamId] = [];
      teamGroups[ep.teamId].push(ep);
    }

    const teamIds = Object.keys(teamGroups);
    const teamCount = teamIds.length;
    const centerX = 0;
    const centerY = 0;
    const teamRadius = 400;

    teamIds.forEach((teamId, teamIndex) => {
      const angle = (teamIndex / teamCount) * Math.PI * 2;
      const teamX = centerX + Math.cos(angle) * teamRadius;
      const teamY = centerY + Math.sin(angle) * teamRadius;
      const team = teams.find((t) => t.id === teamId);
      const teamApis = teamGroups[teamId];
      const shadowCount = teamApis.filter((a) => a.isShadow).length;

      nodes.push({
        id: `team-${teamId}`,
        type: 'teamNode',
        position: { x: teamX, y: teamY },
        data: { label: team?.name, color: team?.color, apiCount: teamApis.length, shadowCount },
        targetPosition: Position.Right,
        sourcePosition: Position.Right,
        draggable: true,
      });

      // Sort APIs: shadow first, then by risk score
      const sortedApis = [...teamApis].sort((a, b) => {
        if (a.isShadow !== b.isShadow) return a.isShadow ? -1 : 1;
        return b.riskScore - a.riskScore;
      });

      sortedApis.forEach((api, apiIndex) => {
        const apiAngle = (apiIndex / Math.max(sortedApis.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const apiRadius = 180 + (api.isShadow ? 40 : 20);
        const apiX = teamX + Math.cos(apiAngle) * apiRadius;
        const apiY = teamY + Math.sin(apiAngle) * apiRadius;

        nodes.push({
          id: api.id,
          type: 'apiNode',
          position: { x: apiX, y: apiY },
          data: { api, label: api.path } as ApiNodeData,
          draggable: true,
        });

        edges.push({
          id: `e-${teamId}-${api.id}`,
          source: `team-${teamId}`,
          target: api.id,
          style: {
            stroke: api.isShadow ? tierColors[api.riskTier] : 'hsl(var(--border))',
            strokeWidth: api.isShadow ? 2 : 1,
            opacity: api.isShadow ? 0.6 : 0.3,
          },
          animated: api.riskTier === 'critical',
        });
      });
    });
  } else {
    // No grouping: spread all APIs in a grid
    const cols = Math.ceil(Math.sqrt(filtered.length));
    filtered.forEach((api, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      nodes.push({
        id: api.id,
        type: 'apiNode',
        position: { x: col * 200, y: row * 120 },
        data: { api, label: api.path } as ApiNodeData,
        draggable: true,
      });
    });
  }

  // Draw edges between APIs that share callers
  const callerToApis: Record<string, string[]> = {};
  for (const api of filtered) {
    for (const caller of api.distinctCallers) {
      if (!callerToApis[caller.ip]) callerToApis[caller.ip] = [];
      if (!callerToApis[caller.ip].includes(api.id)) {
        callerToApis[caller.ip].push(api.id);
      }
    }
  }

  const edgeSet = new Set<string>();
  for (const apis of Object.values(callerToApis)) {
    for (let i = 0; i < apis.length; i++) {
      for (let j = i + 1; j < apis.length; j++) {
        const key = `${apis[i]}-${apis[j]}`;
        if (edgeSet.has(key)) continue;
        edgeSet.add(key);
        const a1 = filtered.find((e) => e.id === apis[i]);
        const a2 = filtered.find((e) => e.id === apis[j]);
        if (!a1 || !a2) continue;
        if (a1.isShadow || a2.isShadow) {
          edges.push({
            id: `caller-${key}`,
            source: apis[i],
            target: apis[j],
            style: {
              stroke: 'hsl(var(--destructive) / 0.2)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
            },
            animated: false,
          });
        }
      }
    }
  }

  return { initialNodes: nodes, initialEdges: edges };
}

const ApiNodeComponent = ({ data }: { data: ApiNodeData }) => {
  const api = data.api;
  if (!api) return null;

  const isShadow = api.isShadow;
  const isZombie = api.isZombie;
  const color = isShadow ? tierColors[api.riskTier] : isZombie ? 'hsl(var(--muted-foreground) / 0.4)' : 'hsl(var(--primary))';

  return (
    <div
      className={cn(
        'rounded-lg border-2 px-3 py-2 text-xs font-mono cursor-pointer transition-all bg-card',
        isShadow && api.riskTier === 'critical' && 'glow-red-strong animate-pulse-red border-destructive',
        isShadow && api.riskTier === 'high' && 'glow-amber border-chart-2',
        isShadow && api.riskTier === 'medium' && 'border-primary',
        isShadow && api.riskTier === 'low' && 'border-chart-4/50',
        !isShadow && !isZombie && 'border-primary/30 hover:border-primary',
        isZombie && 'border-muted-foreground/20 opacity-50',
      )}
      style={{ minWidth: 120 }}
    >
      <div className="flex items-center gap-1.5">
        {isShadow && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
        <span className="font-bold text-[10px] text-muted-foreground">{api.method}</span>
        <span className="truncate" style={{ maxWidth: 140 }}>{api.path.replace('/api/v1/', '')}</span>
      </div>
      {isShadow && (
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[10px] font-bold" style={{ color }}>{api.riskScore}</span>
          {api.piiFields.length > 0 && (
            <span className="text-[10px] text-destructive">PII x{api.piiFields.length}</span>
          )}
        </div>
      )}
    </div>
  );
};

// Custom team node type
const TeamNodeComponent = ({ data }: { data: { label: string; color: string; apiCount: number; shadowCount: number } }) => {
  return (
    <div
      className="rounded-xl border-2 px-4 py-3 text-center bg-card shadow-lg"
      style={{ borderColor: data.color, minWidth: 120 }}
    >
      <div className="text-sm font-bold" style={{ color: data.color }}>{data.label}</div>
      <div className="text-xs text-muted-foreground mt-1">{data.apiCount} APIs</div>
      {data.shadowCount > 0 && (
        <div className="text-xs font-semibold text-destructive mt-0.5">{data.shadowCount} shadow</div>
      )}
    </div>
  );
};
