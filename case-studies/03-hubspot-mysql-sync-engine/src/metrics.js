// Prometheus Metrics for HubSpot ↔ MySQL Sync Engine

const promClient = require('prom-client');

// Create a Registry to register metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics for sync engine
const syncedTotal = new promClient.Counter({
  name: 'hubspot_sync_synced_total',
  help: 'Total number of records successfully synced',
  labelNames: ['object_type', 'direction'], // direction: 'hs_to_mysql' | 'mysql_to_hs'
  registers: [register],
});

const syncErrorsTotal = new promClient.Counter({
  name: 'hubspot_sync_errors_total',
  help: 'Total number of sync errors',
  labelNames: ['object_type', 'direction', 'error_type'],
  registers: [register],
});

const syncDurationSeconds = new promClient.Histogram({
  name: 'hubspot_sync_duration_seconds',
  help: 'Duration of sync operations in seconds',
  labelNames: ['object_type', 'direction'],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600],
  registers: [register],
});

const syncLagSeconds = new promClient.Gauge({
  name: 'hubspot_sync_lag_seconds',
  help: 'Time since last successful sync per object type',
  labelNames: ['object_type'],
  registers: [register],
});

const apiRateLimitRemaining = new promClient.Gauge({
  name: 'hubspot_api_rate_limit_remaining',
  help: 'HubSpot API rate limit remaining',
  labelNames: ['limit_type'], // 'burst' | 'daily'
  registers: [register],
});

const webhookEventsReceived = new promClient.Counter({
  name: 'hubspot_webhook_events_received_total',
  help: 'Total webhook events received from HubSpot',
  labelNames: ['object_type', 'subscription_type'],
  registers: [register],
});

const webhookEventsProcessed = new promClient.Counter({
  name: 'hubspot_webhook_events_processed_total',
  help: 'Total webhook events successfully processed',
  labelNames: ['object_type', 'subscription_type'],
  registers: [register],
});

const webhookEventsFailed = new promClient.Counter({
  name: 'hubspot_webhook_events_failed_total',
  help: 'Total webhook events that failed processing',
  labelNames: ['object_type', 'subscription_type'],
  registers: [register],
});

const activeSyncJobs = new promClient.Gauge({
  name: 'hubspot_sync_active_jobs',
  help: 'Number of currently running sync jobs',
  labelNames: ['object_type'],
  registers: [register],
});

// Helper functions for instrumenting sync operations
async function recordSyncStart(objectType, direction) {
  activeSyncJobs.inc({ object_type: objectType });
  const endTimer = syncDurationSeconds.startTimer({ object_type: objectType, direction });
  return endTimer;
}

async function recordSyncSuccess(objectType, direction, count, endTimer) {
  activeSyncJobs.dec({ object_type: objectType });
  endTimer();
  syncedTotal.inc({ object_type: objectType, direction }, count);
  syncLagSeconds.set({ object_type: objectType }, 0);
}

async function recordSyncError(objectType, direction, errorType, endTimer) {
  activeSyncJobs.dec({ object_type: objectType });
  endTimer();
  syncErrorsTotal.inc({ object_type: objectType, direction, error_type: errorType });
}

function recordWebhookReceived(objectType, subscriptionType) {
  webhookEventsReceived.inc({ object_type: objectType, subscription_type: subscriptionType });
}

function recordWebhookProcessed(objectType, subscriptionType) {
  webhookEventsProcessed.inc({ object_type: objectType, subscription_type: subscriptionType });
}

function recordWebhookFailed(objectType, subscriptionType) {
  webhookEventsFailed.inc({ object_type: objectType, subscription_type: subscriptionType });
}

function updateRateLimitRemaining(burstRemaining, dailyRemaining) {
  apiRateLimitRemaining.set({ limit_type: 'burst' }, burstRemaining);
  apiRateLimitRemaining.set({ limit_type: 'daily' }, dailyRemaining);
}

function updateSyncLag(objectType, secondsSinceLastSync) {
  syncLagSeconds.set({ object_type: objectType }, secondsSinceLastSync);
}

// Metrics endpoint handler
async function metricsHandler(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).send(err.message);
  }
}

module.exports = {
  register,
  metricsHandler,
  recordSyncStart,
  recordSyncSuccess,
  recordSyncError,
  recordWebhookReceived,
  recordWebhookProcessed,
  recordWebhookFailed,
  updateRateLimitRemaining,
  updateSyncLag,
};