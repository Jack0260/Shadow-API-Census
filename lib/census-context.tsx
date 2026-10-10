'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type {
  ApiEndpoint,
  AuditEntry,
  BlockRule,
  CensusResult,
  LogEntry,
  Team,
} from './types';
import {
  generateMockData,
  generateOpenApiSpec,
  generateBlockRule,
  generateInitialAuditLog,
  calculateCensusResult,
} from './mock-data';
import {
  seedDatabaseIfNeeded,
  loadFromDatabase,
  insertAuditEntry,
  insertBlockRule,
  updateEndpointTeam,
} from './db';

interface CensusContextValue {
  endpoints: ApiEndpoint[];
  logs: LogEntry[];
  teams: Team[];
  auditLog: AuditEntry[];
  blockRules: BlockRule[];
  censusResult: CensusResult;
  selectedApiId: string | null;
  setSelectedApiId: (id: string | null) => void;
  selectedApi: ApiEndpoint | null;
  generateSpec: (apiId: string) => string;
  createBlockRule: (apiId: string, format: 'nginx' | 'kong' | 'envoy') => BlockRule;
  assignTeam: (apiId: string, teamId: string) => void;
  isLoaded: boolean;
  loadError: string | null;
}

const CensusContext = createContext<CensusContextValue | null>(null);

export function CensusProvider({ children }: { children: React.ReactNode }) {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [blockRules, setBlockRules] = useState<BlockRule[]>([]);
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize: seed DB if needed, then load all data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await seedDatabaseIfNeeded();
        const data = await loadFromDatabase();
        if (!mounted) return;
        setTeams(data.teams);
        setEndpoints(data.endpoints);
        setLogs(data.calls);
        setAuditLog(data.audit);
        setBlockRules(data.blockRules);
        setIsLoaded(true);
      } catch (err) {
        // Fallback to in-memory mock data if DB is unavailable
        const mock = generateMockData();
        const audit = generateInitialAuditLog(mock.endpoints);
        if (!mounted) return;
        setTeams(mock.teams);
        setEndpoints(mock.endpoints);
        setLogs(mock.logs);
        setAuditLog(audit);
        setBlockRules([]);
        setLoadError(err instanceof Error ? err.message : 'Database unavailable — using in-memory data');
        setIsLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const censusResult = useMemo(
    () => calculateCensusResult(endpoints, logs),
    [endpoints, logs],
  );

  const selectedApi = useMemo(
    () => endpoints.find((e) => e.id === selectedApiId) || null,
    [endpoints, selectedApiId],
  );

  const generateSpec = useCallback(
    (apiId: string): string => {
      const api = endpoints.find((e) => e.id === apiId);
      if (!api) return '';
      const spec = generateOpenApiSpec(api);
      const auditEntry: Omit<AuditEntry, 'id'> = {
        timestamp: new Date().toISOString(),
        actor: 'security-analyst',
        action: 'OpenAPI Spec Generated',
        targetApiPath: `${api.method} ${api.path}`,
        targetApiId: api.id,
        details: `Auto-generated OpenAPI 3.0 spec for shadow endpoint (risk: ${api.riskScore}/100)`,
        severity: 'info',
      };
      setAuditLog((prev) => [{ ...auditEntry, id: `audit-${Date.now()}` }, ...prev]);
      insertAuditEntry(auditEntry).catch(() => {});
      return spec;
    },
    [endpoints],
  );

  const createBlockRule = useCallback(
    (apiId: string, format: 'nginx' | 'kong' | 'envoy'): BlockRule => {
      const api = endpoints.find((e) => e.id === apiId);
      if (!api) throw new Error('API not found');
      const rule: BlockRule = {
        id: `rule-${Date.now()}`,
        apiId: api.id,
        apiPath: api.path,
        method: api.method,
        format,
        rule: generateBlockRule(api, format),
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: 'security-analyst',
      };
      setBlockRules((prev) => [rule, ...prev]);
      setEndpoints((prev) =>
        prev.map((e) => (e.id === apiId ? { ...e, blocked: true } : e)),
      );
      const auditEntry: Omit<AuditEntry, 'id'> = {
        timestamp: new Date().toISOString(),
        actor: 'security-analyst',
        action: 'Block Rule Generated',
        targetApiPath: `${api.method} ${api.path}`,
        targetApiId: api.id,
        details: `${format.toUpperCase()} block rule generated and activated. Risk: ${api.riskScore}/100`,
        severity: api.riskTier === 'critical' ? 'critical' : 'warning',
      };
      setAuditLog((prev) => [{ ...auditEntry, id: `audit-${Date.now()}` }, ...prev]);
      insertBlockRule(rule).catch(() => {});
      insertAuditEntry(auditEntry).catch(() => {});
      return rule;
    },
    [endpoints],
  );

  const assignTeam = useCallback(
    (apiId: string, teamId: string) => {
      setEndpoints((prev) =>
        prev.map((e) => (e.id === apiId ? { ...e, teamId } : e)),
      );
      const api = endpoints.find((e) => e.id === apiId);
      const team = teams.find((t) => t.id === teamId);
      if (api && team) {
        const auditEntry: Omit<AuditEntry, 'id'> = {
          timestamp: new Date().toISOString(),
          actor: 'security-analyst',
          action: 'Team Ownership Assigned',
          targetApiPath: `${api.method} ${api.path}`,
          targetApiId: api.id,
          details: `Shadow API ownership transferred to ${team.name}`,
          severity: 'info',
        };
        setAuditLog((prev) => [{ ...auditEntry, id: `audit-${Date.now()}` }, ...prev]);
        updateEndpointTeam(apiId, teamId).catch(() => {});
        insertAuditEntry(auditEntry).catch(() => {});
      }
    },
    [endpoints, teams],
  );

  const value: CensusContextValue = {
    endpoints,
    logs,
    teams,
    auditLog,
    blockRules,
    censusResult,
    selectedApiId,
    setSelectedApiId,
    selectedApi,
    generateSpec,
    createBlockRule,
    assignTeam,
    isLoaded,
    loadError,
  };

  return <CensusContext.Provider value={value}>{children}</CensusContext.Provider>;
}

export function useCensus() {
  const ctx = useContext(CensusContext);
  if (!ctx) throw new Error('useCensus must be used within CensusProvider');
  return ctx;
}
