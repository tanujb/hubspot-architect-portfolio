# Case Study 02: CRM Migration Playbook

## 🎯 Business Context

**Scenario:** Mid-size advertising agency migrating from legacy CRM (spreadsheets + custom PHP CRM) to HubSpot.  
**Scope:** 500k+ contacts, 50k+ companies, 25k+ deals, 100k+ engagement records (emails, calls, meetings).  
**Timeline:** 6 weeks (2 weeks discovery, 2 weeks build, 1 week test, 1 week cutover).  
**Constraint:** Zero downtime for sales team; marketing campaigns must continue uninterrupted.

---

## 📋 Migration Strategy

### Phase 1: Discovery & Mapping (Weeks 1-2)
- Stakeholder interviews: Sales, Marketing, CS, Finance, IT
- Data audit: Source systems, field inventory, data quality assessment
- Property mapping workshop: Source field → HubSpot property (standard + custom)
- Custom object requirements: Identify entities not fitting standard CRM objects
- Integration dependency map: What reads/writes CRM data today?

### Phase 2: Build & Validation (Weeks 3-4)
- HubSpot portal setup: Business units, teams, pipelines, permissions
- Custom object creation: Via API (idempotent scripts)
- Property creation: 200+ custom properties with validation rules
- Workflow reconstruction: 50+ workflows rebuilt in HubSpot
- Integration repointing: Update API endpoints to HubSpot Private Apps
- Sandbox testing: Full migration run against HubSpot sandbox

### Phase 3: Test Migration (Week 5)
- Full migration run against sandbox
- Data validation: Row counts, referential integrity, property completeness
- User acceptance testing: Sales/Marketing/CS run real scenarios
- Performance testing: API bulk operations, report render times
- Rollback procedure validation

### Phase 4: Production Cutover (Week 6)
- Freeze window: Friday 6 PM - Sunday 10 PM (48 hours)
- Delta sync: Changes since test migration
- Final validation: Spot checks, key reports, critical workflows
- Go-live: DNS switch, SSO enforcement, team enablement
- Hypercare: 2 weeks dedicated support

---

## 🗂 Property Mapping Example

See [property-mapping.csv](./property-mapping.csv) for full 200+ field mapping.

### Key Mapping Patterns

| Source System | Source Field | HubSpot Property | Type | Transformation |
|---------------|--------------|------------------|------|----------------|
| Legacy CRM | `client_id` | `legacy_client_id` | Single line text | Direct copy |
| Legacy CRM | `company_name` | `name` (standard) | Single line text | Trim, title case |
| Spreadsheets | `annual_revenue_usd` | `annualrevenue` (standard) | Number | Parse float, USD only |
| Legacy CRM | `status` | `lifecyclestage` (standard) | Enumeration | Map: `active`→`customer`, `prospect`→`lead`, `churned`→`other` |
| Custom PHP | `subscription_tier` | `subscription_tier` (custom) | Enumeration | Map: `basic`→`Starter`, `pro`→`Professional`, `ent`→`Enterprise` |
| Legacy CRM | `last_contact_date` | `hs_last_contacted` (standard) | Date | ISO 8601, UTC |
| Spreadsheets | `tags` | `hs_tags` (custom) | Multi-select | Split by `;`, trim, deduplicate |

---

## 🔄 Deduplication Strategy

### Company Deduplication
1. **Exact domain match** → Auto-merge (primary domain)
2. **Fuzzy name match (90%+ Levenshtein)** → Manual review queue
3. **Same parent company** → Create parent-child association

### Contact Deduplication
1. **Exact email match** → Auto-merge (primary email)
2. **Same email domain + similar name** → Manual review
3. **Multiple emails per person** → Consolidate to primary, log secondary

### Deal Deduplication
1. **Same company + same amount + same close date (within 7 days)** → Flag for review
2. **Pipeline-specific rules:** Renewal deals never auto-dedupe

---

## ✅ Validation Checklist

See [migration-checklist.md](./migration-checklist.md) for full checklist.

### Critical Validations (Must Pass)

- [ ] Contact count: Source ± 1% = HubSpot
- [ ] Company count: Source ± 1% = HubSpot
- [ ] Deal count: Source ± 1% = HubSpot
- [ ] All custom object records migrated
- [ ] All associations preserved (Contact→Company, Deal→Company, Deal→Contact)
- [ ] Engagement records (emails, calls, meetings) attached to correct records
- [ ] Owner assignments correct (active HubSpot users)
- [ ] Pipeline stages match source data
- [ ] Currency values: No precision loss
- [ ] Date fields: All UTC, no timezone shifts

### Quality Validations (Target 95%+)

- [ ] Email deliverability: < 2% bounce rate on test send
- [ ] Property completeness: > 95% of required fields populated
- [ ] Duplicate rate: < 0.5% post-migration
- [ ] Workflow enrollment: Test contacts enroll correctly
- [ ] Report accuracy: Key KPIs match source within 2%

---

## ⚠️ Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during cutover | Low | Critical | Point-in-time snapshot; delta sync; validated rollback |
| Sales team resistance | High | High | Early involvement; parallel run; dedicated hypercare |
| Integration breakage | Medium | High | Pre-cutover integration testing; feature flags |
| Performance degradation | Low | Medium | Load testing; API rate limit monitoring; batch sizing |
| Duplicate explosion | Medium | High | Pre-migration dedupe; post-migration dedupe workflows |
| Custom object API limits | Medium | Medium | Batch API (100/object); parallel workers; exponential backoff |

---

## 📊 Outcomes (From Real Project)

- **Migration duration:** 48-hour cutover window (planned 48h, actual 36h)
- **Data fidelity:** 99.8% record completeness; 0.3% duplicate rate
- **User adoption:** 92% sales team active in HubSpot within 1 week
- **Report accuracy:** All KPI dashboards matched legacy within 1.5%
- **Zero downtime:** No sales hours lost; marketing campaigns uninterrupted
- **Rollback tested:** Full rollback executed in 45 minutes during test phase