// Configuration for HubSpot ↔ MySQL Sync Engine
// All secrets via environment variables (never commit actual values)

module.exports = {
  // HubSpot Private App Token
  // Scopes needed: crm.objects.contacts.read, crm.objects.contacts.write,
  // crm.objects.deals.read, crm.objects.deals.write,
  // crm.objects.custom.read, crm.objects.custom.write,
  // webhooks
  hsPrivateAppToken: process.env.HUBSPOT_PRIVATE_APP_TOKEN,

  // MySQL Connection Pool
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'sync_user',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'hubspot_sync',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'UTC',
  },

  // Sync Behavior
  sync: {
    batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '100', 10),
    concurrencyLimit: parseInt(process.env.SYNC_CONCURRENCY || '5', 10),
    initialSyncLookbackDays: parseInt(process.env.INITIAL_LOOKBACK_DAYS || '365', 10),
    scheduledIntervalMinutes: parseInt(process.env.SCHEDULED_INTERVAL_MINUTES || '5', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    retryBaseDelayMs: parseInt(process.env.RETRY_BASE_DELAY_MS || '1000', 10),
  },

  // Webhook Server
  webhook: {
    port: parseInt(process.env.WEBHOOK_PORT || '3000', 10),
    path: '/webhooks/hubspot',
    // HubSpot webhook secret for signature verification
    secret: process.env.HUBSPOT_WEBHOOK_SECRET,
  },

  // Feature Flags
  features: {
    enableWebhooks: process.env.ENABLE_WEBHOOKS !== 'false',
    enableScheduledSync: process.env.ENABLE_SCHEDULED_SYNC !== 'false',
    enableInitialSync: process.env.ENABLE_INITIAL_SYNC !== 'false',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
  },

  // Monitoring
  monitoring: {
    metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};