'use client';

import { supabase } from './supabase-client';
import { generateMockData, generateInitialAuditLog } from './mock-data';
import type { ApiEndpoint, AuditEntry, BlockRule, LogEntry, Team } from './types';

interface DbRow {
  teams: Team[];
  endpoints: ApiEndpoint[];
  calls: LogEntry[];
  audit: AuditEntry[];
  blockRules: BlockRule[];
}

/**
 * Seeds the Supabase database with mock census data if it's empty.
 * Returns true if seeding was performed, false if data already existed.
 */
export async function seedDatabaseIfNeeded(): Promise<boolean> {
  // Check if teams table already has data
  const { count } = await supabase.from('teams').select('*', { count: 'exact', head: true });
  if (count && count > 0) return false;

  const { endpoints, logs, teams } = generateMockData();
  const audit = generateInitialAuditLog(endpoints);

  // Insert teams
  await supabase.from('teams').insert(
    teams.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      color: t.color,
      owner_name: t.ownerName,
      owner_email: t.ownerEmail,
    })),
  );

  // Insert endpoints
  await supabase.from('api_endpoints').insert(
    endpoints.map((e) => ({
      id: e.id,
      method: e.method,
      path: e.path,
      description: e.description,
      team_id: e.teamId,
      category: e.category,
      is_shadow: e.isShadow,
      is_documented: e.isDocumented,
      is_zombie: e.isZombie,
      risk_score: e.riskScore,
      risk_tier: e.riskTier,
      risk_factors: JSON.stringify(e.riskFactors),
      pii_fields: JSON.stringify(e.piiFields),
      auth_required: e.authRequired,
      auth_detected: e.authDetected,
      call_count: e.callCount,
      caller_count: e.callerCount,
      distinct_callers: JSON.stringify(e.distinctCallers),
      first_seen: e.firstSeen,
      last_seen: e.lastSeen,
      status_code_distribution: JSON.stringify(e.statusCodeDistribution),
      avg_response_time_ms: e.avgResponseTimeMs,
      response_sample: JSON.stringify(e.responseSample),
      request_sample: JSON.stringify(e.requestSample),
      param_hints: JSON.stringify(e.paramHints),
      blocked: e.blocked,
    })),
  );

  // Insert logs in batches (Supabase has row limits per insert)
  const batchSize = 500;
  for (let i = 0; i < logs.length; i += batchSize) {
    const batch = logs.slice(i, i + batchSize).map((l) => ({
      timestamp: l.timestamp,
      method: l.method,
      path: l.path,
      status_code: l.statusCode,
      response_time_ms: l.responseTimeMs,
      caller_ip: l.callerIp,
      caller_service: l.callerService,
      has_auth: l.hasAuth,
      auth_type: l.authType,
      request_size: l.requestSize,
      response_size: l.responseSize,
      api_id: l.apiId,
    }));
    await supabase.from('api_calls').insert(batch);
  }

  // Insert audit log
  await supabase.from('audit_log').insert(
    audit.map((a) => ({
      id: a.id,
      timestamp: a.timestamp,
      actor: a.actor,
      action: a.action,
      target_api_path: a.targetApiPath,
      target_api_id: a.targetApiId,
      details: a.details,
      severity: a.severity,
    })),
  );

  return true;
}

/**
 * Loads all data from the database, mapping DB rows back to the app's TypeScript types.
 */
export async function loadFromDatabase(): Promise<DbRow> {
  // Load teams
  const { data: teamsData } = await supabase.from('teams').select('*').order('name');
  const teams: Team[] = (teamsData || []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    name: t.name as string,
    description: t.description as string,
    color: t.color as string,
    ownerName: t.owner_name as string,
    ownerEmail: t.owner_email as string,
  }));

  // Load endpoints
  const { data: endpointsData } = await supabase.from('api_endpoints').select('*').order('risk_score', { ascending: false });
  const endpoints: ApiEndpoint[] = (endpointsData || []).map((e: Record<string, unknown>) => ({
    id: e.id as string,
    method: e.method as ApiEndpoint['method'],
    path: e.path as string,
    description: e.description as string,
    teamId: e.team_id as string,
    category: e.category as ApiEndpoint['category'],
    isShadow: e.is_shadow as boolean,
    isDocumented: e.is_documented as boolean,
    isZombie: e.is_zombie as boolean,
    riskScore: e.risk_score as number,
    riskTier: e.risk_tier as ApiEndpoint['riskTier'],
    riskFactors: typeof e.risk_factors === 'string' ? JSON.parse(e.risk_factors) : e.risk_factors,
    piiFields: typeof e.pii_fields === 'string' ? JSON.parse(e.pii_fields) : e.pii_fields,
    authRequired: e.auth_required as boolean,
    authDetected: e.auth_detected as boolean,
    callCount: e.call_count as number,
    callerCount: e.caller_count as number,
    distinctCallers: typeof e.distinct_callers === 'string' ? JSON.parse(e.distinct_callers) : e.distinct_callers,
    firstSeen: e.first_seen as string,
    lastSeen: e.last_seen as string,
    statusCodeDistribution: typeof e.status_code_distribution === 'string' ? JSON.parse(e.status_code_distribution) : e.status_code_distribution,
    avgResponseTimeMs: e.avg_response_time_ms as number,
    responseSample: typeof e.response_sample === 'string' ? JSON.parse(e.response_sample) : e.response_sample,
    requestSample: typeof e.request_sample === 'string' ? JSON.parse(e.request_sample) : e.request_sample,
    paramHints: typeof e.param_hints === 'string' ? JSON.parse(e.param_hints) : e.param_hints,
    blocked: e.blocked as boolean,
    openApiSpec: (e.open_api_spec as string) || undefined,
    blockRule: (e.block_rule as string) || undefined,
  }));

  // Load audit log
  const { data: auditData } = await supabase.from('audit_log').select('*').order('timestamp', { ascending: false }).limit(500);
  const audit: AuditEntry[] = (auditData || []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    timestamp: a.timestamp as string,
    actor: a.actor as string,
    action: a.action as string,
    targetApiPath: a.target_api_path as string,
    targetApiId: (a.target_api_id as string) || null,
    details: a.details as string,
    severity: a.severity as AuditEntry['severity'],
  }));

  // Load block rules
  const { data: rulesData } = await supabase.from('block_rules').select('*').order('created_at', { ascending: false });
  const blockRules: BlockRule[] = (rulesData || []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    apiId: r.api_id as string,
    apiPath: r.api_path as string,
    method: r.method as BlockRule['method'],
    format: r.format as BlockRule['format'],
    rule: r.rule as string,
    status: r.status as BlockRule['status'],
    createdAt: r.created_at as string,
    createdBy: r.created_by as string,
  }));

  // Load a sample of calls (not all — could be 50K+)
  const { data: callsData } = await supabase.from('api_calls').select('*').order('timestamp', { ascending: false }).limit(5000);
  const calls: LogEntry[] = (callsData || []).map((c: Record<string, unknown>) => ({
    id: c.id as number,
    timestamp: c.timestamp as string,
    method: c.method as LogEntry['method'],
    path: c.path as string,
    statusCode: c.status_code as number,
    responseTimeMs: c.response_time_ms as number,
    callerIp: c.caller_ip as string,
    callerService: c.caller_service as string,
    hasAuth: c.has_auth as boolean,
    authType: (c.auth_type as string) || null,
    requestSize: c.request_size as number,
    responseSize: c.response_size as number,
    apiId: c.api_id as string,
  }));

  return { teams, endpoints, calls, audit, blockRules };
}

/**
 * Persists a new audit entry to the database.
 */
export async function insertAuditEntry(entry: Omit<AuditEntry, 'id'>): Promise<void> {
  await supabase.from('audit_log').insert({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: entry.timestamp,
    actor: entry.actor,
    action: entry.action,
    target_api_path: entry.targetApiPath,
    target_api_id: entry.targetApiId,
    details: entry.details,
    severity: entry.severity,
  });
}

/**
 * Persists a new block rule and marks the endpoint as blocked.
 */
export async function insertBlockRule(rule: Omit<BlockRule, 'createdAt'>): Promise<void> {
  await supabase.from('block_rules').insert({
    id: rule.id,
    api_id: rule.apiId,
    api_path: rule.apiPath,
    method: rule.method,
    format: rule.format,
    rule: rule.rule,
    status: rule.status,
    created_by: rule.createdBy,
  });
  await supabase.from('api_endpoints').update({ blocked: true }).eq('id', rule.apiId);
}

/**
 * Updates team ownership for an endpoint.
 */
export async function updateEndpointTeam(apiId: string, teamId: string): Promise<void> {
  await supabase.from('api_endpoints').update({ team_id: teamId }).eq('id', apiId);
}
