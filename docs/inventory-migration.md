# Magento → Medusa inventory sync

The `scripts/inventory.js` helper pulls stock levels from Magento and seeds or
updates the equivalent inventory records in Medusa. It supports both Magento
MSI (Multi Source Inventory) and the legacy single-source stock endpoint.

## Prerequisites

- Magento REST credentials stored in `.env` (at minimum `MAGENTO_REST_BASE_URL`
  and `MAGENTO_ADMIN_TOKEN`).
- Medusa admin URL and admin API key in `.env`
  (`MEDUSA_BASE_URL`/`MEDUSA_ADMIN_URL` and `MEDUSA_ADMIN_TOKEN`).
- The Medusa backend should be running (usually on `http://localhost:9000`).
- Products should already exist in Medusa for the SKUs you plan to sync. Run
  `npm run migrate:products` first if needed.

Optional environment flags:

- `MAGENTO_MSI=true|false` — toggle MSI mode (defaults to `true`).
- `MEDUSA_DEFAULT_LOCATION` — stock location name used when MSI is disabled
  (defaults to `default`).
- `MEDUSA_REQUIRED_QUANTITY` — how many inventory units a single variant
  consumes (defaults to `1`).

## Running the script

From `Medusa/my-backend` run:

```bash
npm run migrate:inventory
```

The script will:

1. Resolve the SKU list (from the local `.idmap.json` cache or directly from
   Magento when the cache is empty).
2. Fetch stock quantities per SKU (aggregated across Magento sources when MSI
   is enabled).
3. Ensure corresponding Medusa stock locations exist for each Magento source
   code (they are created on the fly when missing and cached in
   `scripts/.idmap.json`).
4. Create inventory items when they do not already exist, attach them to the
   matching Medusa variants, and synchronise the location levels with the
  quantities pulled from Magento.

The log output summarises each SKU (`qty@source`) as it is processed. At the end
you will see the number of SKUs updated or skipped.

## Troubleshooting

- If you see `Variant missing in Medusa`, make sure the product migration ran
  and that the SKU matches exactly (case sensitive) between Magento and Medusa.
- For `No stock data in Magento`, confirm that the SKU exists and is assigned
  to at least one source in Magento.
- Existing stock locations are reused when their name matches (case-insensitively);
  delete or rename duplicates in Medusa before re-running if needed.
