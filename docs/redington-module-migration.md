# Redington Magento → Medusa Migration Blueprint

This document catalogues the functional surface area of the Redington Magento
modules and maps them to the Medusa backend (`Medusa/my-backend`) and Lenovo
B2C storefront (`Lenovo-B2C-React`). It is intended as the canonical backlog
for completing the migration of bespoke Magento behaviour into the Medusa stack
and for planning the Medusa UI tabs that replace the legacy admin pages.

The scope covers the following Magento modules:

```
Redington_GuestUserRegister
Redington_HomeVideo
Redington_Invoice
Redington_Log
Redington_MaxQtyCheck
Redington_OrderCcEmail
Redington_OrderReturnManagement
Redington_OrderShipment
Redington_OtpFunctionality
Redington_OutOfStockProductEnquiry
Redington_PaymentIntegration
Redington_Product
Redington_ProductDesc
Redington_ProductPricing
```

## 1. Pre‑migration checklist

- **Database access**: Medusa reads/writes PostgreSQL via `DATABASE_URL`.
  Magento data lives in MySQL tables defined under `B2C/app/code/Redington/**/etc/db_schema.xml`.
- **SAP + payment credentials**: values from Magento system config must be
  exported to Medusa env vars defined in `src/modules/redington-config/index.ts`
  (see `docs/redington-config.md`).
- **Magento REST proxy**: `src/api/apilist.ts` enumerates the Magento endpoints
  already exposed to the Medusa frontend. Update this file when new Medusa
  routes become the canonical source.
- **Medusa table helpers**: `src/lib/pg.ts` is the staging ground for new
  Postgres schemas and row mappers. Every module below references the helper
  that must be added or extended.

## 2. Module migration matrix

| Module | Magento surface area | Medusa status | Gap analysis |
| --- | --- | --- | --- |
| GuestUserRegister | REST: `/V1/guestuser/guestuserverify`, `/V1/redington/allowed_domains`, `/V1/guestuser/token`; config `redington_settings/guest_user/allowed_domains`; SAP sync of `sap_sync`, `sap_customer_code`. | Token generation, domain policy lookup, and SAP-backed verification are live (`src/api/rest/V1/guestuser/token/route.ts`, `src/api/rest/V1/checkdomain/route.ts`, `src/api/rest/V1/guestuser/guestuserverify/route.ts`) with audit logging. | Add `/V1/redington/allowed_domains` reader and flesh out SAP sync of Medusa customers + migration of existing guest audit/token history. |
| HomeVideo | DB table `homevideo`; admin grid & REST `/V1/redington-homevideo/homevideo/search`. | No tables or routes. | Create Postgres table + admin/store APIs; migrate records; add storefront tab to display videos. |
| Invoice | REST `/V1/b2cgetinvoice` hitting SAP; relies on `Redington_AddBccValue` for BCC recipients. | SAP client + `/V1/b2cgetinvoice` proxy implemented (`src/api/rest/V1/b2cgetinvoice/route.ts`) with invoice audit logging. | Integrate CC recipients, plug into storefront download flows, and flesh out order-to-SAP mapping (e.g., storing SAP order numbers). |
| Log | Admin UI listing `var/log/*.log`. | No equivalent tooling. | Create Medusa admin tab that streams/tails logs (limit + download); optional API to surface latest lines. |
| MaxQtyCheck | Tables `epp_order_tracker`, `epp_max_order_qty`, `epp_max_order_qty_category`; REST `/V1/max-order-qty/getMaxOrderQty`; catalog plugin enforcing limits. | No tables; env mirror for duration exists (`REDINGTON_PRODUCT_MAX_ORDER_DURATION`). | Port schemas to Postgres; implement Medusa enforcement (cart validation/middleware); add admin CRUD; migrate historical tracker data. |
| OrderCcEmail | Table `order_cc_email`; admin UI; used when emailing invoices. | Medusa already has Postgres table & routes (`redington_add_bcc` in `src/lib/pg.ts`; admin/store handlers under `src/api/admin|store/redington/add-bcc`). | Run MySQL → Postgres migration script; wire BCC into Medusa invoice emails once Invoice module lands. |
| OrderReturnManagement | Table `order_returns`; email templates; REST `/V1/returnView`, `/V1/requestOrderReturn`, `/V1/checkOrderReturn`. | No implementation. | Create Postgres schema + admin and customer APIs; port email templates; migrate historical return requests; add storefront tab for “Return Requests”. |
| OrderShipment | Adds `awb_number` column to quotes/orders; cron + helper sync from SAP. | Medusa order model lacks AWB metadata and SAP sync. | Extend Medusa order workflow to store AWB in metadata; create cron/workflow using SAP API; add admin/storefront tracking tab; backfill AWB from Magento. |
| OtpFunctionality | Table `customer_email_otp`; REST `/V1/otp/send`, `/V1/otp/verify`; email templates; config for SMS provider. | Implemented: Postgres `redington_otp` table helpers and REST (`src/api/rest/V1/otp/send|verify/route.ts`). | Integrate actual SMS/email delivery using `redingtonConfig.smsOtp`; migrate existing OTP table if retention required; build admin audit viewer if desired. |
| OutOfStockProductEnquiry | Table `redington_outofstockproductenquiry_productenquiry`; admin grid; REST CRUD. | No tables or routes. | Port schema to Postgres; create admin + customer REST; wire email templates; add storefront “Notify me” tab; migrate records. |
| PaymentIntegration | Table `redington_mpgs_transaction_data`; REST `/V1/carts/mine/b2cpayment-information`, `/V1/payment-status`; checkout plugin. | No Medusa integration yet. | Decide MPGS strategy (server-to-server vs hosted); create Postgres table; build payment session handler hooking into Medusa carts; migrate historic transactions for reporting. |
| RetainCartPaymentFailure | Table `retaincartpaymentime`; REST `/V1/payment/getRetryTime`, `/V1/redington/retain-cart/cancel`, `/V1/redington/payment/retry/email`, `/V1/redington/reorder`; cron + emails. | Retry-time config + BCC management implemented (`redington_retain_cart_config` table, admin UI, `/rest/V1/payment/getRetryTime`). | Build email + cancellation + reorder endpoints, migrate cron workflow, and wire storefront retry UX. |
| Product | Adds EAV attributes `company_code`, `distribution_channel`; observer `SyncProductToSap`. | Product metadata table does not yet expose these fields. | Extend Medusa product DTOs (e.g. metadata) and ensure SAP sync workflow via orchestrations; migrate attribute data from Magento. |
| ProductDesc | Admin zip→CSV importer updating product descriptions. | No tooling. | Implement Node-based importer (e.g. `src/scripts/import-product-descriptions.ts`) that updates Medusa product long descriptions; offer admin upload tab; plan import pipeline. |
| ProductPricing | Table `epp_product_price`; admin upload; plugins setting price. | No tables or pricing rules yet. | Introduce Postgres table + pricing service to override Medusa prices per domain/company; migrate pricing grid; create admin UI tabs for upload/list; integrate into pricing engine. |

## 3. Module deep dives

Each subsection summarises Magento logic, desired Medusa implementation, and the
data migration approach.

### 3.1 Redington_GuestUserRegister

- **Magento behaviour**
  - Verifies guest users (`Model/GuestUserRegister.php`) and triggers SAP
    customer creation if `sap_sync` is false.
  - Exposes allowed domain list from system config
    (`etc/adminhtml/system.xml` + `Model/DomainConfig.php`).
  - Generates integration tokens based on email or mobile number
    (`Model/TokenByEmail.php`).
- **Medusa implementation**
  - Token endpoint implemented at `src/api/rest/V1/guestuser/token/route.ts:34`.
  - Domain lookup/policy surfaced via `src/api/rest/V1/checkdomain/route.ts:15`.
  - Guest verification now proxies SAP (`src/api/rest/V1/guestuser/guestuserverify/route.ts`) and records outcomes in `redington_guest_user_audit` via `recordGuestUserAudit`.
  - Allowed domains environment variable already supported (`REDINGTON_GUEST_ALLOWED_DOMAINS`).
- **Next steps**
  1. Add `/V1/redington/allowed_domains` route that returns merged values from Postgres domain tables and config.
  2. Synchronise SAP customer flags (`sap_sync`, `sap_customer_code`) into Medusa users and backfill historical guest verification tokens/audit rows (use `npm run migrate:customer-sync` for the initial import).
  3. Decide how storefront should surface “global” guest rules vs. domain-specific ones.

- **Storefront tab**
  - Add “Guest Access” tab to Lenovo B2C React under the login modal or account
    onboarding, reusing the new endpoints. Suggested entry point:
    `Lenovo-B2C-React/src/components/Auth` (create a tab toggling between
    verified domain input and OTP flow).

### 3.2 Redington_HomeVideo

- **Magento behaviour**
  - Stores video rows (`etc/db_schema.xml`) with title, URL, status.
  - Admin listing + form (`view/adminhtml/ui_component/...`).
  - REST search endpoint returning videos (anonymous).
- **Medusa plan**
  1. Extend `src/lib/pg.ts` with `ensureRedingtonHomeVideoTable` mirroring the
     MySQL schema (include timestamps; coerce status to boolean).
  2. Add admin routes (`src/api/admin/redington/home-videos`) for CRUD.
  3. Add store route (`src/api/store/redington/home-videos`) returning active
     videos optionally filtered by domain.
  4. Create React admin tab (if using Medusa admin UI) plus storefront component
     (e.g. new section in `Lenovo-B2C-React/src/components/Home/VideoGallery`).
- **Data migration**
  - Extract via `SELECT * FROM homevideo` and insert into the new table.
  - Normalize timestamps and status strings during import script.

### 3.3 Redington_Invoice

- **Magento behaviour**
  - `/V1/b2cgetinvoice` fetches SAP invoices and PDF using helper
    `Redington\SapIntegration\Helper\Data`.
  - BCC recipients stored in `order_cc_email` (handled separately).
- **Medusa implementation**
  - SAP client + `/V1/b2cgetinvoice/route.ts` proxy fetch invoice metadata/PDF and log to `redington_invoice_audit` using `recordInvoiceAudit`.
- **Next steps**
  1. Reuse `redington_add_bcc` to append BCC addresses before emailing links.
  2. Build storefront download flow and expose invoice status in Medusa admin.
  3. Ensure SAP order numbers are persisted on Medusa orders so the proxy can resolve invoices without manual input.
- **Data migration**
  - No persistent data apart from BCC (already covered); ensure environment
    secrets imported from Magento config.

### 3.4 Redington_Log

- **Magento behaviour**
  - Admin grid to browse `var/log` files, view metadata, tail the last lines.
- **Medusa plan**
  1. Provide admin API `GET /admin/redington/logs` that enumerates log files
     under `process.cwd()/../logs` (respect sandbox).
  2. Implement stream endpoint `GET /admin/redington/logs/:name?tail=200`.
  3. Add UI tab in Medusa admin React (or reuse CLI) with download button.
  4. Harden with whitelisting to prevent directory traversal.
- **Data migration**
  - None; rely on existing filesystem logs.

### 3.5 Redington_MaxQtyCheck

- **Magento behaviour**
  - Tracks per-domain/company/category max quantities and logs order usage.
  - API `/V1/max-order-qty/getMaxOrderQty/` returns limits.
  - Plugins enforce during checkout.
- **Medusa plan**
  1. Introduce tables in `src/lib/pg.ts`:
     `redington_max_qty_rule`, `redington_max_qty_category`, `redington_order_quantity_tracker`.
  2. Create admin CRUD routes under `src/api/admin/redington/max-qty`.
  3. Implement store route replicating Magento API to inform frontend.
  4. Hook into Medusa cart validation (custom workflow in `src/workflows`) to
     enforce rules and log usage.
  5. Honour `REDINGTON_PRODUCT_MAX_ORDER_DURATION` to expire logs.
- **Data migration**
  - Export data from `epp_max_order_qty*` tables.
  - For order tracker, either migrate raw history or seed with last N months.

### 3.6 Redington_OrderCcEmail

- **Magento behaviour**
  - Stores BCC emails per company/domain combination (`order_cc_email` table).
- **Medusa status**
  - **Done**: Postgres table and admin/store APIs exist (see
    `src/api/admin/redington/add-bcc/route.ts:8` and
    `src/api/store/redington/add-bcc/route.ts:15`).
- **Remaining**
  - Write one-time migration script that maps legacy fields to the Medusa table.
    Source fields match closely (`domain_id`, `domain_extention_id`,
    `bcc_emails`).

### 3.7 Redington_OrderReturnManagement

- **Magento behaviour**
  - Persists return records, sends email notifications to customer/admin.
  - REST endpoints for listing, creating, and checking returns.
- **Medusa plan**
  1. Add `ensureRedingtonOrderReturnTable` to `src/lib/pg.ts` mirroring Magento.
  2. Build admin listing route (`src/api/admin/redington/order-returns`) and
     store routes (`src/api/rest/V1/order-return/...`).
  3. Port email templates to `static/email` or template store.
  4. Create React tab “Returns” under account orders page.
- **Data migration**
  - Copy rows from `order_returns`; transform timestamp fields to ISO strings.

### 3.8 Redington_OrderShipment

- **Magento behaviour**
  - Adds `awb_number` columns and scheduled sync from SAP to populate AWB.
  - Invoice helper sends AWB in notifications.
- **Medusa plan**
  1. Extend Medusa order entity metadata (`src/modules/order` or service layer)
     to include `awb_number`.
  2. Implement cron/workflow that hits SAP API to refresh AWB and updates orders.
  3. Add admin route to override AWB and trigger email.
  4. Storefront: show “Shipment Tracking” tab with AWB and link to carrier.
- **Data migration**
  - Query Magento `sales_order` for `awb_number` and update Medusa order metadata
    using a bulk script (`src/scripts/migrate-awb.ts`).

### 3.9 Redington_OtpFunctionality

- **Magento behaviour**
  - Sends OTP via email/SMS, stores in `customer_email_otp`.
- **Medusa status**
  - REST send/verify implemented (`src/api/rest/V1/otp/send/route.ts:18` and
    `src/api/rest/V1/otp/verify/route.ts:18`) with Postgres table
    `redington_otp`.
- **Remaining**
  - Plug actual SMS/email provider using credentials from
    `redingtonConfig.smsOtp` (`src/modules/redington-config/index.ts:142`).
  - Add rate limiting and audit log (optional).
  - Migrate outstanding OTP records only if compliance requires (likely skip).

### 3.10 Redington_OutOfStockProductEnquiry

- **Magento behaviour**
  - Stores enquiries, triggers notifications, full CRUD API.
- **Medusa plan**
  1. Add helper `ensureRedingtonOutOfStockTable` to `src/lib/pg.ts`.
  2. Create admin routes under `src/api/admin/redington/out-of-stock-enquiries`
     and store routes under `src/api/rest/V1/redington/outofstockproductenquiry`.
  3. Port email templates for request + notify flows.
  4. Storefront tab “Notify Me” showing history and allowing cancellation.
- **Data migration**
  - Export table `redington_outofstockproductenquiry_productenquiry`; convert
    numeric IDs and timestamps.

### 3.11 Redington_PaymentIntegration

- **Magento behaviour**
  - Creates MPGS sessions, caches transaction data, exposes payment status API.
  - Hooks into Magento checkout pipeline.
- **Medusa plan**
  1. Decide integration pattern (server-to-server or hosted checkout) and wrap
     MPGS client inside `src/modules/payment-integration`.
  2. Add Postgres table `redington_mpgs_transaction` mirroring MySQL schema.
  3. Implement store routes `/V1/carts/mine/b2cpayment-information` and
     `/V1/payment-status`.
  4. Update Medusa checkout workflows to use new payment handler.
- **Data migration**
  - Backfill transaction history for reporting by copying existing rows.

### 3.12 Redington_RetainCartPaymentFailure

- **Magento behaviour**
  - Stores retry time / BCC per domain (`retaincartpaymentime` table) and annotates orders with flags to avoid duplicate emails.
  - Cron job checks pending orders, sends retries, cancels orders when timer expires.
  - Provides APIs to fetch retry time, trigger retry emails, cancel orders, and reactivate carts.
- **Medusa status**
  - Config table migrated to Postgres (`redington_retain_cart_config`) with admin UI (`/redington-retain-cart`).
  - `/rest/V1/payment/getRetryTime` implemented to return domain-aware retry time based on access/ company code.
- **Next steps**
  1. Implement Medusa workflows to send retry emails and cancel stale orders (leverage notification service + cron/job runner).
  2. Add `/rest/V1/redington/payment/retry/email`, `/rest/V1/redington/retain-cart/cancel`, and `/rest/V1/redington/reorder` endpoints.
  3. Store retry email flags on orders (metadata) and update storefront to consume retry timer responses.

### 3.13 Redington_Product

- **Magento behaviour**
  - Adds product attributes `company_code` and `distribution_channel`.
  - Observes product save/import to trigger SAP sync.
- **Medusa plan**
  1. Model company code + distribution channel as product metadata (e.g.
     `product.metadata.company_code`) or extend product module schema.
  2. Expose admin UI to edit these fields alongside Medusa product editor.
  3. Implement product-SAP sync workflow triggered on product update/import.
- **Data migration**
  - Extract attribute values from Magento (`catalog_product_entity_varchar`
    using attribute IDs) and import via Medusa admin REST/CLI.

### 3.14 Redington_ProductDesc

- **Magento behaviour**
  - Admin uploads a ZIP of CSVs mapping SKU → HTML snippet; controller updates
    product description directly.
- **Medusa plan**
  1. Build CLI script `src/scripts/import-product-descriptions.ts` that accepts
     a zip, parses CSV rows similar to
     `B2C/app/code/Redington/ProductDesc/Controller/Adminhtml/product/SaveImport.php:34`,
     and updates Medusa product `description`.
  2. Optionally expose admin UI upload tab (maybe inside custom admin app).
- **Data migration**
  - If current descriptions already in Magento, export via existing scripts and
    re-import into Medusa using the new CLI.

### 3.15 Redington_ProductPricing

- **Magento behaviour**
  - Maintains floor/special prices per SKU/country/company/domain; overrides
    customer pricing; observer adjusts cart totals.
- **Medusa plan**
  1. Create Postgres table `redington_product_price` with columns mirroring
     `epp_product_price` (see the Magento schema).
  2. Add admin CRUD/upload endpoints to manage prices.
  3. Integrate with Medusa pricing engine (custom price selection hook that
     checks domain/company, from/to date, promotion channel).
  4. Add storefront tab to show applicable promotions if required.
- **Data migration**
  - Bulk copy `epp_product_price` into new table; pay attention to decimal
    precision and timezone adjustments for `from_date`/`to_date`.

## 4. Storefront tab recommendations

For Lenovo B2C React, group new functionality into reusable tab components:

1. **Account → Guest Access**: domain verification + guest token flow (ties to
   GuestUserRegister and OTP endpoints).
2. **Account → Returns**: view/create return requests (OrderReturnManagement).
3. **Account → Notify Me**: manage out-of-stock enquiries (OutOfStockProductEnquiry).
4. **Orders → Invoices**: download invoice PDFs, view AWB (Invoice + OrderShipment).
5. **Home page → Videos**: carousel of curated HomeVideo entries.

Each tab should live under `Lenovo-B2C-React/src/components/{ModuleName}` with
Redux actions hitting the new Medusa routes listed above. Reuse `src/actions/apiList.js`
to register endpoints once Medusa routes are live.

> **Implementation note**  
> The Medusa backend now exposes the supporting APIs, but the Lenovo B2C React
> sidebar still points at the legacy Magento flows. Update the sidebar schema
> (see `Lenovo-B2C-React/src/components/Sidebar` and related routes) to add the
> Redington-specific tabs listed above. Each tab should dispatch Redux actions
> that call the new Medusa endpoints (added to `src/actions/apiList.js`) and
> render the corresponding component. Until those React components are wired,
> the sidebar entries will not appear.

## 5. Suggested implementation order

1. **Stabilise shared infrastructure**: extend `src/lib/pg.ts` with missing
   tables; ensure migrations are idempotent.
2. **Data-first modules**: migrate OrderCcEmail (simple), HomeVideo, MaxQty,
   OutOfStock, ProductPricing to Postgres to unblock UI work.
3. **Customer-facing flows**: GuestUserRegister + OTP + Returns to deliver
   feature parity for authentication and after-sales flows.
4. **Checkout/payment**: PaymentIntegration and Invoice/AWB since they depend
   on SAP/MPGS readiness.
5. **Admin tooling**: Log viewer and ProductDesc importer once critical journeys
   are covered.

## 6. Migration tooling tips

- Use the existing script pattern under `src/scripts` for MySQL → Postgres
  migrations. Each script should:
  1. Read Magento database credentials from `.env`.
  2. Stream rows (chunked) and insert via `pg` pool with conflict handling.
- When exposing new REST handlers, mirror the Magento response payloads to avoid
  frontend rewrites; inspect current responses via `B2C/app/code/.../Api/*Interface.php`.
- Maintain thorough unit tests per module (place under `src/modules/<module>/__tests__`).

## 7. Open questions

1. **SAP integration layer**: Decide whether to wrap SAP calls in a dedicated
   module (e.g. `src/modules/sap`) reused by Invoice, GuestUserRegister,
   OrderShipment, Product sync.
2. **Payment gateway**: Confirm if MPGS remains the gateway or if Medusa will
   leverage a different provider (affects PaymentIntegration migration).
3. **Data retention**: Clarify compliance requirements for historical OTPs,
   returns, and enquiries before migrating entire datasets.

---

Maintaining this document alongside implementation progress (marking sections as
delivered) will keep the migration on track and provide visibility for both
backend and storefront teams.
