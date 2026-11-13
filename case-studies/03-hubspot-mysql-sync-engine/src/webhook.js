// HubSpot Webhook Handler
// Express server to receive HubSpot webhook events

const express = require('express');
const crypto = require('crypto');
const config = require('./config');
const { HubSpotMySQLSync } = require('./sync');

const app = express();
const syncEngine = new HubSpotMySQLSync(config);

// Raw body parser for signature verification
app.use('/webhooks/hubspot', express.raw({ type: 'application/json' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// HubSpot webhook endpoint
app.post(config.webhook.path, async (req, res) => {
  try {
    // Verify signature
    const signature = req.headers['x-hubspot-signature-v3'];
    if (!verifySignature(req.body, signature, config.webhook.secret)) {
      console.warn('Invalid webhook signature');
      return res.status(401).send('Invalid signature');
    }

    const events = JSON.parse(req.body);
    console.log(`Received ${events.length} webhook event(s)`);

    // Process each event
    for (const event of events) {
      await processEvent(event);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).send('Internal error');
  }
});

function verifySignature(payload, signature, secret) {
  if (!signature || !secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function processEvent(event) {
  const { subscriptionType, objectType, objectId, changeSource, eventId } = event;

  // Deduplication: track processed eventIds (in production, use Redis)
  if (processedEvents.has(eventId)) {
    console.log(`Duplicate event ignored: ${eventId}`);
    return;
  }
  processedEvents.add(eventId);

  // Keep last 10k event IDs in memory (use Redis in production)
  if (processedEvents.size > 10000) {
    const firstKey = processedEvents.keys().next().value;
    processedEvents.delete(firstKey);
  }

  console.log(`Processing: ${subscriptionType} | ${objectType} | ${objectId} | ${changeSource}`);

  try {
    switch (objectType) {
      case 'CONTACT':
        if (subscriptionType === 'contact.creation' || subscriptionType === 'contact.propertyChange') {
          await syncEngine.withRetry(() => syncEngine.syncContactById(objectId));
        } else if (subscriptionType === 'contact.deletion') {
          await syncEngine.withRetry(() => syncEngine.deleteContact(objectId));
        }
        break;

      case 'DEAL':
        if (subscriptionType === 'deal.creation' || subscriptionType === 'deal.propertyChange') {
          await syncEngine.withRetry(() => syncEngine.handleDealWebhook(event));
        } else if (subscriptionType === 'deal.deletion') {
          await syncEngine.withRetry(() => syncEngine.deleteDeal(objectId));
        }
        break;

      case 'COMPANY':
        // Handle company sync if needed
        break;

      default:
        console.log(`Unhandled object type: ${objectType}`);
    }
  } catch (err) {
    console.error(`Failed to process event ${eventId}:`, err);
    // In production: send to dead letter queue for retry
  }
}

const processedEvents = new Set();

module.exports = { app };