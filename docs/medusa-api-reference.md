# Custom Medusa API Reference

This project mixes Medusa v2 route handlers (file-based API folders under `src/api`) with a legacy Medusa v1 Express router (`src/api/admin/imports/orders.js`). The tables below catalogue every custom endpoint, grouped by namespace, to make it easier to wire the backend with the Lenovo B2C frontend.

## V2 Route Handlers

### Admin (`/admin`)

| Methods | Path | Purpose | Handler |
| --- | --- | --- | --- |
| GET | /admin/custom | Simple readiness ping for admin integrations. | `src/api/admin/custom/route.ts` |
| GET | /admin/magento-orders | Proxies Magento order listing; accepts `page`, `page_size`, `status`, `customer_email`, `increment_id`. Requires Magento env vars. | `src/api/admin/magento-orders/route.ts` |
| GET, POST | /admin/redington/domains | List and create Redington domain records. | `src/api/admin/redington/domains/route.ts` |
| GET, PUT, DELETE | /admin/redington/domains/:id | Read, update, or delete a specific domain. | `src/api/admin/redington/domains/[id]/route.ts` |
| GET, POST | /admin/redington/domain-extensions | List and create domain extension (TLD) records. | `src/api/admin/redington/domain-extensions/route.ts` |
| GET, PUT, DELETE | /admin/redington/domain-extensions/:id | Manage a specific domain extension entry. | `src/api/admin/redington/domain-extensions/[id]/route.ts` |
| GET, POST | /admin/redington/domain-based-authentication | Manage OTP/password policy per domain. | `src/api/admin/redington/domain-based-authentication/route.ts` |
| GET, PUT, DELETE | /admin/redington/domain-based-authentication/:id | Inspect or mutate a specific domain auth policy. | `src/api/admin/redington/domain-based-authentication/[id]/route.ts` |
| GET, POST | /admin/redington/access-mappings | List and create Magento access mappings (country ↔ domain/company). | `src/api/admin/redington/access-mappings/route.ts` |
| GET, PUT, DELETE | /admin/redington/access-mappings/:id | Manage an individual access mapping record. | `src/api/admin/redington/access-mappings/[id]/route.ts` |
| GET, POST | /admin/redington/company-codes | List and create country/company code combinations. | `src/api/admin/redington/company-codes/route.ts` |
| GET, PUT, DELETE | /admin/redington/company-codes/:id | Manage a specific company code record. | `src/api/admin/redington/company-codes/[id]/route.ts` |
| GET, POST | /admin/redington/currency-mappings | List and create currency + payment config entries per country. | `src/api/admin/redington/currency-mappings/route.ts` |
| GET, PUT, DELETE | /admin/redington/currency-mappings/:id | Manage a specific currency mapping entry. | `src/api/admin/redington/currency-mappings/[id]/route.ts` |
| GET, POST | /admin/redington/admin-roles | List existing admin roles and create new ones (supports permissions, can_login flag, domain scoping). | `src/api/admin/redington/admin-roles/route.ts` |
| GET, PUT, DELETE | /admin/redington/admin-roles/:id | Read, update, or delete an admin role. Prevents deleting the built-in super admin. | `src/api/admin/redington/admin-roles/[id]/route.ts` |
| GET | /admin/redington/admin-roles/me | Returns current admin user profile, assigned roles, and aggregated permissions. | `src/api/admin/redington/admin-roles/me/route.ts` |
| GET, POST | /admin/redington/admin-roles/assignments | List role assignments (with user summaries) or assign a role to a user/domain. | `src/api/admin/redington/admin-roles/assignments/route.ts` |
| DELETE | /admin/redington/admin-roles/assignments/:id | Remove a role assignment (guards against removing your last login-enabled role). | `src/api/admin/redington/admin-roles/assignments/[id]/route.ts` |
| POST | /admin/redington/admin-users | Provision an admin user (creates Medusa user, registers `emailpass` credentials, optionally assigns roles). | `src/api/admin/redington/admin-users/route.ts` |
| GET, POST | /admin/redington/add-bcc | Manage invoice BCC recipients per domain. | `src/api/admin/redington/add-bcc/route.ts` |
| GET, PUT, DELETE | /admin/redington/add-bcc/:id | Inspect or mutate a specific BCC entry. | `src/api/admin/redington/add-bcc/[id]/route.ts` |
| GET, POST | /admin/redington/cookie-policies | Upload or list cookie policy documents. | `src/api/admin/redington/cookie-policies/route.ts` |
| GET, PUT, DELETE | /admin/redington/cookie-policies/:id | Manage a specific cookie policy. | `src/api/admin/redington/cookie-policies/[id]/route.ts` |
| GET, POST | /admin/redington/cms-pages | Manage CMS content mapped to domains/access IDs. | `src/api/admin/redington/cms-pages/route.ts` |
| GET, PUT, DELETE | /admin/redington/cms-pages/:id | Inspect or mutate a specific CMS page entry. | `src/api/admin/redington/cms-pages/[id]/route.ts` |
| GET, POST | /admin/redington/coupons | Define coupon allow-list rules by company / domain. | `src/api/admin/redington/coupons/route.ts` |
| GET, PUT, DELETE | /admin/redington/coupons/:id | Manage an individual coupon rule. | `src/api/admin/redington/coupons/[id]/route.ts` |
| GET, POST | /admin/redington/customer-numbers | Maintain SAP customer numbers per brand & domain. | `src/api/admin/redington/customer-numbers/route.ts` |
| GET, PUT, DELETE | /admin/redington/customer-numbers/:id | Manage a specific customer number mapping. | `src/api/admin/redington/customer-numbers/[id]/route.ts` |
| GET, POST | /admin/redington/out-of-stock | Toggle domain-level out-of-stock enforcement. | `src/api/admin/redington/out-of-stock/route.ts` |
| GET, PUT, DELETE | /admin/redington/out-of-stock/:id | Inspect or mutate a specific out-of-stock control row. | `src/api/admin/redington/out-of-stock/[id]/route.ts` |
| GET | /admin/redington/get-in-touch | Review “Get in touch” enquiries submitted from the storefront. | `src/api/admin/redington/get-in-touch/route.ts` |
| GET, PUT | /admin/redington/category-restrictions/config | Configure promotion root category for restricted listings. | `src/api/admin/redington/category-restrictions/config/route.ts` |

### Store (`/store`)

| Methods | Path | Purpose | Handler |
| --- | --- | --- | --- |
| GET | /store/custom | Basic readiness ping for storefront integrations. | `src/api/store/custom/route.ts` |
| POST | /store/migrate-login | Legacy-login migration endpoint. Accepts `{ email, password }`, checks legacy Magento hashes, rehashes into Medusa, then returns the standard auth payload. | `src/api/store/migrate-login/route.ts` |
| GET | /store/redington/access-mappings | Lookup access mappings by `country_code`. Use `country_code=ALL` to fetch every mapping. | `src/api/store/redington/access-mappings/route.ts` |
| GET | /store/redington/company-codes | Fetch active company codes. Optional `country_code` query filters the result. | `src/api/store/redington/company-codes/route.ts` |
| GET | /store/redington/currency-mappings | Fetch the latest currency mapping for a `country_code`. | `src/api/store/redington/currency-mappings/route.ts` |
| GET | /store/redington/domain-extensions | List all active domain extensions for sign-up validation. | `src/api/store/redington/domain-extensions/route.ts` |
| GET | /store/redington/add-bcc | Resolve BCC email recipients for the active domain/access. | `src/api/store/redington/add-bcc/route.ts` |
| POST | /store/redington/category-restriction/categories | Return allowed categories/brands for a given access mapping. | `src/api/store/redington/category-restriction/categories/route.ts` |
| POST | /store/redington/category-restriction/promotions | Fetch promotion category tree configured in admin settings. | `src/api/store/redington/category-restriction/promotions/route.ts` |
| GET | /store/redington/cms-pages | Fetch CMS content by slug, domain, or access context. | `src/api/store/redington/cms-pages/route.ts` |
| GET | /store/redington/cookie-policy | Retrieve the latest active cookie policy document. | `src/api/store/redington/cookie-policy/route.ts` |
| POST | /store/redington/coupons/apply | Apply a coupon after Redington access validation (adds cart promotion). | `src/api/store/redington/coupons/apply/route.ts` |
| POST | /store/redington/coupons/remove | Remove a previously applied coupon from the cart. | `src/api/store/redington/coupons/remove/route.ts` |
| GET | /store/redington/customer-numbers | Lookup SAP customer numbers associated with the access mapping. | `src/api/store/redington/customer-numbers/route.ts` |
| GET | /store/redington/out-of-stock | Domain-level out-of-stock matrix including access metadata. | `src/api/store/redington/out-of-stock/route.ts` |
| POST | /store/redington/get-in-touch | Submit a Lenovo “Get in touch” enquiry. | `src/api/store/redington/get-in-touch/route.ts` |

### Auth (`/auth`)

| Methods | Path | Purpose | Handler |
| --- | --- | --- | --- |
| POST | /auth/session | Establish admin session, ensure super-admin role exists, attach roles/permissions to the session. | `src/api/auth/session/route.ts` |
| DELETE | /auth/session | Destroy the current session. | `src/api/auth/session/route.ts` |

## Medusa Core Modules

The project also relies on the default Medusa modules shipped with `@medusajs/medusa`. The tables below summarise the most frequently used endpoints for each module so the backend and frontend share the same vocabulary.

### Catalog (Product & Collections)

| Methods | Path | Notes |
| --- | --- | --- |
| GET | /store/products | Public catalogue listing with pricing, inventory summaries, and search/query params. |
| GET | /store/products/:id | Retrieve a single product or variant by id or handle. |
| GET | /store/product-categories | Hierarchical category tree used for navigation and brand filters. |
| GET | /store/collections | Front-facing collection listing. |
| GET, POST | /admin/products | Core admin CRUD for products; supports batching and import/export helpers. |
| GET, POST | /admin/product-categories | Manage category tree that powers Lenovo storefront navigation. |
| GET, POST | /admin/collections | Manage curated product collections. |

### Pricing

| Methods | Path | Notes |
| --- | --- | --- |
| GET | /admin/price-lists | List existing price lists (customer groups, region overrides). |
| POST | /admin/price-lists | Create a price list or schedule. |
| POST | /admin/price-lists/:id/prices | Bulk add/update prices on a list. |
| POST | /store/carts/:id/promotions | Add promotion / coupon codes to a cart (built-in workflow). |
| DELETE | /store/carts/:id/promotions | Remove promotion codes from a cart. |

### Inventory & Stock Locations

| Methods | Path | Notes |
| --- | --- | --- |
| GET, POST | /admin/inventory-items | Create inventory SKUs and track quantities. |
| GET, POST | /admin/stock-locations | Manage physical locations tied to Lenovo domains. |
| POST | /admin/stock-locations/:id/inventory-items | Attach inventory items to a location with quantities. |

### Currency & Regions

| Methods | Path | Notes |
| --- | --- | --- |
| GET | /store/currencies | Public list of enabled currencies for price display. |
| GET | /store/regions | Region metadata (currency, tax, payment) for checkout context. |
| GET, POST | /admin/currencies | Manage enabled currencies and rounding rules. |
| GET, POST | /admin/regions | Configure region defaults (currency, tax, payment providers). |

### Checkout & Orders

| Methods | Path | Notes |
| --- | --- | --- |
| GET, POST | /store/carts | Create carts, attach customer data, and estimate totals. |
| POST | /store/carts/:id/line-items | Add items/variants to the cart. |
| POST | /store/carts/:id/complete | Convert cart into an order using configured payment provider. |
| GET | /store/orders | Customer self-service order lookup (token secured). |
| GET | /store/orders/:id | Retrieve single order overview for authenticated customer. |
| GET | /admin/orders | Admin order list with filters. |
| GET | /admin/orders/:id | Detailed order management view. |

## Legacy Medusa v1 Router

| Methods | Path | Purpose | Handler |
| --- | --- | --- | --- |
| POST | /admin/import/orders | Express router mounted via Medusa v1 style. Creates historical orders and line items from posted payloads, then fixes totals. | `src/api/admin/imports/orders.js` |

## Notes

- All Redington admin routes rely on the helper utilities in `src/lib/pg.ts` to create backing tables on demand. Ensure the PostgreSQL connection is configured before invoking them.
- Magento-aware endpoints require `MAGENTO_REST_BASE_URL` and `MAGENTO_ADMIN_TOKEN` in your environment.
- The `emailpass` credential provider is registered through the core auth module inside `POST /admin/redington/admin-users`; there is no separate HTTP route for `/app/admin/emailpass`.
