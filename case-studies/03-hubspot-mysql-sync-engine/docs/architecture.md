# Architecture Diagram & Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            HUBSPOT CRM                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │  Contacts   │  │   Deals     │  │  Companies  │  │ Custom Objects  │    │
│  │             │  │             │  │             │  │ • Subscription  │    │
│  │             │  │             │  │             │  │ • Feature Usage │    │
│  │             │  │             │  │             │  │ • Onboarding    │    │
│  │             │  │             │  │             │  │ • Contract      │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘    │
│         │                │                │                   │             │
│         ▼                ▼                ▼                   ▼             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    HUBSPOT PRIVATE APP                               │    │
│  │  • OAuth 2.0 Access Token (scoped)                                  │    │
│  │  • Rate Limits: 100 req/10s burst, 400 req/min sustained           │    │
│  │  • Webhook Subscriptions: contact, deal, company, custom objects   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                    HTTPS / REST API + Webhooks
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SYNC ENGINE (Node.js)                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Webhook Server │  │  Scheduler      │  │  Sync Core                  │  │
│  │  (Express)      │  │  (node-cron)    │  │  • Rate Limiter (p-limit)   │  │
│  │  • Signature    │  │  • Contacts     │  │  • Retry Logic              │  │
│  │    Verification │  │    every 5min   │  │  • Batch Operations         │  │
│  │  • Dedupe       │  │  • Deals        │  │  • Idempotent Upserts       │  │
│  │    (eventId)    │  │    every 5min   │  │  • Cursor Pagination        │  │
│  │  • Route to     │  │  • Companies    │  │  • Checkpoint/Resume        │  │
│  │    Handlers     │  │    every 5min   │  │                             │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘  │
│           │                    │                           │                 │
│           ▼                    ▼                           ▼                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        METRICS & OBSERVABILITY                       │    │
│  │  • Prometheus Metrics (/metrics)                                    │    │
│  │  • Structured Logging (JSON)                                        │    │
│  │  • Health Check Endpoint (/health)                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                          MySQL Protocol (TCP)
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MYSQL DATABASE                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ hubspot_contacts │  │ hubspot_deals    │  │ hubspot_companies        │   │
│  │                  │  │                  │  │                          │   │
│  │ hs_id (PK)       │  │ hs_id (PK)       │  │ hs_id (PK)               │   │
│  │ email            │  │ dealname         │  │ name                     │   │
│  │ firstname        │  │ amount           │  │ domain                   │   │
│  │ lastname         │  │ dealstage        │  │ ...                      │   │
│  │ company          │  │ pipeline         │  │                          │   │
│  │ lifecyclestage   │  │ closedate        │  │                          │   │
│  │ hs_lastmodified  │  │ hs_lastmodified  │  │                          │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ hubspot_subs     │  │ hubspot_features │  │ hubspot_onboarding       │   │
│  │                  │  │                  │  │                          │   │
│  │ hs_id (PK)       │  │ hs_id (PK)       │  │ hs_id (PK)               │   │
│  │ company_id (FK)  │  │ company_id (FK)  │  │ company_id (FK)          │   │
│  │ plan_tier        │  │ date             │  │ contact_id (FK)          │   │
│  │ mrr              │  │ feature_name     │  │ stage                    │   │
│  │ status           │  │ usage_count      │  │ health_score             │   │
│  │ renewal_date     │  │ unique_users     │  │ target_launch_date       │   │
│  │ hs_lastmodified  │  │ hs_lastmodified  │  │ hs_lastmodified          │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ sync_metadata                                                         │   │
│  │ object_type | last_sync | records_synced | errors | status           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Patterns

### 1. HubSpot → MySQL (Webhook-Driven, Near Real-Time)
```
HubSpot Event → Webhook → Signature Verify → Dedupe (eventId) → Route Handler
                                                              → Fetch Full Object (if needed)
                                                              → Upsert to MySQL (ON DUPLICATE KEY)
                                                              → Update Metrics
                                                              → ACK 200 to HubSpot
```
**Latency:** < 2 minutes P95
**Guarantee:** At-least-once (idempotent upserts handle duplicates)

### 2. HubSpot → MySQL (Scheduled Polling, Fallback)
```
Cron Trigger → Search API (cursor + hs_lastmodifieddate filter)
             → Paginated Results (batchSize=100)
             → Parallel Upserts (concurrency=5)
             → Checkpoint lastSyncTimestamp
             → Update Metrics
```
**Frequency:** Every 5 minutes (configurable)
**Guarantee:** Eventually consistent (catches webhook misses)

### 3. MySQL → HubSpot (Outbound Sync)
```
MySQL Change (CDC or App-Level) → Message Queue → Sync Worker
                                 → HubSpot Batch API (Upsert)
                                 → Update MySQL Sync Status
```
**Note:** Implemented via application-level triggers in billing/provisioning systems.

## Deployment Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  GitHub     │────►│  GitHub     │────►│  AWS ECR    │
│  Actions    │     │  Actions    │     │  (Docker)   │
│  (CI)       │     │  (CD)       │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                    ┌─────────────────────────────────────┐
                    │         AWS ECS Fargate             │
                    │  ┌───────────────────────────────┐  │
                    │  │ Task Definition (2+ tasks)    │  │
                    │  │ • CPU: 512, Memory: 1024      │  │
                    │  │ • Auto-scaling: CPU > 70%     │  │
                    │  │ • Health Check: /health       │  │
                    │  └───────────────────────────────┘  │
                    └─────────────────────────────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
            ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
            │ AWS Secrets │            │  MySQL      │            │ CloudWatch  │
            │ Manager     │            │  (RDS/Aurora)           │  Logs       │
            │ • HS Token  │            │             │            │             │
            │ • DB Creds  │            │             │            │             │
            │ • Webhook   │            │             │            │             │
            │   Secret    │            │             │            │             │
            └─────────────┘            └─────────────┘            └─────────────┘
```

## Security Considerations

| Layer | Controls |
|-------|----------|
| **Network** | ECS tasks in private subnets; MySQL in private subnet; Security groups restrict traffic |
| **Secrets** | All secrets in AWS Secrets Manager; IAM roles for task execution; No secrets in code/env |
| **Transport** | TLS 1.2+ for all external connections (HubSpot API, MySQL, Secrets Manager) |
| **Authentication** | HubSpot Private App token (scoped least privilege); MySQL user with minimal grants |
| **Webhook Security** | HMAC-SHA256 signature verification; Timestamp validation (reject > 5 min old) |
| **Rate Limiting** | Client-side token bucket; Server-side 429 handling with exponential backoff |
| **Audit** | All sync operations logged with correlation IDs; Monthly reconciliation report |

## Scaling Strategy

| Dimension | Current | Scale Trigger | Action |
|-----------|---------|---------------|--------|
| **Concurrency** | 5 parallel workers | Sync duration > 4 min | Increase to 10 (monitor HubSpot 429s) |
| **Batch Size** | 100 records | Memory pressure | Reduce to 50 |
| **Polling Frequency** | 5 min | Lag > 10 min | Reduce to 2 min (watch rate limits) |
| **ECS Tasks** | 2 (min) | CPU > 70% 5min | Auto-scale to 5 (max) |
| **MySQL Connections** | Pool 10 | Pool exhaustion | Increase pool; Read replica for SELECTs |

## Failure Modes & Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| HubSpot API 429 | Metrics: `api_rate_limit_remaining` = 0 | Exponential backoff; Reduce concurrency |
| HubSpot API 5xx | Sync error counter spike | Retry with backoff; Circuit breaker after 5 failures |
| MySQL Deadlock | Error type `ER_LOCK_DEADLOCK` | Retry transaction (max 3) |
| Webhook Delivery Failure | HubSpot retry headers | HubSpot retries 3x; DLQ for manual replay |
| Schema Drift | Startup property discovery | Alert on new required fields; Auto-add nullable columns |
| Data Corruption | Monthly reconciliation mismatch | Full re-sync from checkpoint; Manual investigation |