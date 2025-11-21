# Scripts overview

Most scripts expect Magento and Medusa credentials in `.env` (see `scripts/clients.js` for the required keys). Run JavaScript files with `node scripts/<name>.js` unless noted; scripts exporting a `default` function can be run with `npx medusa exec scripts/<name>.js` from `Medusa/my-backend`.

## Shared helpers
- `scripts/clients.js` — Builds axios clients for Magento (`mg`) and Medusa Admin (`md`), validates required environment variables, and exposes pagination helpers plus quick auth checks.
- `scripts/id-map.js` — Persists the Magento→Medusa id cache in `.idmap.json` (products, variants, collections, customers, orders, locations).
- `scripts/utils.js` — Small helpers for slug creation, currency-to-cents conversion, and concurrency limiting.

## Migration and sync scripts
- `scripts/run-all.js` — Convenience runner that executes categories → products (via `medusa exec`) → customers → inventory → prices → promotions → orders in sequence.
- `scripts/categories.js` — Imports Magento categories into Medusa collections, building handles from the Magento tree and caching ids in `.idmap.json`.
- `scripts/product.js` — Product migration with Medusa v2 module support and v1/REST fallbacks; copies Magento media files into `static/catalog/product` when present and links products to sales channels.
- `scripts/customers.js` — Upserts Magento customers (and addresses/groups) via Medusa Admin API; supports flags `UPSERT_CREATE_MISSING`, `UPSERT_UPDATE_EXISTING`, `UPSERT_DELETE_ORPHANS`, `FORCE_BACKFILL_HASH`, and uses `DATABASE_URL` to mark `has_account` in Postgres.
- `scripts/inventory.js` — Syncs Magento stock (REST or MSI) into Medusa inventory items and location levels; honors `MAGENTO_MSI`, `MEDUSA_DEFAULT_LOCATION`, `MEDUSA_REQUIRED_QUANTITY`, and caches variant/location ids.
- `scripts/prices.js` — Reads Magento tier prices and writes Medusa price lists per SKU; defaults to `DEFAULT_CURRENCY_CODE`/`DEFAULT_CURRENCY`.
- `scripts/promotions.js` — Converts Magento sales rules into Medusa promotions (codes or automatic) while preserving Magento metadata.
- `scripts/orders.js` — Imports Magento orders through Medusa Admin REST by creating draft orders then converting; skips already-imported increment ids and supports `DRY_RUN`, `DEFAULT_REGION_ID`, `PAGE_SIZE`.
- `scripts/orders-rest.js` — Earlier/lighter version of the Magento→Medusa draft-order importer using only REST calls and basic duplication checks.
- `scripts/invoices.js` — Looks up Magento invoices for orders already migrated to Medusa (by `metadata.magento_increment_id`) and stores the invoice summary/PDF URL in order metadata.
- `scripts/migrate-domains.ts` — Pulls Magento domain metadata via REST and upserts into Postgres tables (using helpers in `src/lib/pg`).
- `scripts/migrate-magento-products.ts` — TypeScript migration that reads Magento catalog data directly from MySQL and creates/updates Medusa products (including attributes, media, categories).
- `scripts/sync-redington-from-magento.ts` — Bulk sync of Redington-specific Magento data (domains, access mappings, CMS pages, coupon rules, settings, etc.) from MySQL into Postgres, resetting target tables then reseeding and fixing sequences.
- `scripts/migrate.js` — Earlier minimal migration of products and customers via REST using `.env` creds; keeps variants simple and sets random passwords.
- `scripts/magento-to-medusa.js` — CLI migration utility with flags (`--resources`, `--concurrency`, `--dry-run`, `--currency-code`, `--verbose`) to import categories/products/customers over REST with backoff and handle normalization.
- `scripts/Untitled-2.js` — Example/legacy Magento→Medusa migrator with hardcoded tokens; keep out of production.

## Diagnostics and supporting tools
- `scripts/debug-env.js` — Quick print of Medusa/Magento auth environment variables.
- `scripts/debug-magento-products.js` — Sanity check call against `/products` on the Magento REST API.
- `scripts/diag-container.js` — Medusa `exec` helper that inspects the DI container/module resolution for product services.
- `scripts/create-secret-key.js` — Medusa `exec` workflow to create a secret Admin API key and print `SECRET_API_KEY`.
- `scripts/test-customer-login.js` — CLI to verify migrated customer logins against the storefront endpoint (`/store/migrate-login` by default); prompts for email/password if not provided via CLI/env.
- `scripts/clients.js`’s `assertMagento`/`assertMedusa` can be imported into scripts to verify credentials before migrating.

## Data/cache files and notes
- `scripts/Consumer Key.js` — Plaintext keys/tokens saved for reference; contains secrets and should not be used in production code.
- `scripts/Untitled-3.md` — Personal notes containing sensitive tokens and curl examples.
- `scripts/.idmap.json` — Generated mapping cache used by migration scripts; created on first run.
