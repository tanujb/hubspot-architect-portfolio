# Case Study 03: HubSpot ↔ MySQL Bidirectional Sync Engine

## 🎯 Problem

Client needed real-time, reliable sync between HubSpot (CRM) and internal MySQL database (billing, provisioning, analytics).  
Requirements: <5 min latency, zero data loss, handle 500k+ contacts, 50k+ deals, auto-recovery from outages.

## 🏗 Architecture

```
┌─────────────┐     Webhooks / Polling      ┌──────────────┐
│   HubSpot   │ ◄─────────────────────────► │  Sync Engine │ ◄──► │   MySQL      │
│  (Private   │   OAuth / Private App       │  (Node.js)   │      │  (Billing,   │
│   App)      │                             │              │      │  Provisioning)│
└─────────────┘                             └──────────────┘      └──────────────┘
```

**Components:**
- **HubSpot Private App** — scoped OAuth token (crm.objects.contacts.read/write, crm.objects.deals.read/write, webhooks)
- **Sync Engine** — Node.js service (deployed on AWS ECS Fargate, scheduled + webhook-triggered)
- **MySQL** — Primary system of record for billing/provisioning

## 🔑 Key Technical Decisions

| Challenge | Solution |
|-----------|----------|
| HubSpot rate limits (100 req/10s) | Token bucket limiter (`p-limit`), exponential backoff, batch API (100/objects) |
| Idempotency | `hs_lastmodifieddate` as cursor; `ON DUPLICATE KEY UPDATE` in MySQL; webhook deduplication via `eventId` |
| Large initial sync | Parallel cursor-based pagination; checkpoint every 10k records; resumable |
| Schema drift | Auto-discover HubSpot properties on startup; alert on new required fields |
| Monitoring | Prometheus metrics: `synced_count`, `error_rate`, `lag_seconds`; Grafana dashboard + PagerDuty alerts |

## 📦 Code Structure

```
src/
├── sync.js           # Core sync logic
├── config.js         # Environment config (tokens, DB, feature flags)
├── webhook.js        # Express handler for HubSpot webhooks
├── scheduler.js      # Cron jobs for polling sync
├── metrics.js        # Prometheus metrics
└── index.js          # Entry point
```

## 🚀 Deployment

- **CI/CD:** GitHub Actions → Docker → AWS ECR → ECS Fargate
- **Secrets:** AWS Secrets Manager (HubSpot token, DB credentials)
- **Observability:** CloudWatch Logs + Prometheus + Grafana

## 📊 Results

- **Latency:** P95 < 2 min (webhook-driven), < 5 min (scheduled fallback)
- **Throughput:** 10k contacts/min, 5k deals/min during peak
- **Reliability:** 99.9% sync success rate over 6 months; auto-recovered from 3 HubSpot API outages
- **Data integrity:** Zero lost updates verified via monthly reconciliation job

## 🔗 Source

- [Sync Engine Code](./src/)
- [Architecture Diagram](./docs/architecture.md)
- [API Reference](./docs/api-reference.md)