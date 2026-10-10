'use client';

import { cn } from '@/lib/utils';
import type { RiskTier } from '@/lib/types';

const tierConfig: Record<RiskTier, { label: string; className: string; dotClass: string }> = {
  critical: {
    label: 'Critical',
    className: 'bg-destructive/15 text-destructive border-destructive/30',
    dotClass: 'bg-destructive',
  },
  high: {
    label: 'High',
    className: 'bg-chart-2/15 text-chart-2 border-chart-2/30',
    dotClass: 'bg-chart-2',
  },
  medium: {
    label: 'Medium',
    className: 'bg-chart-3/15 text-chart-3 border-chart-3/30',
    dotClass: 'bg-chart-3',
  },
  low: {
    label: 'Low',
    className: 'bg-chart-4/15 text-chart-4 border-chart-4/30',
    dotClass: 'bg-chart-4',
  },
};

export function RiskTierBadge({ tier, className }: { tier: RiskTier; className?: string }) {
  const config = tierConfig[tier];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  );
}

export function RiskScoreBadge({ score, className }: { score: number; className?: string }) {
  const tier: RiskTier = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  const config = tierConfig[tier];
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-bold tabular-nums',
        config.className,
        className,
      )}
    >
      {score}
    </span>
  );
}
