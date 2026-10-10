/*
# Shadow API Census — Core Schema

## Summary
Creates the complete database schema for the Shadow API Census application: teams, API endpoints,
API call logs, audit log entries, and block rules. All tables use anon+authenticated access
(no sign-in screen — the app is a shared demo) with full CRUD via RLS policies.

## New Tables

1. **teams** — Owning teams for API endpoints (Auth, Payments, Platform, Data, Users)
   - id (text, PK), name, description, color, owner_name, owner_email, created_at

2. **api_endpoints** — Every discovered API endpoint (documented, shadow, or zombie)
   - id (text, PK), method, path, description, team_id (FK→teams), category
   - is_shadow, is_documented, is_zombie (booleans)
   - risk_score (0-100), risk_tier (critical/high/medium/low)
   - risk_factors, pii_fields, distinct_callers, status_code_distribution (JSONB arrays/objects)
   - auth_required, auth_detected, call_count, caller_count
   - first_seen, last_seen, avg_response_time_ms
   - response_sample, request_sample (JSONB), param_hints (JSONB array)
   - blocked (boolean), open_api_spec, block_rule (text, nullable)

3. **api_calls** — Individual API gateway log entries (up to 1M rows)
   - id (bigint identity, PK), timestamp, method, path, status_code, response_time_ms
   - caller_ip, caller_service, has_auth, auth_type, request_size, response_size, api_id (FK→api_endpoints)

4. **audit_log** — Audit trail of all census actions
   - id (text, PK), timestamp, actor, action, target_api_path, target_api_id (nullable FK)
   - details, severity (info/warning/critical)

5. **block_rules** — Generated proxy block rules for shadow APIs
   - id (text, PK), api_id (FK→api_endpoints), api_path, method, format (nginx/kong/envoy)
   - rule (text), status (active/draft/disabled), created_at, created_by

## Security
- RLS enabled on ALL tables.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because
  this is a single-tenant demo app with no sign-in screen — the data is intentionally shared/public.
- 4 separate policies per table (SELECT/INSERT/UPDATE/DELETE), never FOR ALL.

## Indexes
- api_endpoints: index on is_shadow, risk_tier, team_id, path
- api_calls: index on api_id, timestamp, status_code
- audit_log: index on timestamp, severity
- block_rules: index on api_id, status
*/

-- ===== TEAMS =====
CREATE TABLE IF NOT EXISTS teams (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#3b82f6',
  owner_name text NOT NULL DEFAULT '',
  owner_email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams_select_all" ON teams;
CREATE POLICY "teams_select_all" ON teams FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "teams_insert_all" ON teams;
CREATE POLICY "teams_insert_all" ON teams FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "teams_update_all" ON teams;
CREATE POLICY "teams_update_all" ON teams FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "teams_delete_all" ON teams;
CREATE POLICY "teams_delete_all" ON teams FOR DELETE
  TO anon, authenticated USING (true);


-- ===== API_ENDPOINTS =====
CREATE TABLE IF NOT EXISTS api_endpoints (
  id text PRIMARY KEY,
  method text NOT NULL CHECK (method IN ('GET','POST','PUT','PATCH','DELETE')),
  path text NOT NULL,
  description text NOT NULL DEFAULT '',
  team_id text NOT NULL REFERENCES teams(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'admin' CHECK (category IN ('auth','payments','users','admin','analytics','notifications','files','search')),
  is_shadow boolean NOT NULL DEFAULT false,
  is_documented boolean NOT NULL DEFAULT true,
  is_zombie boolean NOT NULL DEFAULT false,
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_tier text NOT NULL DEFAULT 'low' CHECK (risk_tier IN ('critical','high','medium','low')),
  risk_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  pii_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  auth_required boolean NOT NULL DEFAULT true,
  auth_detected boolean NOT NULL DEFAULT true,
  call_count integer NOT NULL DEFAULT 0,
  caller_count integer NOT NULL DEFAULT 0,
  distinct_callers jsonb NOT NULL DEFAULT '[]'::jsonb,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  status_code_distribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  avg_response_time_ms integer NOT NULL DEFAULT 0,
  response_sample jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_sample jsonb NOT NULL DEFAULT '{}'::jsonb,
  param_hints jsonb NOT NULL DEFAULT '[]'::jsonb,
  blocked boolean NOT NULL DEFAULT false,
  open_api_spec text,
  block_rule text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "endpoints_select_all" ON api_endpoints;
CREATE POLICY "endpoints_select_all" ON api_endpoints FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "endpoints_insert_all" ON api_endpoints;
CREATE POLICY "endpoints_insert_all" ON api_endpoints FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "endpoints_update_all" ON api_endpoints;
CREATE POLICY "endpoints_update_all" ON api_endpoints FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "endpoints_delete_all" ON api_endpoints;
CREATE POLICY "endpoints_delete_all" ON api_endpoints FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_endpoints_is_shadow ON api_endpoints(is_shadow);
CREATE INDEX IF NOT EXISTS idx_endpoints_risk_tier ON api_endpoints(risk_tier);
CREATE INDEX IF NOT EXISTS idx_endpoints_team_id ON api_endpoints(team_id);
CREATE INDEX IF NOT EXISTS idx_endpoints_path ON api_endpoints(path);


-- ===== API_CALLS (log entries) =====
CREATE TABLE IF NOT EXISTS api_calls (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  timestamp timestamptz NOT NULL DEFAULT now(),
  method text NOT NULL CHECK (method IN ('GET','POST','PUT','PATCH','DELETE')),
  path text NOT NULL,
  status_code integer NOT NULL DEFAULT 200,
  response_time_ms integer NOT NULL DEFAULT 0,
  caller_ip text NOT NULL DEFAULT '',
  caller_service text NOT NULL DEFAULT '',
  has_auth boolean NOT NULL DEFAULT false,
  auth_type text,
  request_size integer NOT NULL DEFAULT 0,
  response_size integer NOT NULL DEFAULT 0,
  api_id text NOT NULL REFERENCES api_endpoints(id) ON DELETE CASCADE
);

ALTER TABLE api_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calls_select_all" ON api_calls;
CREATE POLICY "calls_select_all" ON api_calls FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "calls_insert_all" ON api_calls;
CREATE POLICY "calls_insert_all" ON api_calls FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "calls_update_all" ON api_calls;
CREATE POLICY "calls_update_all" ON api_calls FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "calls_delete_all" ON api_calls;
CREATE POLICY "calls_delete_all" ON api_calls FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_calls_api_id ON api_calls(api_id);
CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON api_calls(timestamp);
CREATE INDEX IF NOT EXISTS idx_calls_status_code ON api_calls(status_code);


-- ===== AUDIT_LOG =====
CREATE TABLE IF NOT EXISTS audit_log (
  id text PRIMARY KEY,
  timestamp timestamptz NOT NULL DEFAULT now(),
  actor text NOT NULL DEFAULT 'system',
  action text NOT NULL,
  target_api_path text NOT NULL DEFAULT '-',
  target_api_id text REFERENCES api_endpoints(id) ON DELETE SET NULL,
  details text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical'))
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_select_all" ON audit_log;
CREATE POLICY "audit_select_all" ON audit_log FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "audit_insert_all" ON audit_log;
CREATE POLICY "audit_insert_all" ON audit_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "audit_update_all" ON audit_log;
CREATE POLICY "audit_update_all" ON audit_log FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "audit_delete_all" ON audit_log;
CREATE POLICY "audit_delete_all" ON audit_log FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_log(severity);


-- ===== BLOCK_RULES =====
CREATE TABLE IF NOT EXISTS block_rules (
  id text PRIMARY KEY,
  api_id text NOT NULL REFERENCES api_endpoints(id) ON DELETE CASCADE,
  api_path text NOT NULL,
  method text NOT NULL CHECK (method IN ('GET','POST','PUT','PATCH','DELETE')),
  format text NOT NULL CHECK (format IN ('nginx','kong','envoy')),
  rule text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL DEFAULT 'security-analyst'
);

ALTER TABLE block_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rules_select_all" ON block_rules;
CREATE POLICY "rules_select_all" ON block_rules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "rules_insert_all" ON block_rules;
CREATE POLICY "rules_insert_all" ON block_rules FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "rules_update_all" ON block_rules;
CREATE POLICY "rules_update_all" ON block_rules FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "rules_delete_all" ON block_rules;
CREATE POLICY "rules_delete_all" ON block_rules FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_rules_api_id ON block_rules(api_id);
CREATE INDEX IF NOT EXISTS idx_rules_status ON block_rules(status);
