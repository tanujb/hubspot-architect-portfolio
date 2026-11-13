// HubSpot ↔ MySQL Sync Engine - Entry Point
// Starts webhook server, scheduler, and metrics endpoint

require('dotenv').config();
const config = require('./config');
const { app } = require('./webhook');
const { startScheduler } = require('./scheduler');
const { metricsHandler } = require('./metrics');

const WEBHOOK_PORT = config.webhook.port;
const METRICS_PORT = config.monitoring.metricsPort;

// Metrics endpoint
app.get('/metrics', metricsHandler);

// Start webhook server
app.listen(WEBHOOK_PORT, () => {
  console.log(`Webhook server listening on port ${WEBHOOK_PORT}`);
  console.log(`Webhook endpoint: http://localhost:${WEBHOOK_PORT}${config.webhook.path}`);
  console.log(`Metrics endpoint: http://localhost:${METRICS_PORT}/metrics`);
});

// Start scheduler
startScheduler();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

console.log('HubSpot ↔ MySQL Sync Engine started');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Features:', config.features);