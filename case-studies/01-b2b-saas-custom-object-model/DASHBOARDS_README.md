# Dashboard Screenshots Placeholder

This file documents the dashboards that should be captured from your HubSpot sandbox.

## Required Screenshots

1. **MRR Waterfall Dashboard**
   - Reports: New MRR, Expansion MRR, Contraction MRR, Churn MRR, Reactivation MRR
   - Time range: Last 12 months
   - Visualization: Waterfall chart

2. **Activation Funnel Dashboard**
   - Stages: Trial Started → Config Complete → First Value Achieved → Launched → Paid Conversion
   - Visualization: Funnel chart with conversion rates
   - Filters: By plan tier, by cohort month

3. **Churn Cohort Analysis Dashboard**
   - Cohorts: Monthly (by subscription.start_date)
   - Metrics: Retention at 30/60/90/180/365 days
   - Breakdown: By plan_tier, by acquisition channel
   - Visualization: Cohort table + retention curve

4. **CSM Portfolio Dashboard**
   - Per CSM: Assigned accounts count, Total MRR, Avg Health Score, Upcoming Renewals (30/60/90 days), Open Tasks
   - Visualization: Table with conditional formatting (red/yellow/green for health score)
   - Drill-down: Click company → Company record

5. **Custom Object Overview Dashboard**
   - Subscription counts by status, by plan_tier
   - Feature Usage trends (last 30 days)
   - Onboarding Ticket pipeline (by stage)
   - Contract renewal calendar

## How to Capture

1. Build each report in HubSpot Custom Report Builder
2. Add to a Dashboard named "Architect Portfolio - B2B SaaS"
3. Take full-page screenshots (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)
4. Save as `dashboards.png` in this folder
5. Or save individual PNGs and reference them in README.md

## Alternative: Use HubSpot Sandbox Data

If you have the sandbox populated with test data (700+ records), you can create these reports there and screenshot them.