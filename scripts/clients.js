const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const axios = require('axios');

// ----------------------------------------------------------------------------
// Environment configuration
//
// Magento settings. You can define either MAGENTO_REST_BASE_URL (preferred) or
// MAGENTO_BASE_URL with MAGENTO_SCOPE to construct the base REST endpoint. See
// examples at the bottom of this file. The Magento token must be provided via
// MAGENTO_TOKEN or MAGENTO_ADMIN_TOKEN.
const MAGENTO_REST_BASE_URL = (process.env.MAGENTO_REST_BASE_URL || '').trim().replace(/\/+$/, '');
const MAGENTO_BASE_URL_RAW  = (process.env.MAGENTO_BASE_URL || '').trim().replace(/\/+$/, '');
const MAGENTO_SCOPE         = (process.env.MAGENTO_SCOPE || 'V1').trim().toLowerCase();

const MAGENTO_TOKEN = (process.env.MAGENTO_TOKEN || process.env.MAGENTO_ADMIN_TOKEN || '').trim();

// Medusa settings.  MEDUSA_ADMIN_URL and MEDUSA_BASE_URL are aliases; either
// works for specifying the host.  A secret API key must be provided via
// MEDUSA_SECRET_API_KEY to authenticate admin requests.  Do not use a
// customer JWT here; admin APIs only accept secret keys or admin JWTs【196552838822327†L203-L209】.
const MEDUSA_ADMIN_URL   = (process.env.MEDUSA_ADMIN_URL || process.env.MEDUSA_BASE_URL || 'http://localhost:9000').trim().replace(/\/+$/, '');
const MEDUSA_SECRET_API_KEY = (process.env.MEDUSA_SECRET_API_KEY || '').trim();

// ----------------------------------------------------------------------------
// Build Magento base URL. Prefer the fully qualified REST URL if provided.
let magentoBase;
if (MAGENTO_REST_BASE_URL) {
  magentoBase = MAGENTO_REST_BASE_URL;
} else if (MAGENTO_BASE_URL_RAW) {
  const scopePrefix =
    MAGENTO_SCOPE === 'all'     ? '/rest/all/V1' :
    MAGENTO_SCOPE === 'default' ? '/rest/default/V1' : '/rest/V1';
  magentoBase = `${MAGENTO_BASE_URL_RAW}${scopePrefix}`;
} else {
  magentoBase = '';
}

// Validate required settings early and exit with instructions if missing.
const missing = [];
if (!magentoBase) missing.push('MAGENTO_REST_BASE_URL or MAGENTO_BASE_URL');
if (!MAGENTO_TOKEN) missing.push('MAGENTO_TOKEN (or MAGENTO_ADMIN_TOKEN)');
if (!MEDUSA_ADMIN_URL) missing.push('MEDUSA_ADMIN_URL (or MEDUSA_BASE_URL)');
if (!MEDUSA_SECRET_API_KEY) missing.push('MEDUSA_SECRET_API_KEY (Secret admin API key)');
if (missing.length) {
  console.error('❌ Missing required .env vars:', missing.join(', '));
  console.error(`\nExamples:\n\n# Option A (most common)\nMAGENTO_REST_BASE_URL=http://local.b2c.com/rest/V1\nMAGENTO_ADMIN_TOKEN=<<magento integration token>>\n\nMEDUSA_BASE_URL=http://localhost:9000\nMEDUSA_SECRET_API_KEY=<<medusa secret admin api key>>\nDEFAULT_CURRENCY=inr\n\n# Option B\nMAGENTO_BASE_URL=http://local.b2c.com\nMAGENTO_SCOPE=all\nMAGENTO_TOKEN=<<magento integration token>>\n\nMEDUSA_ADMIN_URL=http://localhost:9000\nMEDUSA_SECRET_API_KEY=<<medusa secret admin api key>>\nDEFAULT_CURRENCY=inr\n`);
  process.exit(1);
}

// Derived: media base for catalog images
const MAGENTO_MEDIA_BASE =
  (MAGENTO_REST_BASE_URL
    ? MAGENTO_REST_BASE_URL.replace(/\/rest\/(all|default)?\/?V1$/i, '')
    : MAGENTO_BASE_URL_RAW) + '/pub/media';

// ----------------------------------------------------------------------------
// Axios clients

// Magento client
const mg = axios.create({
  baseURL: magentoBase,
  headers: {
    Authorization: `Bearer ${MAGENTO_TOKEN}`,
    'User-Agent': 'medusa-migrate/1.0 (+local)',
  },
  timeout: 90000,
});

// Medusa admin client.  We pass the secret API key in a Basic Authorization
// header as required by the Medusa admin API【196552838822327†L203-L209】.
const md = axios.create({
  baseURL: `${MEDUSA_ADMIN_URL}/admin`,
  headers: {
    Authorization: `Basic ${MEDUSA_SECRET_API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'medusa-migrate/1.0 (+local)',
  },
  timeout: 90000,
});

// Optional tiny retry for ECONNRESET or ETIMEDOUT during local development
for (const client of [mg, md]) {
  client.interceptors.response.use(
    (r) => r,
    async (err) => {
      const cfg = err.config || {};
      if (!cfg.__retry && (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT')) {
        cfg.__retry = true;
        return client(cfg);
      }
      throw err;
    }
  );
}

// ----------------------------------------------------------------------------
// Helper functions

// Normalize relative paths into a canonical form.  Accepts both '/path' and
// 'path' and always returns '/path'.
function normalizePath(p) {
  return String(p || '').replace(/^\/*/, '/');
}

async function mgGet(p, opts = {}) {
  const url = normalizePath(p);
  if (process.env.DEBUG) console.log('GET', mg.defaults.baseURL + url);
  return mg.get(url, opts);
}

async function mdGet(p, opts = {}) {
  const url = normalizePath(p);
  if (process.env.DEBUG) console.log('GET', md.defaults.baseURL + url);
  return md.get(url, opts);
}

// Paginator for Magento search endpoints.  Yields pages of items until the
// total_count is reached.  Adds a no‑op filter to satisfy strict Magento
// installs.
async function* paginateMagento(p, pageSize = Number(process.env.PAGE_SIZE || 150), extraParams = {}) {
  let page = 1,
    got = 0,
    total = Infinity;
  const path = normalizePath(p);
  while (got < total) {
    const { data } = await mgGet(path, {
      params: {
        'searchCriteria[currentPage]': page,
        'searchCriteria[pageSize]': pageSize,
        // no‑op filter to satisfy strict installs
        'searchCriteria[filter_groups][0][filters][0][field]': 'entity_id',
        'searchCriteria[filter_groups][0][filters][0][condition_type]': 'gt',
        'searchCriteria[filter_groups][0][filters][0][value]': '0',
        ...extraParams,
      },
    });
    if (page === 1 && typeof data.total_count !== 'undefined') {
      console.log(`🔎 ${path} total_count=${data.total_count}`);
      total = data.total_count || 0;
    }
    const items = data.items || [];
    if (!items.length) break;
    yield items;
    got += items.length;
    page++;
  }
}

// ----------------------------------------------------------------------------
// Self‑tests (optional).  These functions can be invoked at the start of a
// migration script to verify that Magento and Medusa credentials are valid.
async function assertMagento() {
  try {
    await mgGet('/store/websites');
    if (process.env.DEBUG) console.log('Magento auth OK');
  } catch (e) {
    const data = e.response?.data || e.message;
    throw new Error(`Magento auth failed: ${JSON.stringify(data)}`);
  }
}

async function assertMedusa() {
  try {
    // Use a simple admin endpoint to verify authentication.  /products is
    // public in the admin API and does not require additional params.
    await mdGet('/products');
    if (process.env.DEBUG) console.log('Medusa admin auth OK');
  } catch (e) {
    const data = e.response?.data || e.message;
    throw new Error(`Medusa admin auth failed: ${JSON.stringify(data)}`);
  }
}

module.exports = {
  mg,
  md,
  mgGet,
  mdGet,
  paginateMagento,
  MAGENTO_SCOPE,
  MAGENTO_MEDIA_BASE,
  assertMagento,
  assertMedusa,
};