// Scheduled Sync Jobs
// Cron-based polling for HubSpot → MySQL sync (fallback for webhooks)

const cron = require('node-cron');
const config = require('./config');
const { HubSpotMySQLSync } = require('./sync');

const syncEngine = new HubSpotMySQLSync(config);

// Track last successful sync timestamps per object type
const lastSyncTimestamps = {
  contacts: null,
  deals: null,
  companies: null,
  subscriptions: null,
};

// Initialize from persistent storage (Redis/DB) in production
async function loadLastSyncTimestamps() {
  // Example: Load from MySQL metadata table
  // const [rows] = await syncEngine.pool.execute(
  //   'SELECT object_type, last_sync FROM sync_metadata'
  // );
  // rows.forEach(r => { lastSyncTimestamps[r.object_type] = r.last_sync; });
  console.log('Loaded last sync timestamps:', lastSyncTimestamps);
}

async function saveLastSyncTimestamp(objectType, timestamp) {
  lastSyncTimestamps[objectType] = timestamp;
  // Persist to MySQL
  // await syncEngine.pool.execute(
  //   'INSERT INTO sync_metadata (object_type, last_sync) VALUES (?, ?) ON DUPLICATE KEY UPDATE last_sync = ?',
  //   [objectType, timestamp, timestamp]
  // );
}

// Contact sync job
async function syncContactsJob() {
  console.log('[Scheduler] Starting contacts sync...');
  const startTime = Date.now();
  try {
    await syncEngine.syncContactsToMySQL(lastSyncTimestamps.contacts);
    const newTimestamp = new Date().toISOString();
    await saveLastSyncTimestamp('contacts', newTimestamp);
    console.log(`[Scheduler] Contacts sync completed in ${Date.now() - startTime}ms`);
  } catch (err) {
    console.error('[Scheduler] Contacts sync failed:', err);
  }
}

// Deal sync job
async function syncDealsJob() {
  console.log('[Scheduler] Starting deals sync...');
  const startTime = Date.now();
  try {
    await syncEngine.syncDealsToMySQL(lastSyncTimestamps.deals);
    const newTimestamp = new Date().toISOString();
    await saveLastSyncTimestamp('deals', newTimestamp);
    console.log(`[Scheduler] Deals sync completed in ${Date.now() - startTime}ms`);
  } catch (err) {
    console.error('[Scheduler] Deals sync failed:', err);
  }
}

// Company sync job
async function syncCompaniesJob() {
  console.log('[Scheduler] Starting companies sync...');
  const startTime = Date.now();
  try {
    await syncEngine.syncCompaniesToMySQL(lastSyncTimestamps.companies);
    const newTimestamp = new Date().toISOString();
    await saveLastSyncTimestamp('companies', newTimestamp);
    console.log(`[Scheduler] Companies sync completed in ${Date.now() - startTime}ms`);
  } catch (err) {
    console.error('[Scheduler] Companies sync failed:', err);
  }
}

// Custom object sync job (subscriptions, etc.)
async function syncCustomObjectsJob() {
  console.log('[Scheduler] Starting custom objects sync...');
  const startTime = Date.now();
  try {
    await syncEngine.syncCustomObjectsToMySQL(lastSyncTimestamps.subscriptions);
    const newTimestamp = new Date().toISOString();
    await saveLastSyncTimestamp('subscriptions', newTimestamp);
    console.log(`[Scheduler] Custom objects sync completed in ${Date.now() - startTime}ms`);
  } catch (err) {
    console.error('[Scheduler] Custom objects sync failed:', err);
  }
}

// Initialize scheduler
function startScheduler() {
  if (!config.features.enableScheduledSync) {
    console.log('Scheduled sync disabled via config');
    return;
  }

  const interval = config.sync.scheduledIntervalMinutes;

  // Run every N minutes (staggered to avoid rate limit bursts)
  cron.schedule(`*/${interval} * * * *`, syncContactsJob);
  cron.schedule(`${Math.floor(interval/2)} */${interval} * * *`, syncDealsJob);
  cron.schedule(`${Math.floor(interval/3)} */${interval} * * *`, syncCompaniesJob);
  cron.schedule(`${Math.floor(interval/4)} */${interval} * * *`, syncCustomObjectsJob);

  console.log(`Scheduled sync started: every ${interval} minutes`);

  // Initial sync on startup (if enabled)
  if (config.features.enableInitialSync) {
    setTimeout(async () => {
      console.log('[Scheduler] Running initial sync...');
      await loadLastSyncTimestamps();
      await syncContactsJob();
      await syncDealsJob();
      await syncCompaniesJob();
      await syncCustomObjectsJob();
    }, 5000);
  }
}

module.exports = { startScheduler, lastSyncTimestamps };