import type {
  ApiEndpoint,
  ApiCategory,
  AuditEntry,
  BlockRule,
  CallerInfo,
  HttpMethod,
  LogEntry,
  PiiField,
  RiskFactor,
  RiskTier,
  Team,
} from './types';

// Seeded PRNG for deterministic mock data
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
  bool(prob = 0.5): boolean {
    return this.next() < prob;
  }
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

const rng = new SeededRandom(42);

// ---- Teams ----
export const TEAMS: Team[] = [
  { id: 'team-auth', name: 'Auth Team', description: 'Identity, authentication, and authorization services', color: '#3b82f6', ownerName: 'Sarah Chen', ownerEmail: 'sarah.chen@company.com' },
  { id: 'team-payments', name: 'Payments Team', description: 'Payment processing and billing APIs', color: '#10b981', ownerName: 'Marcus Johnson', ownerEmail: 'marcus.j@company.com' },
  { id: 'team-platform', name: 'Platform Team', description: 'Core platform and infrastructure APIs', color: '#f59e0b', ownerName: 'Priya Patel', ownerEmail: 'priya.p@company.com' },
  { id: 'team-data', name: 'Data & Analytics', description: 'Analytics, reporting, and data pipeline APIs', color: '#ec4899', ownerName: 'David Kim', ownerEmail: 'david.kim@company.com' },
  { id: 'team-users', name: 'User Services', description: 'User profiles, preferences, and account management', color: '#06b6d4', ownerName: 'Lisa Wang', ownerEmail: 'lisa.w@company.com' },
];

// ---- Documented API definitions (will appear in Swagger) ----
interface ApiDef {
  method: HttpMethod;
  path: string;
  description: string;
  teamId: string;
  category: ApiCategory;
  authRequired: boolean;
  piiFields?: PiiField[];
}

const DOCUMENTED_APIS: ApiDef[] = [
  // Auth Team
  { method: 'POST', path: '/api/v1/auth/login', description: 'User login', teamId: 'team-auth', category: 'auth', authRequired: false },
  { method: 'POST', path: '/api/v1/auth/logout', description: 'User logout', teamId: 'team-auth', category: 'auth', authRequired: true },
  { method: 'POST', path: '/api/v1/auth/refresh', description: 'Refresh access token', teamId: 'team-auth', category: 'auth', authRequired: true },
  { method: 'POST', path: '/api/v1/auth/register', description: 'Register new user', teamId: 'team-auth', category: 'auth', authRequired: false },
  { method: 'GET', path: '/api/v1/auth/me', description: 'Get current user session', teamId: 'team-auth', category: 'auth', authRequired: true },
  { method: 'POST', path: '/api/v1/auth/password/reset', description: 'Request password reset', teamId: 'team-auth', category: 'auth', authRequired: false },
  { method: 'PUT', path: '/api/v1/auth/password/change', description: 'Change password', teamId: 'team-auth', category: 'auth', authRequired: true },
  { method: 'GET', path: '/api/v1/auth/sessions', description: 'List active sessions', teamId: 'team-auth', category: 'auth', authRequired: true },
  { method: 'DELETE', path: '/api/v1/auth/sessions/{id}', description: 'Revoke a session', teamId: 'team-auth', category: 'auth', authRequired: true },

  // Payments Team
  { method: 'GET', path: '/api/v1/payments', description: 'List payments', teamId: 'team-payments', category: 'payments', authRequired: true, piiFields: [{ field: 'card_last4', type: 'credit_card', sensitivity: 'medium', inResponse: true }] },
  { method: 'POST', path: '/api/v1/payments', description: 'Create a payment', teamId: 'team-payments', category: 'payments', authRequired: true },
  { method: 'GET', path: '/api/v1/payments/{id}', description: 'Get payment details', teamId: 'team-payments', category: 'payments', authRequired: true, piiFields: [{ field: 'card_last4', type: 'credit_card', sensitivity: 'medium', inResponse: true }] },
  { method: 'POST', path: '/api/v1/payments/{id}/refund', description: 'Refund a payment', teamId: 'team-payments', category: 'payments', authRequired: true },
  { method: 'GET', path: '/api/v1/payments/methods', description: 'List payment methods', teamId: 'team-payments', category: 'payments', authRequired: true },
  { method: 'POST', path: '/api/v1/payments/methods', description: 'Add payment method', teamId: 'team-payments', category: 'payments', authRequired: true },
  { method: 'DELETE', path: '/api/v1/payments/methods/{id}', description: 'Remove payment method', teamId: 'team-payments', category: 'payments', authRequired: true },
  { method: 'GET', path: '/api/v1/payments/invoices', description: 'List invoices', teamId: 'team-payments', category: 'payments', authRequired: true },
  { method: 'GET', path: '/api/v1/payments/invoices/{id}', description: 'Get invoice details', teamId: 'team-payments', category: 'payments', authRequired: true },
  { method: 'GET', path: '/api/v1/payments/subscriptions', description: 'List subscriptions', teamId: 'team-payments', category: 'payments', authRequired: true },
  { method: 'POST', path: '/api/v1/payments/subscriptions', description: 'Create subscription', teamId: 'team-payments', category: 'payments', authRequired: true },
  { method: 'DELETE', path: '/api/v1/payments/subscriptions/{id}', description: 'Cancel subscription', teamId: 'team-payments', category: 'payments', authRequired: true },

  // Users Team
  { method: 'GET', path: '/api/v1/users', description: 'List users', teamId: 'team-users', category: 'users', authRequired: true, piiFields: [{ field: 'email', type: 'email', sensitivity: 'medium', inResponse: true }, { field: 'full_name', type: 'name', sensitivity: 'low', inResponse: true }] },
  { method: 'POST', path: '/api/v1/users', description: 'Create user', teamId: 'team-users', category: 'users', authRequired: true },
  { method: 'GET', path: '/api/v1/users/{id}', description: 'Get user by ID', teamId: 'team-users', category: 'users', authRequired: true, piiFields: [{ field: 'email', type: 'email', sensitivity: 'medium', inResponse: true }, { field: 'full_name', type: 'name', sensitivity: 'low', inResponse: true }, { field: 'phone', type: 'phone', sensitivity: 'medium', inResponse: true }] },
  { method: 'PUT', path: '/api/v1/users/{id}', description: 'Update user', teamId: 'team-users', category: 'users', authRequired: true },
  { method: 'DELETE', path: '/api/v1/users/{id}', description: 'Delete user', teamId: 'team-users', category: 'users', authRequired: true },
  { method: 'GET', path: '/api/v1/users/{id}/preferences', description: 'Get user preferences', teamId: 'team-users', category: 'users', authRequired: true },
  { method: 'PUT', path: '/api/v1/users/{id}/preferences', description: 'Update user preferences', teamId: 'team-users', category: 'users', authRequired: true },
  { method: 'GET', path: '/api/v1/users/search', description: 'Search users', teamId: 'team-users', category: 'users', authRequired: true, piiFields: [{ field: 'email', type: 'email', sensitivity: 'medium', inResponse: true }] },

  // Platform Team
  { method: 'GET', path: '/api/v1/health', description: 'Health check', teamId: 'team-platform', category: 'admin', authRequired: false },
  { method: 'GET', path: '/api/v1/status', description: 'Service status', teamId: 'team-platform', category: 'admin', authRequired: false },
  { method: 'GET', path: '/api/v1/config', description: 'Get app config', teamId: 'team-platform', category: 'admin', authRequired: true },
  { method: 'GET', path: '/api/v1/feature-flags', description: 'List feature flags', teamId: 'team-platform', category: 'admin', authRequired: true },
  { method: 'PUT', path: '/api/v1/feature-flags/{key}', description: 'Update feature flag', teamId: 'team-platform', category: 'admin', authRequired: true },
  { method: 'GET', path: '/api/v1/webhooks', description: 'List webhooks', teamId: 'team-platform', category: 'admin', authRequired: true },
  { method: 'POST', path: '/api/v1/webhooks', description: 'Create webhook', teamId: 'team-platform', category: 'admin', authRequired: true },
  { method: 'DELETE', path: '/api/v1/webhooks/{id}', description: 'Delete webhook', teamId: 'team-platform', category: 'admin', authRequired: true },
  { method: 'GET', path: '/api/v1/rate-limits', description: 'Get rate limit config', teamId: 'team-platform', category: 'admin', authRequired: true },

  // Data & Analytics
  { method: 'GET', path: '/api/v1/analytics/events', description: 'List analytics events', teamId: 'team-data', category: 'analytics', authRequired: true },
  { method: 'POST', path: '/api/v1/analytics/events', description: 'Track event', teamId: 'team-data', category: 'analytics', authRequired: true },
  { method: 'GET', path: '/api/v1/analytics/reports', description: 'List reports', teamId: 'team-data', category: 'analytics', authRequired: true },
  { method: 'GET', path: '/api/v1/analytics/reports/{id}', description: 'Get report', teamId: 'team-data', category: 'analytics', authRequired: true },
  { method: 'GET', path: '/api/v1/analytics/dashboard', description: 'Dashboard metrics', teamId: 'team-data', category: 'analytics', authRequired: true },
  { method: 'GET', path: '/api/v1/analytics/funnel', description: 'Funnel analysis', teamId: 'team-data', category: 'analytics', authRequired: true },
  { method: 'GET', path: '/api/v1/analytics/retention', description: 'Retention metrics', teamId: 'team-data', category: 'analytics', authRequired: true },

  // Notifications
  { method: 'GET', path: '/api/v1/notifications', description: 'List notifications', teamId: 'team-users', category: 'notifications', authRequired: true },
  { method: 'POST', path: '/api/v1/notifications/send', description: 'Send notification', teamId: 'team-users', category: 'notifications', authRequired: true },
  { method: 'PUT', path: '/api/v1/notifications/{id}/read', description: 'Mark notification read', teamId: 'team-users', category: 'notifications', authRequired: true },

  // Files
  { method: 'GET', path: '/api/v1/files', description: 'List files', teamId: 'team-platform', category: 'files', authRequired: true },
  { method: 'POST', path: '/api/v1/files/upload', description: 'Upload file', teamId: 'team-platform', category: 'files', authRequired: true },
  { method: 'GET', path: '/api/v1/files/{id}', description: 'Download file', teamId: 'team-platform', category: 'files', authRequired: true },
  { method: 'DELETE', path: '/api/v1/files/{id}', description: 'Delete file', teamId: 'team-platform', category: 'files', authRequired: true },

  // Search
  { method: 'GET', path: '/api/v1/search', description: 'Global search', teamId: 'team-data', category: 'search', authRequired: true },
  { method: 'GET', path: '/api/v1/search/suggestions', description: 'Search suggestions', teamId: 'team-data', category: 'search', authRequired: true },
];

// ---- Shadow (undocumented) API definitions ----
interface ShadowApiDef extends ApiDef {
  piiFields: PiiField[];
  callerServices: string[];
  callVolume: 'high' | 'medium' | 'low';
}

const SHADOW_APIS: ShadowApiDef[] = [
  // Critical shadow APIs
  {
    method: 'GET', path: '/api/v1/admin/export_all_users', description: 'Export all user data (undocumented admin endpoint)',
    teamId: 'team-platform', category: 'admin', authRequired: false,
    piiFields: [
      { field: 'email', type: 'email', sensitivity: 'medium', inResponse: true },
      { field: 'full_name', type: 'name', sensitivity: 'low', inResponse: true },
      { field: 'phone', type: 'phone', sensitivity: 'medium', inResponse: true },
      { field: 'ssn', type: 'ssn', sensitivity: 'high', inResponse: true },
      { field: 'home_address', type: 'address', sensitivity: 'medium', inResponse: true },
      { field: 'date_of_birth', type: 'dob', sensitivity: 'high', inResponse: true },
    ],
    callerServices: ['legacy-cron-job', 'internal-dashboard-legacy'], callVolume: 'high',
  },
  {
    method: 'GET', path: '/api/v1/users/ssn_lookup', description: 'SSN lookup by user email (undocumented)',
    teamId: 'team-users', category: 'users', authRequired: false,
    piiFields: [
      { field: 'ssn', type: 'ssn', sensitivity: 'high', inResponse: true },
      { field: 'email', type: 'email', sensitivity: 'medium', inResponse: true },
    ],
    callerServices: ['legacy-cron-job'], callVolume: 'medium',
  },
  {
    method: 'GET', path: '/api/v1/payments/raw_card_dump', description: 'Raw credit card data dump (undocumented)',
    teamId: 'team-payments', category: 'payments', authRequired: false,
    piiFields: [
      { field: 'card_number', type: 'credit_card', sensitivity: 'high', inResponse: true },
      { field: 'cvv', type: 'credit_card', sensitivity: 'high', inResponse: true },
      { field: 'card_expiry', type: 'credit_card', sensitivity: 'high', inResponse: true },
      { field: 'cardholder_name', type: 'name', sensitivity: 'low', inResponse: true },
    ],
    callerServices: ['external-audit-tool'], callVolume: 'low',
  },
  {
    method: 'POST', path: '/api/v1/admin/reset_2fa', description: 'Reset 2FA for any user without verification (undocumented)',
    teamId: 'team-auth', category: 'auth', authRequired: false,
    piiFields: [
      { field: 'email', type: 'email', sensitivity: 'medium', inResponse: true },
    ],
    callerServices: ['support-tool-legacy'], callVolume: 'medium',
  },
  {
    method: 'GET', path: '/api/v1/admin/debug/sql', description: 'Execute raw SQL queries (undocumented debug endpoint)',
    teamId: 'team-platform', category: 'admin', authRequired: false,
    piiFields: [
      { field: 'auth_token', type: 'auth_token', sensitivity: 'high', inResponse: true },
      { field: 'api_key', type: 'api_key', sensitivity: 'high', inResponse: true },
    ],
    callerServices: ['dev-staging-proxy'], callVolume: 'low',
  },
  {
    method: 'DELETE', path: '/api/v1/admin/users/bulk_delete', description: 'Bulk delete users without confirmation (undocumented)',
    teamId: 'team-platform', category: 'admin', authRequired: false,
    piiFields: [],
    callerServices: ['admin-cli-legacy'], callVolume: 'low',
  },
  // High risk
  {
    method: 'GET', path: '/api/v1/users/internal_list', description: 'Internal user list with PII (undocumented)',
    teamId: 'team-users', category: 'users', authRequired: true,
    piiFields: [
      { field: 'email', type: 'email', sensitivity: 'medium', inResponse: true },
      { field: 'phone', type: 'phone', sensitivity: 'medium', inResponse: true },
      { field: 'home_address', type: 'address', sensitivity: 'medium', inResponse: true },
    ],
    callerServices: ['internal-dashboard-legacy', 'reporting-service'], callVolume: 'high',
  },
  {
    method: 'POST', path: '/api/v1/payments/manual_charge', description: 'Manual charge without invoice (undocumented)',
    teamId: 'team-payments', category: 'payments', authRequired: true,
    piiFields: [
      { field: 'card_last4', type: 'credit_card', sensitivity: 'medium', inResponse: true },
    ],
    callerServices: ['billing-ops-tool'], callVolume: 'medium',
  },
  {
    method: 'GET', path: '/api/v1/analytics/raw_events_export', description: 'Raw analytics event export with user data (undocumented)',
    teamId: 'team-data', category: 'analytics', authRequired: false,
    piiFields: [
      { field: 'ip', type: 'ip', sensitivity: 'low', inResponse: true },
      { field: 'email', type: 'email', sensitivity: 'medium', inResponse: true },
    ],
    callerServices: ['data-pipeline-legacy'], callVolume: 'high',
  },
  {
    method: 'GET', path: '/api/v1/admin/config_dump', description: 'Dump all config including secrets (undocumented)',
    teamId: 'team-platform', category: 'admin', authRequired: false,
    piiFields: [
      { field: 'api_key', type: 'api_key', sensitivity: 'high', inResponse: true },
      { field: 'password', type: 'password', sensitivity: 'high', inResponse: true },
    ],
    callerServices: ['dev-staging-proxy'], callVolume: 'low',
  },
  {
    method: 'PUT', path: '/api/v1/users/{id}/role', description: 'Change user role without admin check (undocumented)',
    teamId: 'team-auth', category: 'auth', authRequired: true,
    piiFields: [],
    callerServices: ['support-tool-legacy'], callVolume: 'medium',
  },
  {
    method: 'GET', path: '/api/v1/auth/debug_tokens', description: 'Debug endpoint exposing active tokens (undocumented)',
    teamId: 'team-auth', category: 'auth', authRequired: false,
    piiFields: [
      { field: 'auth_token', type: 'auth_token', sensitivity: 'high', inResponse: true },
    ],
    callerServices: ['dev-staging-proxy'], callVolume: 'low',
  },
  // Medium risk
  {
    method: 'GET', path: '/api/v1/analytics/user_activity_raw', description: 'Raw user activity log (undocumented)',
    teamId: 'team-data', category: 'analytics', authRequired: true,
    piiFields: [
      { field: 'ip', type: 'ip', sensitivity: 'low', inResponse: true },
    ],
    callerServices: ['reporting-service'], callVolume: 'medium',
  },
  {
    method: 'POST', path: '/api/v1/notifications/bulk_email', description: 'Bulk email send without rate limit (undocumented)',
    teamId: 'team-users', category: 'notifications', authRequired: true,
    piiFields: [
      { field: 'email', type: 'email', sensitivity: 'medium', inResponse: true },
    ],
    callerServices: ['marketing-legacy-tool'], callVolume: 'medium',
  },
  {
    method: 'GET', path: '/api/v1/files/metadata_all', description: 'Get all file metadata (undocumented)',
    teamId: 'team-platform', category: 'files', authRequired: true,
    piiFields: [],
    callerServices: ['internal-dashboard-legacy'], callVolume: 'medium',
  },
  {
    method: 'GET', path: '/api/v1/payments/fees_internal', description: 'Internal fee structure (undocumented)',
    teamId: 'team-payments', category: 'payments', authRequired: true,
    piiFields: [],
    callerServices: ['billing-ops-tool'], callVolume: 'low',
  },
  {
    method: 'PATCH', path: '/api/v1/users/{id}/flag', description: 'Flag user account without audit (undocumented)',
    teamId: 'team-users', category: 'users', authRequired: true,
    piiFields: [],
    callerServices: ['support-tool-legacy'], callVolume: 'medium',
  },
  // Low risk
  {
    method: 'GET', path: '/api/v1/health/deep', description: 'Deep health check with internal details (undocumented)',
    teamId: 'team-platform', category: 'admin', authRequired: false,
    piiFields: [],
    callerServices: ['monitoring-agent'], callVolume: 'high',
  },
  {
    method: 'GET', path: '/api/v1/status/verbose', description: 'Verbose status with internal IPs (undocumented)',
    teamId: 'team-platform', category: 'admin', authRequired: false,
    piiFields: [
      { field: 'ip', type: 'ip', sensitivity: 'low', inResponse: true },
    ],
    callerServices: ['monitoring-agent'], callVolume: 'high',
  },
  {
    method: 'GET', path: '/api/v1/search/unfiltered', description: 'Search without access control filters (undocumented)',
    teamId: 'team-data', category: 'search', authRequired: true,
    piiFields: [
      { field: 'email', type: 'email', sensitivity: 'medium', inResponse: true },
    ],
    callerServices: ['internal-dashboard-legacy'], callVolume: 'medium',
  },
  {
    method: 'GET', path: '/api/v1/config/internal', description: 'Internal config without secrets (undocumented)',
    teamId: 'team-platform', category: 'admin', authRequired: true,
    piiFields: [],
    callerServices: ['dev-staging-proxy'], callVolume: 'low',
  },
  {
    method: 'POST', path: '/api/v1/analytics/events/bulk_import', description: 'Bulk import events (undocumented)',
    teamId: 'team-data', category: 'analytics', authRequired: true,
    piiFields: [],
    callerServices: ['data-pipeline-legacy'], callVolume: 'medium',
  },
  {
    method: 'GET', path: '/api/v1/webhooks/test_fire', description: 'Test fire webhook to arbitrary URL (undocumented)',
    teamId: 'team-platform', category: 'admin', authRequired: true,
    piiFields: [],
    callerServices: ['dev-staging-proxy'], callVolume: 'low',
  },
];

// ---- Caller IPs and services ----
const CALLER_IPS = [
  '10.0.1.34', '10.0.1.88', '10.0.2.12', '10.0.2.55', '10.0.3.77',
  '10.0.3.91', '172.16.0.5', '172.16.0.12', '172.16.1.45', '172.16.1.78',
  '192.168.1.100', '192.168.1.150', '192.168.2.200', '10.5.5.5', '10.5.5.20',
  '10.8.0.1', '10.8.0.15', '10.8.0.30', '172.20.0.3', '172.20.0.8',
];

function generateCallers(rng: SeededRandom, services: string[], volume: string): CallerInfo[] {
  const count = volume === 'high' ? rng.int(4, 8) : volume === 'medium' ? rng.int(2, 4) : rng.int(1, 2);
  const callers: CallerInfo[] = [];
  const usedIps = new Set<string>();
  for (let i = 0; i < count; i++) {
    let ip = rng.pick(CALLER_IPS);
    while (usedIps.has(ip)) ip = rng.pick(CALLER_IPS);
    usedIps.add(ip);
    const service = services[i % services.length] || rng.pick(CALLER_IPS);
    const callCount = volume === 'high' ? rng.int(500, 5000) : volume === 'medium' ? rng.int(50, 500) : rng.int(5, 50);
    callers.push({
      ip,
      service,
      callCount,
      hasAuth: rng.bool(0.3),
      firstSeen: new Date(Date.now() - rng.int(50, 60) * 60 * 1000).toISOString(),
      lastSeen: new Date(Date.now() - rng.int(0, 10) * 60 * 1000).toISOString(),
    });
  }
  return callers;
}

function paramHintsFromPath(path: string): { name: string; in: 'path' | 'query' | 'body'; type: string }[] {
  const hints: { name: string; in: 'path' | 'query' | 'body'; type: string }[] = [];
  const pathParams = path.match(/\{(\w+)\}/g);
  if (pathParams) {
    pathParams.forEach((p) => {
      hints.push({ name: p.replace(/[{}]/g, ''), in: 'path', type: 'string' });
    });
  }
  if (path.includes('search') || path.includes('lookup') || path.includes('export')) {
    hints.push({ name: 'query', in: 'query', type: 'string' });
    hints.push({ name: 'limit', in: 'query', type: 'integer' });
    hints.push({ name: 'offset', in: 'query', type: 'integer' });
  }
  return hints;
}

function generateSampleResponse(path: string, piiFields: PiiField[]): Record<string, unknown> {
  const sample: Record<string, unknown> = {};
  for (const pii of piiFields) {
    switch (pii.type) {
      case 'ssn': sample[pii.field] = 'XXX-XX-XXXX'; break;
      case 'email': sample[pii.field] = 'user@example.com'; break;
      case 'phone': sample[pii.field] = '+1-555-0123'; break;
      case 'credit_card': sample[pii.field] = pii.field === 'card_number' ? '4111-1111-1111-1111' : pii.field === 'cvv' ? '123' : '12/25'; break;
      case 'address': sample[pii.field] = '123 Main St, San Francisco, CA'; break;
      case 'name': sample[pii.field] = 'John Doe'; break;
      case 'dob': sample[pii.field] = '1985-03-15'; break;
      case 'ip': sample[pii.field] = '10.0.1.34'; break;
      case 'auth_token': sample[pii.field] = 'eyJhbGciOi...redacted'; break;
      case 'api_key': sample[pii.field] = 'sk_live_••••••'; break;
      case 'password': sample[pii.field] = '••••••••'; break;
    }
  }
  if (path.includes('export') || path.includes('dump') || path.includes('list')) {
    sample['results'] = 'array[object]';
    sample['total'] = 0;
  }
  return sample;
}

function generateSampleRequest(method: HttpMethod, path: string): Record<string, unknown> {
  if (method === 'GET' || method === 'DELETE') return {};
  const sample: Record<string, unknown> = {};
  if (path.includes('login') || path.includes('auth')) {
    sample['email'] = 'user@example.com';
    sample['password'] = '••••••••';
  } else if (path.includes('payment') || path.includes('charge')) {
    sample['amount'] = 99.99;
    sample['currency'] = 'USD';
    sample['customer_id'] = 'cus_abc123';
  } else if (path.includes('user')) {
    sample['email'] = 'newuser@example.com';
    sample['full_name'] = 'Jane Doe';
  } else {
    sample['data'] = 'object';
  }
  return sample;
}

function scoreRisk(
  path: string,
  method: HttpMethod,
  piiFields: PiiField[],
  authRequired: boolean,
  authDetected: boolean,
  callCount: number,
  callerCount: number,
  statusCodes: Record<number, number>,
): { score: number; tier: RiskTier; factors: RiskFactor[] } {
  const factors: RiskFactor[] = [];
  let total = 0;

  // PII exposure (max 35)
  let piiScore = 0;
  const highPii = piiFields.filter((p) => p.sensitivity === 'high').length;
  const medPii = piiFields.filter((p) => p.sensitivity === 'medium').length;
  const lowPii = piiFields.filter((p) => p.sensitivity === 'low').length;
  piiScore = highPii * 15 + medPii * 8 + lowPii * 3;
  piiScore = Math.min(piiScore, 35);
  total += piiScore;
  factors.push({
    label: 'PII Data Exposure',
    score: piiScore,
    maxScore: 35,
    detail: piiFields.length === 0 ? 'No PII detected in responses' : `${highPii} high-sensitivity, ${medPii} medium, ${lowPii} low fields exposed`,
  });

  // Missing auth (max 25)
  let authScore = 0;
  if (!authRequired) {
    authScore = 20;
    if (!authDetected) authScore = 25;
  } else if (!authDetected) {
    authScore = 15;
  }
  total += authScore;
  factors.push({
    label: 'Authentication Gap',
    score: authScore,
    maxScore: 25,
    detail: !authRequired && !authDetected ? 'No auth required AND no auth tokens observed' : authRequired && !authDetected ? 'Auth required but callers sent no tokens' : !authRequired ? 'Auth not required by endpoint' : 'Authentication present',
  });

  // Path sensitivity (max 20)
  let pathScore = 0;
  const pathLower = path.toLowerCase();
  if (pathLower.includes('admin')) pathScore += 12;
  if (pathLower.includes('export') || pathLower.includes('dump')) pathScore += 8;
  if (pathLower.includes('debug') || pathLower.includes('internal')) pathScore += 6;
  if (pathLower.includes('ssn') || pathLower.includes('card')) pathScore += 5;
  if (method === 'DELETE') pathScore += 5;
  if (method === 'PUT' || method === 'PATCH') pathScore += 3;
  pathScore = Math.min(pathScore, 20);
  total += pathScore;
  factors.push({
    label: 'Path & Method Sensitivity',
    score: pathScore,
    maxScore: 20,
    detail: method === 'DELETE' ? `DELETE on sensitive path` : `Path pattern analysis: ${pathLower.includes('admin') ? 'admin' : pathLower.includes('debug') ? 'debug' : 'standard'}`,
  });

  // Exposure volume (max 12)
  let exposureScore = 0;
  if (callCount > 1000) exposureScore = 12;
  else if (callCount > 100) exposureScore = 8;
  else if (callCount > 10) exposureScore = 4;
  else exposureScore = 2;
  total += exposureScore;
  factors.push({
    label: 'Exposure Volume',
    score: exposureScore,
    maxScore: 12,
    detail: `${callCount.toLocaleString()} calls from ${callerCount} distinct callers`,
  });

  // Success rate (max 8) — 200s on shadow endpoint is riskier
  let successScore = 0;
  const successCount = statusCodes[200] || 0;
  const totalCount = Object.values(statusCodes).reduce((a, b) => a + b, 0);
  if (totalCount > 0) {
    const successRate = successCount / totalCount;
    successScore = Math.round(successRate * 8);
  }
  total += successScore;
  factors.push({
    label: 'Operational Success Rate',
    score: successScore,
    maxScore: 8,
    detail: `${Math.round(((statusCodes[200] || 0) / Math.max(totalCount, 1)) * 100)}% of calls returned 200 OK`,
  });

  total = Math.min(total, 100);

  let tier: RiskTier = 'low';
  if (total >= 80) tier = 'critical';
  else if (total >= 60) tier = 'high';
  else if (total >= 30) tier = 'medium';

  return { score: total, tier, factors };
}

function generateStatusCodes(rng: SeededRandom, callCount: number, isShadow: boolean): Record<number, number> {
  const codes: Record<number, number> = {};
  if (isShadow) {
    codes[200] = Math.floor(callCount * rng.float(0.7, 0.95));
  } else {
    codes[200] = Math.floor(callCount * rng.float(0.85, 0.98));
  }
  const remaining = callCount - codes[200];
  codes[401] = Math.floor(remaining * 0.3);
  codes[404] = Math.floor(remaining * 0.2);
  codes[500] = Math.floor(remaining * 0.1);
  codes[429] = remaining - codes[401] - codes[404] - codes[500];
  if (codes[429] < 0) codes[429] = 0;
  return codes;
}



export function generateMockData(): {
  endpoints: ApiEndpoint[];
  logs: LogEntry[];
  teams: Team[];
} {
  const rng = new SeededRandom(42);
  const endpoints: ApiEndpoint[] = [];
  const logs: LogEntry[] = [];
  let logId = 0;

  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;

  // Process documented APIs
  for (const def of DOCUMENTED_APIS) {
    const id = `api-${endpoints.length}`;
    const callCount = rng.int(50, 3000);
    const callers = generateCallers(rng, ['web-frontend', 'mobile-app', 'internal-dashboard', 'api-gateway'], 'high');
    const authDetected = def.authRequired ? rng.bool(0.92) : rng.bool(0.4);
    const statusCodes = generateStatusCodes(rng, callCount, false);
    const piiFields = def.piiFields || [];
    const { score, tier, factors } = scoreRisk(def.path, def.method, piiFields, def.authRequired, authDetected, callCount, callers.length, statusCodes);

    endpoints.push({
      id,
      method: def.method,
      path: def.path,
      description: def.description,
      teamId: def.teamId,
      category: def.category,
      isShadow: false,
      isDocumented: true,
      isZombie: false,
      riskScore: score,
      riskTier: tier,
      riskFactors: factors,
      piiFields,
      authRequired: def.authRequired,
      authDetected,
      callCount,
      callerCount: callers.length,
      distinctCallers: callers,
      firstSeen: new Date(windowStart + rng.int(0, 600000)).toISOString(),
      lastSeen: new Date(now - rng.int(0, 300000)).toISOString(),
      statusCodeDistribution: statusCodes,
      avgResponseTimeMs: rng.int(20, 500),
      responseSample: generateSampleResponse(def.path, piiFields),
      requestSample: generateSampleRequest(def.method, def.path),
      paramHints: paramHintsFromPath(def.path),
      blocked: false,
    });

    // Generate a sample of log entries (not all, for performance)
    const logSampleCount = Math.min(callCount, 200);
    for (let i = 0; i < logSampleCount; i++) {
      const caller = rng.pick(callers);
      logs.push({
        id: logId++,
        timestamp: new Date(windowStart + rng.int(0, 3600000)).toISOString(),
        method: def.method,
        path: def.path,
        statusCode: rng.bool(0.9) ? 200 : rng.pick([401, 404, 500, 429]),
        responseTimeMs: rng.int(10, 800),
        callerIp: caller.ip,
        callerService: caller.service,
        hasAuth: caller.hasAuth,
        authType: caller.hasAuth ? 'Bearer JWT' : null,
        requestSize: rng.int(100, 5000),
        responseSize: rng.int(200, 50000),
        apiId: id,
      });
    }
  }

  // Process shadow APIs
  for (const def of SHADOW_APIS) {
    const id = `api-${endpoints.length}`;
    const volume = def.callVolume;
    const callCount = volume === 'high' ? rng.int(1000, 8000) : volume === 'medium' ? rng.int(100, 1000) : rng.int(10, 100);
    const callers = generateCallers(rng, def.callerServices, volume);
    const authDetected = def.authRequired ? rng.bool(0.5) : rng.bool(0.15);
    const statusCodes = generateStatusCodes(rng, callCount, true);
    const { score, tier, factors } = scoreRisk(def.path, def.method, def.piiFields, def.authRequired, authDetected, callCount, callers.length, statusCodes);

    endpoints.push({
      id,
      method: def.method,
      path: def.path,
      description: def.description,
      teamId: def.teamId,
      category: def.category,
      isShadow: true,
      isDocumented: false,
      isZombie: false,
      riskScore: score,
      riskTier: tier,
      riskFactors: factors,
      piiFields: def.piiFields,
      authRequired: def.authRequired,
      authDetected,
      callCount,
      callerCount: callers.length,
      distinctCallers: callers,
      firstSeen: new Date(windowStart + rng.int(0, 600000)).toISOString(),
      lastSeen: new Date(now - rng.int(0, 300000)).toISOString(),
      statusCodeDistribution: statusCodes,
      avgResponseTimeMs: rng.int(20, 800),
      responseSample: generateSampleResponse(def.path, def.piiFields),
      requestSample: generateSampleRequest(def.method, def.path),
      paramHints: paramHintsFromPath(def.path),
      blocked: false,
    });

    // Generate log entries
    const logSampleCount = Math.min(callCount, 300);
    for (let i = 0; i < logSampleCount; i++) {
      const caller = rng.pick(callers);
      logs.push({
        id: logId++,
        timestamp: new Date(windowStart + rng.int(0, 3600000)).toISOString(),
        method: def.method,
        path: def.path,
        statusCode: rng.bool(0.8) ? 200 : rng.pick([401, 403, 500]),
        responseTimeMs: rng.int(10, 1200),
        callerIp: caller.ip,
        callerService: caller.service,
        hasAuth: caller.hasAuth,
        authType: caller.hasAuth ? 'Bearer JWT' : null,
        requestSize: rng.int(100, 10000),
        responseSize: rng.int(200, 100000),
        apiId: id,
      });
    }
  }

  // Mark zombie APIs (documented but never called)
  // We simulate this by marking a few documented APIs as zombie
  const zombieCount = 5;
  for (let i = 0; i < zombieCount && i < endpoints.length; i++) {
    const ep = endpoints[i * 7];
    if (ep && ep.isDocumented) {
      ep.isZombie = true;
      ep.callCount = 0;
      ep.callerCount = 0;
      ep.distinctCallers = [];
      ep.statusCodeDistribution = {};
    }
  }

  return { endpoints, logs, teams: TEAMS };
}

// ---- OpenAPI Spec Generator ----
export function generateOpenApiSpec(api: ApiEndpoint): string {
  const pathKey = api.path;
  const methodLower = api.method.toLowerCase();
  const params = api.paramHints.map((p) => {
    if (p.in === 'path') {
      return `        {
          "name": "${p.name}",
          "in": "path",
          "required": true,
          "schema": { "type": "${p.type}" }
        }`;
    }
    return `        {
          "name": "${p.name}",
          "in": "query",
          "required": false,
          "schema": { "type": "${p.type}" }
        }`;
  });

  const responseProps: string[] = [];
  for (const pii of api.piiFields) {
    responseProps.push(`          "${pii.field}": { "type": "string", "description": "PII: ${pii.type} (${pii.sensitivity} sensitivity)" }`);
  }
  for (const key of Object.keys(api.responseSample)) {
    if (!api.piiFields.find((p) => p.field === key)) {
      responseProps.push(`          "${key}": { "type": "string" }`);
    }
  }

  const spec = {
    openapi: '3.0.3',
    info: {
      title: `Shadow API: ${api.method} ${api.path}`,
      version: '1.0.0',
      description: `Auto-generated spec for undocumented API endpoint. Risk Score: ${api.riskScore}/100 (${api.riskTier}). Generated by Shadow API Census.`,
    },
    paths: {
      [pathKey]: {
        [methodLower]: {
          summary: api.description,
          security: api.authRequired ? [{ bearerAuth: [] }] : [],
          parameters: params.length > 0 ? params : undefined,
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: responseProps.length > 0 ? responseProps.join(',\n') : undefined,
                  },
                },
              },
            },
          },
        },
      },
    },
    components: api.authRequired ? {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
    } : undefined,
  };

  // Build it manually for better formatting
  const specStr = `{
  "openapi": "3.0.3",
  "info": {
    "title": "Shadow API: ${api.method} ${api.path}",
    "version": "1.0.0",
    "description": "Auto-generated spec for undocumented endpoint discovered by Shadow API Census. Risk: ${api.riskScore}/100 (${api.riskTier})."
  },
  "paths": {
    "${pathKey}": {
      "${methodLower}": {
        "summary": "${api.description}",
        "security": ${api.authRequired ? '[{ "bearerAuth": [] }]' : '[]'},
        ${params.length > 0 ? `"parameters": [\n${params.join(',\n')}\n      ],` : ''}
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
${responseProps.join(',\n')}
                  }
                }
              }
            }
          },
          "401": { "description": "Unauthorized" },
          "403": { "description": "Forbidden" },
          "500": { "description": "Internal Server Error" }
        }
      }
    }
  }${api.authRequired ? `,
  "components": {
    "securitySchemes": {
      "bearerAuth": { "type": "http", "scheme": "bearer" }
    }
  }` : ''}
}`;

  void spec;
  return specStr;
}

// ---- Block Rule Generator ----
export function generateBlockRule(api: ApiEndpoint, format: 'nginx' | 'kong' | 'envoy'): string {
  const escapedPath = api.path.replace(/\{/g, '~{').replace(/\}/g, '}');

  switch (format) {
    case 'nginx':
      return `# Block Shadow API: ${api.method} ${api.path}
# Risk Score: ${api.riskScore}/100 (${api.riskTier})
# Generated by Shadow API Census on ${new Date().toISOString()}
location ~ ^${escapedPath.replace(/{[^}]+}/g, '[^/]+')}$ {
    if ($request_method = ${api.method}) {
        return 403;
    }
    # Log blocked attempt for audit
    access_log /var/log/nginx/blocked_shadow_apis.log;
}`;

    case 'kong':
      return `# Block Shadow API: ${api.method} ${api.path}
# Risk Score: ${api.riskScore}/100 (${api.riskTier})
# Generated by Shadow API Census on ${new Date().toISOString()}
---
plugins:
  - name: request-termination
    config:
      status_code: 403
      message: "Access denied: undocumented API endpoint blocked by Shadow API Census"
    route:
      methods:
        - ${api.method}
      paths:
        - "${api.path}"
      strip_path: false`;

    case 'envoy':
      return `# Block Shadow API: ${api.method} ${api.path}
# Risk Score: ${api.riskScore}/100 (${api.riskTier})
# Generated by Shadow API Census on ${new Date().toISOString()}
apiVersion: envoy.config.route.v3.RouteConfiguration
routes:
  - match:
      prefix: "${api.path.split('{')[0]}"
      headers:
        - name: ":method"
          exact_match: "${api.method}"
    direct_response:
      status: 403
      body:
        inline_string: "Access denied: undocumented API blocked by Shadow API Census"`;
  }
}

// ---- Mock Swagger Doc ----
export function generateMockSwagger(): string {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const def of DOCUMENTED_APIS) {
    const methodLower = def.method.toLowerCase();
    if (!paths[def.path]) paths[def.path] = {};
    paths[def.path][methodLower] = {
      summary: def.description,
      security: def.authRequired ? [{ bearerAuth: [] }] : [],
      responses: {
        '200': { description: 'OK' },
        '401': { description: 'Unauthorized' },
      },
    };
  }

  const swagger = {
    openapi: '3.0.3',
    info: {
      title: 'Company API',
      version: '1.0.0',
      description: 'Official API documentation. This is the documented set of endpoints that the Shadow API Census compares against.',
    },
    paths,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
    },
  };

  return JSON.stringify(swagger, null, 2);
}

// ---- Audit Log Generator ----
export function generateInitialAuditLog(endpoints: ApiEndpoint[]): AuditEntry[] {
  const entries: AuditEntry[] = [];
  const now = Date.now();

  const shadowApis = endpoints.filter((e) => e.isShadow).slice(0, 5);
  for (const api of shadowApis) {
    entries.push({
      id: `audit-${entries.length}`,
      timestamp: new Date(now - rng.int(1, 55) * 60 * 1000).toISOString(),
      actor: 'census-engine',
      action: 'Shadow API Discovered',
      targetApiPath: `${api.method} ${api.path}`,
      targetApiId: api.id,
      details: `Risk score ${api.riskScore}/100 (${api.riskTier}). ${api.piiFields.length} PII fields exposed, ${api.callerCount} callers identified.`,
      severity: api.riskTier === 'critical' ? 'critical' : api.riskTier === 'high' ? 'warning' : 'info',
    });
  }

  entries.push({
    id: `audit-${entries.length}`,
    timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
    actor: 'census-engine',
    action: 'Census Run Completed',
    targetApiPath: '-',
    targetApiId: null,
    details: `Analyzed ${endpoints.length} API endpoints. Found ${endpoints.filter((e) => e.isShadow).length} shadow APIs, ${endpoints.filter((e) => e.isZombie).length} zombie APIs.`,
    severity: 'info',
  });

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ---- Census Result Calculator ----
export function calculateCensusResult(endpoints: ApiEndpoint[], logs: LogEntry[]): import('./types').CensusResult {
  const shadowApis = endpoints.filter((e) => e.isShadow);
  const documentedApis = endpoints.filter((e) => e.isDocumented);
  const zombieApis = endpoints.filter((e) => e.isZombie);

  return {
    totalApis: endpoints.length,
    documentedApis: documentedApis.length,
    shadowApis: shadowApis.length,
    zombieApis: zombieApis.length,
    totalCalls: logs.length,
    criticalCount: shadowApis.filter((e) => e.riskTier === 'critical').length,
    highCount: shadowApis.filter((e) => e.riskTier === 'high').length,
    mediumCount: shadowApis.filter((e) => e.riskTier === 'medium').length,
    lowCount: shadowApis.filter((e) => e.riskTier === 'low').length,
    piiExposedCount: shadowApis.filter((e) => e.piiFields.length > 0).length,
    unauthCount: shadowApis.filter((e) => !e.authRequired).length,
    censusDate: new Date().toISOString(),
    logWindowStart: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    logWindowEnd: new Date().toISOString(),
    coveragePercent: Math.round((documentedApis.length / endpoints.length) * 100),
  };
}
