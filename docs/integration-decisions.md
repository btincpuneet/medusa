# SAP & MPGS Integration Decisions

This note captures the current Magento behaviour for SAP and MPGS (Mastercard
Payment Gateway Services) integrations and outlines the decisions required to
scope their Medusa counterparts. Use it as the source of truth when planning
the backend services and environment variables.

## 1. SAP integration

### 1.1 Magento reference

- The core logic lives in `B2C/app/code/Redington/SapIntegration/Helper/Data.php`.
- Capabilities provided:
  - Customer sync (`createCustomerInSap`) invoked by guest-user verification and
    other observers.
  - Product sync (`createProductInSap`) and inventory updates (`SystemATP`,
    stock cron jobs, VAT calculation).
  - Invoice workflows (`getInvoiceAPI`, `getInvoicePDF`) that fetch metadata and
    PDFs through authenticated REST calls.
  - VAT calculation, payment notification emails, and SAP-aware order updates.
- Configuration comes from Magento system config paths listed in
  `docs/redington-config.md` (e.g. `redington_sapintegration/api_general/*`).
- Authentication uses client id/secret headers and per-endpoint URLs.

### 1.2 Medusa implications

| Area | Decision point | Notes |
| --- | --- | --- |
| HTTP client | Build a dedicated module (e.g. `src/modules/sap`) vs. scattering per-route calls. | Recommend a shared module that wraps axios/fetch, injects credentials from `redingtonConfig.sap`, and centralises logging + retry logic. |
| Credentials | Confirm target environments supply the Magento-equivalent values. | `.env` currently lacks `REDINGTON_SAP_*` variables; need to source from Magento config dumps. |
| Workflows | Identify which SAP calls must stay synchronous (e.g. invoice download) and which can move to background jobs (product sync, stock sync). | Suggest orchestrating sync jobs via Medusa workflows (`src/workflows`). |
| Data storage | Determine whether to persist SAP responses (audit tables). | For invoices/returns, add audit tables (see `docs/redington-module-migration.md`). For stock/product sync, consider event sourcing or rely on Medusa core inventory. |
| Email + notifications | Map Magento email templates to Medusa email strategy. | Most SAP helper flows send emails; coordinate with Medusa notification service. |

### 1.3 Action items

1. Confirm SAP endpoint URLs, client id, and client secret for dev/qa/prod.
2. Decide if SAP authentication requires token exchange or static headers (Magento uses static headers).
3. Draft the interface for `src/modules/sap` including methods: `fetchInvoice`, `fetchInvoicePdf`, `createCustomer`, `createProduct`, `calculateVat`, `syncAwb`.
4. Once decisions are made, update `.env` with `REDINGTON_SAP_*` variables and wire them through `redingtonConfig`.

## 2. MPGS integration

### 2.1 Magento reference

- Located in `B2C/app/code/Redington/PaymentIntegration`.
- `Model/Api/CreateOrder.php` orchestrates checkout:
  - Places order / re-order, then calls `initiateSession` to create an MPGS
    checkout session via REST.
  - Stores session metadata in `redington_mpgs_transaction_data`.
- Helper (`Helper/Data.php`) reads settings:
  - `redington_paymentintegration/payment_general/*` for initiate-session URL,
    merchant id, password.
  - `redington_sapintegration/domain_url/domain` for the return URL base.
- MPGS requests use basic auth (`CURLOPT_USERPWD`) and JSON payload:
  ```json
  {
    "apiOperation": "INITIATE_CHECKOUT",
    "interaction": { "operation": "PURCHASE", "returnUrl": "<domain>/paymentsuccess" },
    "order": { "amount": <grandTotal>, "currency": "SAR", "id": "OrderXXXX", "reference": "OrderRefXXXX" },
    "transaction": { "reference": "TxnRefXXXX" }
  }
  ```
- There is a `PaymentStatus` API to poll MPGS and update transaction records.

### 2.2 Medusa implications

| Area | Decision point | Notes |
| --- | --- | --- |
| Checkout flow | Keep MPGS hosted checkout vs. move to API-only? | Recommend replicating Magento’s hosted flow initially to minimise frontend changes. |
| Credential storage | Merchant id/password + initiate-session URL need `.env` entries (`REDINGTON_PAYMENT_*`). | Not present yet; gather from Magento config. |
| Data persistence | Recreate `redington_mpgs_transaction_data` in Postgres. | Helper scaffolding added in `src/lib/pg.ts` (see migration blueprint). |
| Order lifecycle | Define how Medusa orders transition on MPGS callbacks (pending → paid). | Requires workflow aligning with Medusa’s payment collection service. |
| Retry / error handling | Decide whether to mirror Magento’s logging to disk. | Prefer structured logging and audit table columns for errors. |

### 2.3 Action items

1. Confirm gateway mode (test vs. production) and capture base URL for `INITIATE_CHECKOUT`.
2. Enumerate MPGS API operations needed beyond session creation (status, payment confirmation).
3. Design Medusa payment service abstraction that issues the MPGS session and stores `session_id`, `result_indicator`, etc.
4. Update environment configuration with `REDINGTON_PAYMENT_API_URL`, `REDINGTON_PAYMENT_USERNAME`, `REDINGTON_PAYMENT_PASSWORD`, plus currency/return URL if required.

## 3. Next steps summary

1. Collect SAP and MPGS credentials + URLs; document them in the deployment
   runbook and `.env.example`.
2. Approve the creation of shared modules:
   - `src/modules/sap` (wrapping all SAP HTTP calls).
   - `src/modules/payment/mpgs` or similar (encapsulating MPGS REST calls).
3. Once approved, proceed with implementing the database helpers (see
   `docs/redington-module-migration.md`) and corresponding Medusa routes.

## 4. Domain identifier handling

- Several Magento tables store `domain_id = 0` to represent “global” records that
  are not tied to a specific access domain. PostgreSQL schemas now allow
  `domain_id` to be `NULL` (`redington_max_qty_rule`, `redington_max_qty_category`,
  `redington_product_price`), and the migration script maps `0 → NULL` while
  preserving the original records.
- The migration script logs each mapping so the team can review the affected
  rows. If a future mapping from Magento’s `epp_domain` table is provided, the
  script can be updated to translate those `NULL` values to concrete Medusa
  domain records without losing history.

## 5. Persisting SAP customer sync state

- **Magento source**: guest verification flips `sap_sync` and `sap_customer_code`
  columns on the customer entity once SAP confirms account creation.
- **Medusa approach**:
  1. Extend the core `User`/`Customer` metadata (e.g. `customer.metadata.sap_sync`,
     `customer.metadata.sap_customer_code`) and persist records in the
     `redington_customer_sync` table.
  2. `/V1/guestuser/guestuserverify` now calls
     `upsertRedingtonCustomerSync`, which updates Medusa customer metadata and
     stores the SAP response (including customer code and synced timestamp).
  3. Backfill: run `npm run migrate:customer-sync` to import Magento values and
     hydrate both the sync table and customer metadata.
- **Benefits**: keeps Medusa as the source of truth, enables customer support to
  see SAP sync status, and aligns with future automation (resync jobs, reporting).
