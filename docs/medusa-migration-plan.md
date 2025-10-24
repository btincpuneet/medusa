# Lenovo B2C Frontend Integration – Magento vs. Medusa

This document inventories the Magento endpoints currently consumed by the Lenovo-B2C-React app and outlines the work required to migrate each feature to Medusa.

---

## 1. Catalog & Discovery

| Feature | Current Magento Endpoint(s) | Status in Medusa | Notes / Required Work |
| --- | --- | --- | --- |
| Category Tree | `GET rest/default/V1/categories` | Medusa: `/store/product-categories` | Adjust frontend to new response shape. |
| Product search (by category & status) | `GET rest/V1/products?searchCriteria[...]` | Medusa: `/store/products` supports filters (`category_id`, `status`) | Rewrite query layer to use Medusa params. |
| Attribute options (size, color) | `GET …/products/attributes/<id>/options` | Not in core Medusa | Either hardcode, use product options/variants, or build custom module exposing options. |
| Recommended / home products | `GET …/products?…on_home=1` | No equivalent | Create custom field (`on_home`) + endpoint (or use Medusa Collections). |
| Banner sliders | `GET …/bannersliders` | Not available | Implement banner storage (DB + admin UI) and `/store/banners` route. |
| Search (CMS content) | `GET …/redington-homevideo/homevideo/search` etc. | No built-in CMS | Use external CMS or create Medusa modules. |

---

## 2. Customer Authentication & Profile

| Feature | Magento Endpoint | Medusa Support | Notes / Work |
| --- | --- | --- | --- |
| Customer registration | `POST /rest/V1/customers` | `/store/customers` | Update payload; handle password rules. |
| Customer login/token | `POST /integration/customer/token` | `/store/auth/email` + session cookie | Switch auth handling across app. |
| Customer profile fetch/update | `GET/PUT /customers/me` | `/store/customers/me` | Swap endpoints; adapt responses. |
| Password update | `POST /password/update` | `/store/customers/password` (reset flow) | Remap flow to Medusa’s endpoints. |
| OTP send/verify | `/otp/send`, `/otp/verify` | Not provided | Implement custom OTP service in Medusa or external provider. |
| Guest-user/domain verification | `/guestuser/*`, `/redington/allowed_domains`, `/checkdomain` | Custom | Create Medusa services/modules to replicate business rules. |
| Guest user token / URL decrypt | `/guestuser/token`, `/url/decrypt` | Custom | Implement endpoints in Medusa if needed. |

---

## 3. Cart & Checkout

| Feature | Magento Endpoint | Medusa Support | Notes / Work |
| --- | --- | --- | --- |
| Guest cart creation & items | `guest-carts/*` | `/store/carts`, `/store/cart-line-items` | Rebuild cart service using Medusa Store API. |
| Authenticated cart | `carts/mine`, `/items`, `/shipping-methods` | `/store/customers/me/cart`, `/store/shipping-options` | Rewrite Redux actions to new flows. |
| Shipping info submission | `/shipping-information` | `/store/carts/{id}/shipping-method` etc. | Adapt payloads to Medusa structure. |
| Apply/remove coupon | `carts/mine/coupons/*` | `/store/carts/{id}/apply-discount` | Update actions to new endpoints. |
| Stock check / max order quantity | `checkout/check-stock-data`, `max-order-qty/getMaxOrderQty` | Not core Medusa | Implement custom endpoints using inventory module. |
| Payment integration (CC Avenue) | `carts/mine/cc-avenuepayment-information`, `payment-status`, `payment/getRetryTime` | No native CC Avenue provider | Build custom payment provider and status polling. |
| Terms & conditions confirmation | `redington-termsconditions/...` | Custom | Create CMS or Medusa module to serve content. |

---

## 4. Orders & Returns

| Feature | Magento Endpoint | Medusa Support | Notes / Work |
| --- | --- | --- | --- |
| Order history by email | `orders?searchCriteria[customer_email]=…` | `/store/orders` (authenticated) | Requires Medusa auth; filter by customer ID. |
| Reorder | `POST redington/reorder` | Not available | Implement reorder workflow (order -> cart). |
| Return management | `requestOrderReturn`, `checkOrderReturn`, `returnView` | No equivalent | Build return module/workflows in Medusa. |
| Invoice download | `b2cgetinvoice` | Partial (metadata stored via script) | Extend to store API for customer downloads. |

---

## 5. Content & Miscellaneous Services

| Feature | Magento Endpoint | Medusa Status | Notes |
| --- | --- | --- |
| CMS pages, cookie policy, videos | `redington-cookiepolicy/*`, `redington-homevideo/*`, `…/search` | No CMS | Use external CMS or custom Medusa content module. |
| Country list | `directory/countries` | Medusa: `/store/regions` | Map to Medusa’s regions/countries data. |
| Enquiry forms | `set-enquiry-data/setEnquiryData` | No equivalent | Create custom submission endpoint. |
| Domain-specific lookups | `access-mapping/getDomainDetails` | No equivalent | Build custom service. |

---

## 6. Payments (CC Avenue)

- Current Magento flow uses dedicated endpoints for payment session creation, retry, and status.
- Medusa requires a custom payment provider wired into the payment collection system and store checkout pipeline.

---

## 7. Authentication Strategy Shift

- Magento: token per request (Bearer token).
- Medusa Store API: session cookie/JWT. Frontend must adapt Axios clients to handle Medusa auth, including storing cart IDs for guests and login flows for customers.

---

## Recommended Migration Plan

1. **Inventory**  
   Expand the table above as you discover more Magento endpoints.

2. **Backend Planning**  
   - Determine which Magento features exist in Medusa out of the box.
   - Design custom Medusa modules/workflows for missing features (OTP, CC Avenue, returns, banners, content).

3. **Backend Implementation**  
   - Build and test new Medusa services/routes.
   - Expose endpoints compatible with the React app.

4. **Frontend Refactor**  
   - Replace API calls module by module (catalog, auth, cart, orders, etc.).
   - Update Redux actions/reducers to handle new payloads.
   - Ensure authentication and session handling align with Medusa’s patterns.

5. **Parallel Testing**  
   - Keep Magento integration working until Medusa equivalents are stable.
   - Use feature flags or environment toggles to switch backend per feature.

6. **Decommission Magento** once all features have Medusa replacements and pass QA.

---

## Quick Checklist Before Replacing Any Endpoint

- [ ] Does Medusa already provide this data/behavior?  
- [ ] If not, has a custom module been implemented and documented?  
- [ ] Do we understand the payload differences (request/response)?  
- [ ] Is authentication/session handling updated for the feature?  
- [ ] Have edge cases (guest carts, OTP flows, payment retries) been covered?

Update this document as work progresses; treat it as the master tracking sheet for the Magento → Medusa migration.
