# Migration Validation Checklist

## Pre-Migration

- [ ] Source system access confirmed (read-only for audit, read-write for extraction)
- [ ] HubSpot portal provisioned (Production + Sandbox)
- [ ] HubSpot Private App created with required scopes
- [ ] Custom objects defined in HubSpot (via API script)
- [ ] All custom properties created with correct field types
- [ ] Pipelines configured (Sales, Renewal, Onboarding, Support)
- [ ] Teams and users provisioned with correct permissions
- [ ] Business units configured (if multi-brand)
- [ ] Integration inventory documented (all systems reading/writing CRM)
- [ ] Migration scripts version-controlled (Git)
- [ ] Rollback procedure documented and tested

## Property Mapping

- [ ] Complete field inventory from all source systems
- [ ] Mapping document reviewed by Sales, Marketing, CS, Finance
- [ ] Standard HubSpot properties identified (use native where possible)
- [ ] Custom properties created for non-standard fields
- [ ] Enumeration options match source values (or mapped)
- [ ] Required fields marked in HubSpot
- [ ] Validation rules applied (regex, min/max, unique)
- [ ] Calculated properties defined (MRR totals, health scores)

## Data Extraction

- [ ] Extraction scripts handle: pagination, rate limits, error retry
- [ ] Data exported to staged CSV/Parquet files (not direct DB→HubSpot)
- [ ] Encoding: UTF-8 confirmed
- [ ] Date format: ISO 8601 UTC confirmed
- [ ] Currency: ISO 4217 code + amount separated
- [ ] Null handling documented (empty string vs NULL vs default)

## Data Transformation

- [ ] Deduplication logic implemented and tested
- [ ] Field transformations: trim, case, parse, map enums
- [ ] Association keys preserved (source IDs → HubSpot IDs mapping table)
- [ ] Engagement records: timestamps preserved, owners mapped
- [ ] Attachment handling: URLs accessible, file size limits checked
- [ ] GDPR/consent fields mapped correctly

## Test Migration (Sandbox)

- [ ] Full migration run against sandbox completed
- [ ] Row count validation: Source vs HubSpot per object
- [ ] Referential integrity: All associations resolve
- [ ] Property completeness: Required fields populated
- [ ] Workflow test: Sample records enroll correctly
- [ ] Report validation: Key dashboards render accurately
- [ ] Integration test: All downstream systems connect to sandbox
- [ ] Performance: Bulk API throughput meets SLA
- [ ] UAT sign-off: Sales, Marketing, CS leads approve

## Delta Sync Preparation

- [ ] Change capture mechanism: `hs_lastmodifieddate` or CDC
- [ ] Delta sync scripts tested (extract changes since test migration)
- [ ] Conflict resolution: HubSpot wins vs Source wins documented
- [ ] Cutover checklist reviewed with all stakeholders

## Production Cutover

- [ ] Cutover window scheduled (low-usage period)
- [ ] Communication sent to all users (timeline, impact, contacts)
- [ ] Source system read-only mode enabled at freeze start
- [ ] Final extraction from source
- [ ] Delta sync execution
- [ ] Final validation: Spot checks on 50+ records per object
- [ ] Key reports validated against pre-freeze snapshots
- [ ] Critical workflows tested end-to-end
- [ ] DNS/SSO/Integration switches executed
- [ ] User access verified (login, permissions, views)
- [ ] Go/No-Go decision documented

## Post-Cutover (Hypercare: 2 Weeks)

- [ ] Daily sync validation (automated + manual spot checks)
- [ ] User support channel active (Slack/Teams + dedicated email)
- [ ] Issue tracker: Triage SLA < 4 hours for P1, < 24 hours for P2
- [ ] Duplicate monitoring: Weekly dedupe report
- [ ] Performance monitoring: API latency, report load times
- [ ] Training sessions: Completed for all user groups
- [ ] Documentation: Updated SOPs, data dictionary, runbooks
- [ ] Retrospective: Lessons learned documented
- [ ] Sign-off: Stakeholder approval to close hypercare

## Rollback Criteria (Any Triggers Full Rollback)

- [ ] > 5% record count mismatch post-cutover
- [ ] Critical workflows failing for > 30 minutes
- [ ] Key integrations down for > 1 hour
- [ ] Data corruption detected (wrong associations, lost values)
- [ ] Security/access breach
- [ ] Executive stakeholder calls rollback

## Rollback Procedure

1. Notify all stakeholders: "Rollback initiated"
2. Revert DNS/SSO/Integration switches
3. Restore source system write access
4. Communicate expected downtime
5. Post-mortem within 48 hours