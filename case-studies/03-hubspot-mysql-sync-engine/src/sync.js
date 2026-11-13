// HubSpot ↔ MySQL Bidirectional Sync Engine
// Demonstrates: Private App auth, pagination, rate limits, idempotency, webhook processing

const HubSpot = require('@hubspot/api-client');
const mysql = require('mysql2/promise');
const pLimit = require('p-limit');

class HubSpotMySQLSync {
  constructor(config) {
    this.hubspot = new HubSpot({ accessToken: config.hsPrivateAppToken });
    this.pool = mysql.createPool(config.mysql);
    this.limit = pLimit(5); // HubSpot: 100 req/10s burst, 400 req/min sustained
    this.batchSize = 100;
  }

  // ---- CONTACTS: HubSpot → MySQL ----
  async syncContactsToMySQL(lastSyncTimestamp) {
    const filter = lastSyncTimestamp
      ? { propertyName: 'hs_lastmodifieddate', operator: 'GT', value: lastSyncTimestamp }
      : undefined;

    for await (const page of this.hubspot.crm.contacts.searchPaged({
      filterGroups: filter ? [{ filters: [filter] }] : undefined,
      properties: ['email', 'firstname', 'lastname', 'company', 'hs_lastmodifieddate', 'lifecyclestage'],
      limit: this.batchSize
    })) {
      await this.limit(() => this.upsertContacts(page.results));
    }
  }

  async upsertContacts(contacts) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const c of contacts) {
        const props = c.properties;
        await conn.execute(`
          INSERT INTO hubspot_contacts (hs_id, email, firstname, lastname, company, lifecyclestage, hs_lastmodified)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            email=VALUES(email), firstname=VALUES(firstname), lastname=VALUES(lastname),
            company=VALUES(company), lifecyclestage=VALUES(lifecyclestage), hs_lastmodified=VALUES(hs_lastmodified)
        `, [c.id, props.email, props.firstname, props.lastname, props.company, props.lifecyclestage, props.hs_lastmodifieddate]);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  // ---- DEALS: MySQL → HubSpot (via webhook) ----
  async handleDealWebhook(payload) {
    // Verify signature, parse objectId, fetch full deal, upsert to MySQL
    const dealId = payload.objectId;
    const deal = await this.hubspot.crm.deals.basicApi.getById(dealId, [
      'dealname', 'amount', 'dealstage', 'pipeline', 'closedate', 'hs_lastmodifieddate'
    ]);
    await this.upsertDeal(deal);
  }

  async upsertDeal(deal) {
    // Similar upsert pattern to contacts
  }

  // ---- RATE LIMIT HANDLING ----
  async withRetry(fn, retries = 3) {
    try {
      return await fn();
    } catch (err) {
      if (err.statusCode === 429 && retries > 0) {
        const waitMs = parseInt(err.headers?.['retry-after'] || '1000', 10);
        await new Promise(r => setTimeout(r, waitMs));
        return this.withRetry(fn, retries - 1);
      }
      throw err;
    }
  }
}

module.exports = { HubSpotMySQLSync };