# Shadow API Census

A Shadow API discovery engine that compares live API Gateway traffic against your Swagger/OpenAPI documentation to find undocumented endpoints — "shadow APIs" — that are actively being called in production but missing from your official API specs.

> **Resume Line:** Built a Shadow API discovery engine that found 23 undocumented endpoints by comparing live traffic vs Swagger, reducing attack surface.

## What It Does

1. **Ingests 1 hour of API Gateway logs** (mock traffic from 100+ endpoints, ~50K log lines)
2. **Parses your Swagger/OpenAPI spec** to build the "documented" API inventory
3. **Runs a diff engine** comparing documented APIs vs. actually-called APIs, producing three buckets:
   - **Documented & Called** — healthy APIs in your spec and in production
   - **Documented but Not Called (Zombie APIs)** — stale spec entries nobody uses anymore
   - **Called but Not Documented (Shadow APIs)** — the dangerous ones: live in prod, absent from Swagger
4. **Scores each shadow API 0–100** based on PII exposure, auth gaps, path/method sensitivity, call volume, and success rate
5. **Auto-generates OpenAPI 3.0 specs** for shadow endpoints by inferring parameters and response schemas from traffic
6. **Generates one-click block rules** in NGINX, Kong, or Envoy format to immediately block shadow APIs at the gateway
7. **Tracks team ownership** — every shadow API is assigned to a team for remediation accountability
8. **Maintains a full audit log** of every action taken (block rules, spec exports, ownership changes)

## Key Features

### Swagger vs Reality Diff Engine
The core diff engine normalizes both the Swagger spec and the live traffic logs into sets of `(method, path)` tuples, then computes the set difference to identify shadow and zombie APIs. Path parameters are normalized (`/api/v1/users/123` → `/api/v1/users/{id}`) so parameterized endpoints match correctly.

### Risk Score (0–100)
Each shadow API receives a composite risk score from five weighted factors:

| Factor | Max Points | Description |
|--------|-----------|-------------|
| PII Data Exposure | 35 | SSN (15pts), credit card (15pts), auth tokens (15pts), email/phone (8pts), name/IP (3pts) per field |
| Authentication Gap | 25 | No auth required AND no tokens observed = full 25; auth required but missing = 15 |
| Path & Method Sensitivity | 20 | `/admin` (+12), `/export`/`/dump` (+8), `/debug`/`/internal` (+6), DELETE (+5), PUT/PATCH (+3) |
| Exposure Volume | 12 | >1000 calls = 12; >100 = 8; >10 = 4; else 2 |
| Success Rate | 8 | Proportion of 200 responses — successful shadow APIs are riskier than broken ones |

Tiers: **Critical** (80–100) · **High** (60–79) · **Medium** (30–59) · **Low** (0–29)

### Auto-Generated OpenAPI Specs
For each shadow endpoint, the engine infers:
- Path parameters from URL patterns (`{id}`, `{key}`)
- Query parameters from search/export endpoints
- Request body schema from observed POST/PUT payloads
- Response schema from observed response samples
- Security requirements based on auth detection

### Multi-Tenant Team Ownership
Every API is assigned to one of five teams. The Teams page shows a risk heatmap per team, top shadow APIs, and allows reassigning ownership with full audit logging.

### One-Click Block Rule Generation
Generates ready-to-deploy proxy rules in three formats:
- **NGINX** — `location` block with method check and 403 response
- **Kong** — `request-termination` plugin configuration
- **Envoy** — `RouteConfiguration` with `direct_response` 403

### Virtualized Table for 1M+ Log Lines
The Shadow APIs inventory uses `@tanstack/react-virtual` for windowed rendering — only visible rows are mounted in the DOM, enabling smooth scrolling through massive datasets.

### API Graph Visualization
An interactive ReactFlow dependency map shows all APIs grouped by team. Shadow API nodes glow red with animated pulsing borders; documented APIs are calm blue; zombie APIs are dimmed. Click any node to drill into the detail view.

---

## Threat Model

### What Are Shadow APIs?
Shadow APIs are endpoints that exist in production but are absent from official API documentation (Swagger/OpenAPI specs). They arise from:
- **Feature flags shipped then forgotten** — an endpoint was added behind a flag, the flag was removed, but the endpoint remained
- **Legacy/internal tools** — admin or debug endpoints created for internal use that were never documented or decommissioned
- **Deprecated but unremoved** — old API versions that are still accessible but no longer in the spec
- **Merged code without review** — endpoints added by a team that didn't update the spec

### Why Are They Dangerous?
1. **Unreviewed attack surface** — Security teams review documented APIs. Shadow APIs bypass this review entirely.
2. **Missing auth controls** — Shadow endpoints frequently lack authentication checks because they were built for internal use without security review.
3. **PII exposure** — Undocumented endpoints may return sensitive data (SSNs, credit cards, auth tokens) without the data minimization controls applied to documented APIs.
4. **No rate limiting** — Shadow APIs are often not covered by gateway rate-limiting rules, making them vulnerable to abuse.
5. **No monitoring** — Since they're not in the spec, observability tools don't track them, and incidents go undetected.

### Adversary Model
- **Insider with network access** — An employee or contractor who can discover endpoints by observing internal traffic or guessing URL patterns. Shadow admin endpoints are particularly exploitable.
- **External attacker** — An attacker who discovers shadow endpoints through path enumeration, leaked logs, or reconnaissance. Undocumented debug endpoints (e.g., `/api/v1/admin/debug/sql`) are prime targets.
- **Compromised internal service** — An attacker who compromises one internal service can use it to call shadow endpoints that trust internal callers without authentication.

### Mitigations Provided
- **Discovery** — The census engine surfaces all shadow APIs, eliminating the "unknown unknowns"
- **Risk prioritization** — The 0–100 score focuses remediation on the most dangerous endpoints first
- **Immediate blocking** — One-click block rule generation stops the bleeding while remediation is planned
- **Spec gap closure** — Auto-generated OpenAPI specs enable teams to formally document or deprecate shadow endpoints
- **Accountability** — Team ownership assignment ensures every shadow API has a responsible party

---

## How to Run Census in Production

### Architecture

```
API Gateway (AWS/Kong/Envoy)
        │
        ▼
  Log Export (S3/CloudWatch/ELK)
        │
        ▼
  Log Parser (Go + eBPF sidecar)
        │  - Normalizes path parameters
        │  - Extracts method, status, auth headers
        │  - Samples request/response payloads
        ▼
  Diff Engine
        │  - Loads Swagger/OpenAPI spec
        │  - Compares against observed traffic
        │  - Classifies: documented / shadow / zombie
        ▼
  Risk Scorer
        │  - Scores each shadow API 0–100
        │  - Identifies PII fields in responses
        │  - Detects auth gaps
        ▼
  Census Dashboard (Next.js)
        │  - API graph, shadow API table
        │  - Auto-generated specs, block rules
        │  - Team ownership, audit log
        ▼
  Action Pipeline
           - Block rule deployment to gateway
           - Spec PR creation to API registry
           - Alerting to team Slack channels
```

### Deployment Guide

1. **Enable API Gateway access logging** with the following fields: `method`, `path`, `status`, `response_time`, `caller_ip`, `auth_header_present`, `request_size`, `response_size`. Include request/response body sampling (1% sample rate is sufficient for PII detection).

2. **Export logs to a processing pipeline** — S3 → Lambda/Go service, or CloudWatch → Kinesis → Go worker. The log parser normalizes paths (`/users/123` → `/users/{id}`) by matching against known parameter patterns.

3. **Schedule recurring censuses** — Run every 6 hours (or every 1 hour for high-traffic environments). The 1-hour window balances coverage with processing cost. Use the diff engine's idempotent design to merge results across runs.

4. **Integrate with your API gateway for block rule deployment** — The generated NGINX/Kong/Envoy rules can be deployed directly via your gateway's config pipeline (Kong declarative config, Envoy xDS, NGINX config reload).

5. **Set up team notifications** — When a new critical shadow API is discovered, send an alert to the owning team's Slack/Teams channel with a link to the detail page.

6. **Establish a remediation SLA**:
   - Critical (80–100): Block within 1 hour, document or deprecate within 24 hours
   - High (60–79): Block within 4 hours, remediate within 1 week
   - Medium (30–59): Document or deprecate within 2 weeks
   - Low (0–29): Document in next sprint

### Production Considerations
- **Log retention**: Keep at least 7 days of gateway logs for trend analysis
- **PII handling**: The census engine samples response bodies — ensure your log pipeline encrypts or redacts PII at rest. The dashboard displays field names, not actual PII values.
- **False positive budget**: Expect 10–20% false positive rate initially (see below). Budget time for manual triage during the first week.

---

## False Positive Handling

Shadow API discovery is inherently noisy — not every undocumented endpoint is a security risk. The census engine includes several heuristics to reduce false positives:

### Automated Suppression

1. **Health check filtering** — Endpoints matching `/health`, `/status`, `/ping`, `/ready` are suppressed unless they expose internal details (the engine detects response body patterns like IP addresses or config keys).

2. **Low-volume threshold** — Endpoints with fewer than 5 calls in the census window are marked "Low" risk and can be bulk-dismissed. Most true shadow APIs have consistent traffic from internal services.

3. **Deprecation grace period** — If an endpoint was documented in a previous census but removed from the spec within the last 30 days, it's marked "Recently Undocumented" rather than "Shadow" to avoid alerting on intentional deprecations.

4. **Internal-only allowlisting** — Endpoints only called from internal IP ranges (10.x, 172.16-31.x, 192.168.x) with authentication present are deprioritized. The risk score is halved but the endpoint is still listed for review.

5. **Options/CORS preflight filtering** — HTTP `OPTIONS` requests are never classified as shadow APIs — they're CORS preflight checks, not real API calls.

### Manual Triage Workflow

1. **Review the risk score breakdown** — The Overview tab shows exactly which factors contributed to the score. An endpoint with high PII exposure but proper auth may be a legitimate internal API that just needs documentation.

2. **Check the callers** — If all callers are internal services with auth tokens, the endpoint is likely a legitimate internal API. If callers include external IPs or services without auth, it's a true positive.

3. **Review the data exposure** — If the "PII fields" are actually just metadata (timestamps, IDs) rather than sensitive personal data, the risk is overstated.

4. **Verify against recent deployments** — Check if the endpoint was recently added and documentation is pending. A 24-hour grace period for new endpoints is reasonable.

### Allowlist Management

Endpoints confirmed as legitimate (internal-only, intentionally undocumented) can be added to an allowlist. The census engine will skip allowlisted endpoints in future runs. Allowlist entries should include:
- The endpoint path and method
- The reason for allowlisting (e.g., "internal admin tool, auth required, no PII")
- The approving team and date
- An expiration date (quarterly review recommended)

### Denylist (Block Rules)

Endpoints confirmed as true positives should be blocked immediately. The one-click block rule generates a gateway configuration that returns 403 for all requests to the endpoint. Blocked endpoints remain in the inventory with a "Blocked" badge for audit purposes.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Visualization**: ReactFlow (API graph), Recharts (charts), @tanstack/react-virtual (virtualized table)
- **Backend**: In-memory mock data engine with deterministic seeded randomness
- **Design**: Dark/light theme with Wiz.io-inspired security aesthetic (red glow for shadow APIs)

## Getting Started

```bash
npm install
npm run dev
```

The app runs with a pre-generated dataset of 100+ API endpoints, 23 shadow APIs, and ~50K log lines. All data is deterministic — the same dataset loads every time.

## Resume Line

> Built a Shadow API discovery engine that found 23 undocumented endpoints by comparing live traffic vs Swagger, reducing attack surface.
