export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RiskTier = 'critical' | 'high' | 'medium' | 'low';

export type ApiCategory =
  | 'auth'
  | 'payments'
  | 'users'
  | 'admin'
  | 'analytics'
  | 'notifications'
  | 'files'
  | 'search';

export interface Team {
  id: string;
  name: string;
  description: string;
  color: string;
  ownerName: string;
  ownerEmail: string;
}

export interface PiiField {
  field: string;
  type: 'ssn' | 'email' | 'phone' | 'credit_card' | 'address' | 'name' | 'dob' | 'ip' | 'auth_token' | 'api_key' | 'password';
  sensitivity: 'high' | 'medium' | 'low';
  inResponse: boolean;
}

export interface CallerInfo {
  ip: string;
  service: string;
  callCount: number;
  hasAuth: boolean;
  firstSeen: string;
  lastSeen: string;
}

export interface RiskFactor {
  label: string;
  score: number;
  maxScore: number;
  detail: string;
}

export interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  description: string;
  teamId: string;
  category: ApiCategory;
  isShadow: boolean;
  isDocumented: boolean;
  isZombie: boolean;
  riskScore: number;
  riskTier: RiskTier;
  riskFactors: RiskFactor[];
  piiFields: PiiField[];
  authRequired: boolean;
  authDetected: boolean;
  callCount: number;
  callerCount: number;
  distinctCallers: CallerInfo[];
  firstSeen: string;
  lastSeen: string;
  statusCodeDistribution: Record<number, number>;
  avgResponseTimeMs: number;
  responseSample: Record<string, unknown>;
  requestSample: Record<string, unknown>;
  paramHints: { name: string; in: 'path' | 'query' | 'body'; type: string }[];
  blocked: boolean;
  openApiSpec?: string;
  blockRule?: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  method: HttpMethod;
  path: string;
  statusCode: number;
  responseTimeMs: number;
  callerIp: string;
  callerService: string;
  hasAuth: boolean;
  authType: string | null;
  requestSize: number;
  responseSize: number;
  apiId: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetApiPath: string;
  targetApiId: string | null;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface BlockRule {
  id: string;
  apiId: string;
  apiPath: string;
  method: HttpMethod;
  format: 'nginx' | 'kong' | 'envoy';
  rule: string;
  status: 'active' | 'draft' | 'disabled';
  createdAt: string;
  createdBy: string;
}

export interface CensusResult {
  totalApis: number;
  documentedApis: number;
  shadowApis: number;
  zombieApis: number;
  totalCalls: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  piiExposedCount: number;
  unauthCount: number;
  censusDate: string;
  logWindowStart: string;
  logWindowEnd: string;
  coveragePercent: number;
}

export interface SwaggerDoc {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, unknown>>;
}
