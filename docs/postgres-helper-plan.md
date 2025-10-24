# Postgres Helper Plan

The migration blueprint (see `docs/redington-module-migration.md`) relies on a
set of Postgres helpers within `src/lib/pg.ts`. This document enumerates the
helpers/tables that still need to be added so that API routes can reuse a single
source of truth for schema creation and row mapping.

| Module | Table name (proposed) | Helper(s) to add | Notes |
| --- | --- | --- | --- |
| HomeVideo | `redington_home_video` | `ensureRedingtonHomeVideoTable`, `mapHomeVideoRow` | Mirrors Magento `homevideo` table. Include `status` boolean and timestamps. |
| OrderReturnManagement | `redington_order_return` | `ensureRedingtonOrderReturnTable`, `mapOrderReturnRow` | Schema based on Magento `order_returns`. |
| OutOfStockProductEnquiry | `redington_product_enquiry` | `ensureRedingtonProductEnquiryTable`, `mapProductEnquiryRow` | Renamed for clarity; preserve Magento columns (`domain_id`, `company_code`, `sku`, etc.). |
| PaymentIntegration | `redington_mpgs_transaction` | `ensureRedingtonMpgsTransactionTable`, `mapMpgsTransactionRow` | Retain MPGS session metadata (`session_id`, `result_indicator`). |
| MaxQtyCheck | `redington_max_qty_rule`, `redington_max_qty_category`, `redington_order_quantity_tracker` | `ensureRedingtonMaxQtyRuleTable`, `ensureRedingtonMaxQtyCategoryTable`, `ensureRedingtonOrderQtyTrackerTable`; plus matching mappers | Combine Magento `epp_max_order_qty*` tables. |
| ProductPricing | `redington_product_price` | `ensureRedingtonProductPriceTable`, `mapProductPriceRow` | Copy schema from `epp_product_price`. |
| Guest user audit (new) | `redington_guest_user_audit` | `ensureRedingtonGuestUserAuditTable`, `mapGuestUserAuditRow` | **Implemented** (`src/lib/pg.ts`). Use to log guest verification attempts. |
| Invoice audit (new) | `redington_invoice_audit` | `ensureRedingtonInvoiceAuditTable`, `mapInvoiceAuditRow` | **Implemented** (`src/lib/pg.ts`). Capture invoice fetch outcomes / payloads. |
| Customer sync (new) | `redington_customer_sync` | `ensureRedingtonCustomerSyncTable`, `upsertRedingtonCustomerSync`, `mapCustomerSyncRow` | **Implemented** (`src/lib/pg.ts`). Stores `sap_sync` + `sap_customer_code` and updates Medusa customer metadata. |
| Retain cart config (new) | `redington_retain_cart_config` | `ensureRedingtonRetainCartConfigTable`, `mapRetainCartConfigRow`, `upsertRedingtonRetainCartConfig` | **Implemented** (`src/lib/pg.ts`). Holds retry timer/BCC per domain for cart retry workflow. |

Implementation tips:

1. Follow existing patterns in `src/lib/pg.ts`: guard with boolean flags,
   ensure dependencies (e.g. domains table) before table creation, and expose
   row mappers to normalise timestamps.
2. Use snake_case column names and default timestamps:
   `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
3. Add indexes/constraints mirroring Magento behaviour (e.g. unique session id
   for MPGS transactions, unique combinations for max-qty rules).
