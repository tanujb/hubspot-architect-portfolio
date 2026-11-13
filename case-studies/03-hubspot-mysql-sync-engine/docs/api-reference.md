# API Reference

## HubSpot API Endpoints Used

### Authentication
- **Type:** Private App Access Token (Bearer)
- **Header:** `Authorization: Bearer {PRIVATE_APP_TOKEN}`
- **Scopes Required:**
  - `crm.objects.contacts.read`
  - `crm.objects.contacts.write`
  - `crm.objects.deals.read`
  - `crm.objects.deals.write`
  - `crm.objects.companies.read`
  - `crm.objects.companies.write`
  - `crm.objects.custom.read`
  - `crm.objects.custom.write`
  - `webhooks`

### Contacts

#### Search Contacts (Cursor Pagination)
```
POST /crm/v3/objects/contacts/search
```
**Request Body:**
```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "hs_lastmodifieddate",
          "operator": "GT",
          "value": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ],
  "properties": ["email", "firstname", "lastname", "company", "lifecyclestage", "hs_lastmodifieddate"],
  "limit": 100,
  "after": "cursor_token_from_previous_page"
}
```

#### Get Contact by ID
```
GET /crm/v3/objects/contacts/{contactId}
```
**Query Params:** `properties=email,firstname,lastname,company,lifecyclestage,hs_lastmodifieddate`

#### Batch Read Contacts
```
POST /crm/v3/objects/contacts/batch/read
```
**Request Body:**
```json
{
  "properties": ["email", "firstname", "lastname", "company", "lifecyclestage"],
  "inputs": [
    { "id": "12345" },
    { "id": "12346" }
  ]
}
```

#### Create/Update Contact (Upsert via Email)
```
POST /crm/v3/objects/contacts/batch/upsert
```
**Request Body:**
```json
{
  "idProperty": "email",
  "inputs": [
    {
      "id": "user@example.com",
      "properties": {
        "email": "user@example.com",
        "firstname": "John",
        "lastname": "Doe",
        "lifecyclestage": "lead"
      }
    }
  ]
}
```

### Deals

#### Search Deals
```
POST /crm/v3/objects/deals/search
```
**Request Body:** Same pattern as contacts, with deal properties.

#### Get Deal by ID
```
GET /crm/v3/objects/deals/{dealId}
```
**Query Params:** `properties=dealname,amount,dealstage,pipeline,closedate,hs_lastmodifieddate`

#### Batch Read Deals
```
POST /crm/v3/objects/deals/batch/read
```

#### Create/Update Deal
```
POST /crm/v3/objects/deals/batch/upsert
```
**Request Body:**
```json
{
  "idProperty": "hs_object_id",
  "inputs": [
    {
      "id": "98765",
      "properties": {
        "dealname": "Enterprise Renewal",
        "amount": "50000",
        "dealstage": "negotiation",
        "pipeline": "renewal_pipeline"
      }
    }
  ]
}
```

### Companies

#### Search Companies
```
POST /crm/v3/objects/companies/search
```

#### Get Company by ID
```
GET /crm/v3/objects/companies/{companyId}
```

### Custom Objects

#### Define Custom Object Schema (One-time)
```
POST /crm/v3/schemas
```
**Request Body (Subscription Example):**
```json
{
  "name": "subscription",
  "labels": {
    "singular": "Subscription",
    "plural": "Subscriptions"
  },
  "requiredProperties": ["plan_tier", "status", "mrr"],
  "searchableProperties": ["plan_tier", "status", "renewal_date"],
  "primaryDisplayProperty": "plan_tier",
  "secondaryDisplayProperties": ["mrr", "status"],
  "properties": [
    {
      "name": "plan_tier",
      "label": "Plan Tier",
      "type": "enumeration",
      "fieldType": "select",
      "options": [
        { "label": "Starter", "value": "Starter", "displayOrder": 0 },
        { "label": "Professional", "value": "Professional", "displayOrder": 1 },
        { "label": "Enterprise", "value": "Enterprise", "displayOrder": 2 }
      ]
    },
    {
      "name": "billing_cycle",
      "label": "Billing Cycle",
      "type": "enumeration",
      "fieldType": "select",
      "options": [
        { "label": "Monthly", "value": "Monthly" },
        { "label": "Annual", "value": "Annual" }
      ]
    },
    {
      "name": "mrr",
      "label": "Monthly Recurring Revenue",
      "type": "number",
      "fieldType": "number"
    },
    {
      "name": "status",
      "label": "Status",
      "type": "enumeration",
      "fieldType": "select",
      "options": [
        { "label": "Active", "value": "Active" },
        { "label": "Trial", "value": "Trial" },
        { "label": "Past Due", "value": "Past Due" },
        { "label": "Cancelled", "value": "Cancelled" }
      ]
    },
    {
      "name": "start_date",
      "label": "Start Date",
      "type": "date",
      "fieldType": "date"
    },
    {
      "name": "renewal_date",
      "label": "Renewal Date",
      "type": "date",
      "fieldType": "date"
    }
  ],
  "associations": [
    { "fromObjectType": "subscription", "toObjectType": "company", "name": "subscription_to_company" }
  ]
}
```

#### Search Custom Objects
```
POST /crm/v3/objects/{objectType}/search
```
**Example:** `POST /crm/v3/objects/subscription/search`

#### Get Custom Object by ID
```
GET /crm/v3/objects/{objectType}/{objectId}
```

#### Batch Read Custom Objects
```
POST /crm/v3/objects/{objectType}/batch/read
```

### Associations

#### Create Association
```
PUT /crm/v4/objects/{fromObjectType}/{fromObjectId}/associations/{toObjectType}/{toObjectId}
```
**Query Params:** `associationType=subscription_to_company`

#### Batch Create Associations
```
POST /crm/v4/associations/{fromObjectType}/{toObjectType}/batch/create
```
**Request Body:**
```json
{
  "inputs": [
    { "from": { "id": "sub_123" }, "to": { "id": "company_456" }, "type": "subscription_to_company" }
  ]
}
```

### Webhooks

#### Create Webhook Subscription
```
POST /webhooks/v3/subscriptions
```
**Request Body:**
```json
{
  "subscriptionType": "contact.creation",
  "propertyName": "",
  "eventTypes": ["CREATED", "UPDATED", "DELETED"],
  "url": "https://your-domain.com/webhooks/hubspot",
  "throttling": {
    "maxConcurrentRequests": 10,
    "maxRequestsPerSecond": 50
  }
}
```

#### List Subscriptions
```
GET /webhooks/v3/subscriptions
```

#### Delete Subscription
```
DELETE /webhooks/v3/subscriptions/{subscriptionId}
```

#### Webhook Payload Structure
```json
[
  {
    "subscriptionType": "contact.propertyChange",
    "objectType": "CONTACT",
    "objectId": "12345",
    "changeSource": "CRM",
    "eventId": "evt_abc123",
    "timestamp": 1705312800000,
    "propertyName": "lifecyclestage",
    "propertyValue": "customer"
  }
]
```

### Rate Limits

| Limit Type | Value | Window | Headers |
|------------|-------|--------|---------|
| Burst | 100 requests | 10 seconds | `X-HubSpot-RateLimit-Remaining`, `X-HubSpot-RateLimit-Reset` |
| Sustained | 400 requests | 1 minute | Same headers |
| Daily | 1,000,000 requests | 24 hours | `X-HubSpot-DailyLimit-Remaining` |

**Best Practices:**
- Check `X-HubSpot-RateLimit-Remaining` before each request
- Implement token bucket client-side (5 concurrent workers for 100/10s)
- On 429: Read `Retry-After` header, wait, retry with exponential backoff
- Batch API: Use `/batch/read` and `/batch/upsert` (100 objects per call)

### Error Responses

#### 400 Bad Request
```json
{
  "status": "error",
  "message": "Invalid input JSON",
  "correlationId": "req_xyz"
}
```

#### 401 Unauthorized
```json
{
  "status": "error",
  "message": "This hub doesn't have access to the requested feature",
  "correlationId": "req_xyz"
}
```

#### 404 Not Found
```json
{
  "status": "error",
  "message": "Contact not found",
  "correlationId": "req_xyz"
}
```

#### 429 Too Many Requests
```json
{
  "status": "error",
  "message": "Rate limit exceeded",
  "correlationId": "req_xyz"
}
```
**Headers:** `Retry-After: 5` (seconds)

#### 5xx Server Error
```json
{
  "status": "error",
  "message": "Internal server error",
  "correlationId": "req_xyz"
}
```

## MySQL Schema

### hubspot_contacts
```sql
CREATE TABLE hubspot_contacts (
  hs_id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  firstname VARCHAR(100),
  lastname VARCHAR(100),
  company VARCHAR(255),
  lifecyclestage VARCHAR(50),
  hs_lastmodified DATETIME(6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_hs_lastmodified (hs_lastmodified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### hubspot_deals
```sql
CREATE TABLE hubspot_deals (
  hs_id VARCHAR(50) PRIMARY KEY,
  dealname VARCHAR(255),
  amount DECIMAL(15,2),
  dealstage VARCHAR(100),
  pipeline VARCHAR(100),
  closedate DATE,
  hs_lastmodified DATETIME(6),
  company_hs_id VARCHAR(50),
  contact_hs_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company (company_hs_id),
  INDEX idx_contact (contact_hs_id),
  INDEX idx_hs_lastmodified (hs_lastmodified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### hubspot_companies
```sql
CREATE TABLE hubspot_companies (
  hs_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  domain VARCHAR(255) UNIQUE,
  industry VARCHAR(100),
  annualrevenue DECIMAL(15,2),
  lifecyclestage VARCHAR(50),
  hs_lastmodified DATETIME(6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_domain (domain),
  INDEX idx_hs_lastmodified (hs_lastmodified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### hubspot_subscriptions (Custom Object)
```sql
CREATE TABLE hubspot_subscriptions (
  hs_id VARCHAR(50) PRIMARY KEY,
  company_hs_id VARCHAR(50) NOT NULL,
  plan_tier ENUM('Starter','Professional','Enterprise'),
  billing_cycle ENUM('Monthly','Annual'),
  mrr DECIMAL(10,2),
  status ENUM('Active','Trial','Past Due','Cancelled'),
  start_date DATE,
  renewal_date DATE,
  hs_lastmodified DATETIME(6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_hs_id) REFERENCES hubspot_companies(hs_id),
  INDEX idx_company (company_hs_id),
  INDEX idx_status (status),
  INDEX idx_renewal (renewal_date),
  INDEX idx_hs_lastmodified (hs_lastmodified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### hubspot_feature_usage (Custom Object)
```sql
CREATE TABLE hubspot_feature_usage (
  hs_id VARCHAR(50) PRIMARY KEY,
  company_hs_id VARCHAR(50) NOT NULL,
  usage_date DATE NOT NULL,
  feature_name ENUM('API Gateway','Data Transformer','Scheduler','Analytics','Connector'),
  usage_count INT,
  unique_users INT,
  hs_lastmodified DATETIME(6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_hs_id) REFERENCES hubspot_companies(hs_id),
  UNIQUE KEY uniq_company_date_feature (company_hs_id, usage_date, feature_name),
  INDEX idx_company (company_hs_id),
  INDEX idx_date (usage_date),
  INDEX idx_hs_lastmodified (hs_lastmodified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### hubspot_onboarding (Custom Object)
```sql
CREATE TABLE hubspot_onboarding (
  hs_id VARCHAR(50) PRIMARY KEY,
  company_hs_id VARCHAR(50) NOT NULL,
  contact_hs_id VARCHAR(50),
  stage ENUM('Kickoff','Configuration','Training','Launched'),
  owner_hs_id VARCHAR(50),
  target_launch_date DATE,
  health_score TINYINT UNSIGNED,
  hs_lastmodified DATETIME(6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_hs_id) REFERENCES hubspot_companies(hs_id),
  FOREIGN KEY (contact_hs_id) REFERENCES hubspot_contacts(hs_id),
  INDEX idx_company (company_hs_id),
  INDEX idx_stage (stage),
  INDEX idx_hs_lastmodified (hs_lastmodified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### sync_metadata
```sql
CREATE TABLE sync_metadata (
  object_type VARCHAR(50) PRIMARY KEY,
  last_sync DATETIME(6) NOT NULL,
  records_synced BIGINT DEFAULT 0,
  errors BIGINT DEFAULT 0,
  status ENUM('idle','running','error') DEFAULT 'idle',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO sync_metadata (object_type, last_sync, records_synced, errors, status)
VALUES ('contacts', '1970-01-01 00:00:00', 0, 0, 'idle'),
       ('deals', '1970-01-01 00:00:00', 0, 0, 'idle'),
       ('companies', '1970-01-01 00:00:00', 0, 0, 'idle'),
       ('subscriptions', '1970-01-01 00:00:00', 0, 0, 'idle');
```

## Sync Engine Internal API

### HubSpotMySQLSync Class

#### Constructor
```javascript
const sync = new HubSpotMySQLSync(config);
```
**Config:**
```javascript
{
  hsPrivateAppToken: string,
  mysql: mysql2.PoolConfig,
}
```

#### syncContactsToMySQL(lastSyncTimestamp)
Syncs contacts modified after timestamp.
```javascript
await sync.syncContactsToMySQL('2024-01-15T10:30:00Z');
```

#### syncDealsToMySQL(lastSyncTimestamp)
Syncs deals modified after timestamp.

#### syncCompaniesToMySQL(lastSyncTimestamp)
Syncs companies modified after timestamp.

#### syncCustomObjectsToMySQL(lastSyncTimestamp)
Syncs all custom objects (subscriptions, feature_usage, onboarding, contracts).

#### handleDealWebhook(payload)
Processes incoming deal webhook event.
```javascript
await sync.handleDealWebhook({
  subscriptionType: 'deal.propertyChange',
  objectType: 'DEAL',
  objectId: '98765',
  eventId: 'evt_abc123'
});
```

#### withRetry(fn, retries)
Generic retry wrapper with exponential backoff for 429 errors.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HUBSPOT_PRIVATE_APP_TOKEN` | Yes | - | Private App access token |
| `HUBSPOT_WEBHOOK_SECRET` | Yes | - | Webhook signature secret |
| `MYSQL_HOST` | No | localhost | MySQL host |
| `MYSQL_PORT` | No | 3306 | MySQL port |
| `MYSQL_USER` | No | sync_user | MySQL user |
| `MYSQL_PASSWORD` | Yes | - | MySQL password |
| `MYSQL_DATABASE` | No | hubspot_sync | MySQL database |
| `SYNC_BATCH_SIZE` | No | 100 | Records per API batch |
| `SYNC_CONCURRENCY` | No | 5 | Parallel workers |
| `SCHEDULED_INTERVAL_MINUTES` | No | 5 | Polling interval |
| `WEBHOOK_PORT` | No | 3000 | Express server port |
| `METRICS_PORT` | No | 9090 | Prometheus metrics port |
| `LOG_LEVEL` | No | info | Log level (debug/info/warn/error) |
| `ENABLE_WEBHOOKS` | No | true | Enable webhook server |
| `ENABLE_SCHEDULED_SYNC` | No | true | Enable cron jobs |
| `ENABLE_INITIAL_SYNC` | No | true | Run full sync on startup |