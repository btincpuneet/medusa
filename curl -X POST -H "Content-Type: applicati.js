curl -X POST -H "Content-Type: application/json" \
          -d '{"username":"Mukesh","password":"Mukesh@123"}' \
          http://local.b2c.com/rest/V1/integration/admin/token


          curl -H "x-medusa-api-key: sk_a06b7a66e2cee0e79894182e60c0f82256c2eac04b867bb932aa294adee9f2ba" http://localhost:9000/admin/store

          curl -X POST http://localhost:9000/admin/customers \
  -H "Content-Type: application/json" \
  -d '{"email": "prashantkaushik700@gmail.com", "password": "Pkaushik0178@"}'

  curl -X POST http://localhost:9000/store/auth \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: pk_484a65c349e6781e4740ac3da2241f26f3da8d6d3e386c71ee5a7d52bd1516ee" \
  -d '{ "email": "prashantkaushik700@gmail.com", "password": "Pkaushik0178@" }'

curl -X POST http://localhost:9000/store/auth/token \
  -H "Content-Type: application/json" \
  -d '{ "email": "prashantkaushik700@gmail.com", "password": "Pkaushik0178@" }'


  token recieved from below api 
  development@development-IdeaPad-5-15IAL7:~/Desktop/Projects/Redington/Migration/Medusa/my-backend$ curl -X POST http://localhost:9000/auth/customer/emailpass \
  -H "Content-Type: application/json" \
  -d '{ "email": "prashantkaushik700@gmail.com", "password": "Pkaushik0178@" }'
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3Rvcl9pZCI6IiIsImFjdG9yX3R5cGUiOiJjdXN0b21lciIsImF1dGhfaWRlbnRpdHlfaWQiOiJhdXRoaWRfMDFLNlpFSDY2M0g3WFlHOVE2S1JCQUdIMFYiLCJhcHBfbWV0YWRhdGEiOnt9LCJpYXQiOjE3NjAzNjQ5ODgsImV4cCI6MTc2MDQ1MTM4OH0.BR23m1EkPl5C1CLNEn8EzilU4JmBEsCkipMBtrSnYRQ"}

curl http://localhost:9000/store/customers/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3Rvcl9pZCI6IiIsImFjdG9yX3R5cGUiOiJjdXN0b21lciIsImF1dGhfaWRlbnRpdHlfaWQiOiJhdXRoaWRfMDFLNlpFSDY2M0g3WFlHOVE2S1JCQUdIMFYiLCJhcHBfbWV0YWRhdGEiOnt9LCJpYXQiOjE3NjAzNjQ5ODgsImV4cCI6MTc2MDQ1MTM4OH0.BR23m1EkPl5C1CLNEn8EzilU4JmBEsCkipMBtrSnYRQ \
  -H "x-publishable-api-key: pk_484a65c349e6781e4740ac3da2241f26f3da8d6d3e386c71ee5a7d52bd1516ee"

curl -X POST http://localhost:9000/admin/api-keys \
  -H "Authorization: Bearer eyJhY3Rvcl9pZCI6IiIsImFjdG9yX3R5cGUiOiJjdXN0b21lciIsImF1dGhfaWRlbnRpdHlfaWQiOiJhdXRoaWRfMDFLNlpFSDY2M0g3WFlHOVE2S1JCQUdIMFYiLCJhcHBfbWV0YWRhdGEiOnt9LCJpYXQiOjE3NjAzNjQ5ODgsImV4cCI6MTc2MDQ1MTM4OH0.BR23m1EkPl5C1CLNEn8EzilU4JmBEsCkipMBtrSnYRQ" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Migration Script Key", "type": "secret" }'


  # .env (in your Medusa project root)

# Medusa config
MEDUSA_ADMIN_ONBOARDING_TYPE=default
STORE_CORS=http://localhost:8000,https://docs.medusajs.com
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
AUTH_CORS=http://localhost:5173,http://localhost:9000,http://localhost:8000,https://docs.medusajs.com

REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
DATABASE_URL=postgres://postgres:admin0178%40@localhost/medusa-my-backend

MEDUSA_BASE_URL=http://localhost:9000
MEDUSA_ADMIN_EMAIL=prashantkaushik700@gmail.com
MEDUSA_ADMIN_PASSWORD=Pkaushik0178@
MEDUSA_ADMIN_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3Rvcl9pZCI6IiIsImFjdG9yX3R5cGUiOiJjdXN0b21lciIsImF1dGhfaWRlbnRpdHlfaWQiOiJhdXRoaWRfMDFLNlpFSDY2M0g3WFlHOVE2S1JCQUdIMFYiLCJhcHBfbWV0YWRhdGEiOnt9LCJpYXQiOjE3NjAzNjQ5ODgsImV4cCI6MTc2MDQ1MTM4OH0.BR23m1EkPl5C1CLNEn8EzilU4JmBEsCkipMBtrSnYRQ

MEDUSA_PUBLISHABLE_KEY=pk_484a65c349e6781e4740ac3da2241f26f3da8d6d3e386c71ee

MEDUSA_SECRET_API_KEY=sk_76ddf95825f1105fde8bb996f20e23ace3024b3f3572c5ed41754bd0f4de0820

# Magento
MAGENTO_REST_BASE_URL=http://local.b2c.com/rest/V1
MAGENTO_ADMIN_TOKEN=eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJ1aWQiOjEwLCJ1dHlwaWQiOjIsImlhdCI6MTc2MDM1OTg5MywiZXhwIjozNjAwMTc2MDM1OTg5M30.mqPLnIWfxd6Ye1ehUguBnKXDBmsFC_769oJSquPnnxQ
MAGENTO_COMPANY_CODE=1140
MAGENTO_ACCESS_ID=6

# .env (in your Medusa project root)

# Medusa config
MEDUSA_ADMIN_ONBOARDING_TYPE=default
STORE_CORS=http://localhost:8000,https://docs.medusajs.com
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
AUTH_CORS=http://localhost:5173,http://localhost:9000,http://localhost:8000,https://docs.medusajs.com

REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
DATABASE_URL=postgres://postgres:admin0178%40@localhost/medusa-my-backend

MEDUSA_BASE_URL=http://localhost:9000
MEDUSA_ADMIN_EMAIL=prashantkaushik700@gmail.com
MEDUSA_ADMIN_PASSWORD=Pkaushik0178@
MEDUSA_ADMIN_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3Rvcl9pZCI6IiIsImFjdG9yX3R5cGUiOiJjdXN0b21lciIsImF1dGhfaWRlbnRpdHlfaWQiOiJhdXRoaWRfMDFLNlpFSDY2M0g3WFlHOVE2S1JCQUdIMFYiLCJhcHBfbWV0YWRhdGEiOnt9LCJpYXQiOjE3NjAzNjQ5ODgsImV4cCI6MTc2MDQ1MTM4OH0.BR23m1EkPl5C1CLNEn8EzilU4JmBEsCkipMBtrSnYRQ
MEDUSA_PUBLISHABLE_KEY=pk_484a65c349e6781e4740ac3da2241f26f3da8d6d3e386c71ee
MEDUSA_SECRET_API_KEY=sk_76ddf95825f1105fde8bb996f20e23ace3024b3f3572c5ed41754bd0f4de0820

# Magento
MAGENTO_REST_BASE_URL=http://local.b2c.com/rest/V1
MAGENTO_ADMIN_TOKEN=eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJ1aWQiOjEwLCJ1dHlwaWQiOjIsImlhdCI6MTc2MDM1OTg5MywiZXhwIjozNjAwMTc2MDM1OTg5M30.mqPLnIWfxd6Ye1ehUguBnKXDBmsFC_769oJSquPnnxQ
MAGENTO_COMPANY_CODE=1140
MAGENTO_ACCESS_ID=6

MEDUSA_FF_PRODUCT_CATEGORIES=true \
MAGENTO_REST_BASE_URL=http://local.b2c.com/rest/V1 \
MAGENTO_TOKEN=eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJ1aWQiOjEwLCJ1dHlwaWQiOjIsImlhdCI6MTc2MDM1OTg5MywiZXhwIjozNjAwMTc2MDM1OTg5M30.mqPLnIWfxd6Ye1ehUguBnKXDBmsFC_769oJSquPnnxQ \
npx medusa exec scripts/product.js

MAGENTO_BASE_URL=http://local.b2c.com \
MAGENTO_SCOPE=default \
MAGENTO_API_VERSION=V1 \
MAGENTO_TOKEN=eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJ1aWQiOjEwLCJ1dHlwaWQiOjIsImlhdCI6MTc2MDM1OTg5MywiZXhwIjozNjAwMTc2MDM1OTg5M30.mqPLnIWfxd6Ye1ehUguBnKXDBmsFC_769oJSquPnnxQ \
npx medusa exec scripts/product.js

MEDUSA_ADMIN_API_KEY=sk_76ddf95825f1105fde8bb996f20e23ace3024b3f3572c5ed41754bd0f4de0820 \
npx medusa exec scripts/orders-rest.js

working Product migration script code below
MEDUSA_SECRET_API_KEY=sk_0be2b2e27f374c0ae5851a4ae5bff20fa317a9b163e79b9814e361ff3098ec29 npx medusa exec scripts/product.js


working Customer migration script code below 
// scripts/customers.js
const { paginateMagento, md } = require("./clients")
const { loadMap, saveMap } = require("./id-map")
const { limiter } = require("./utils")

// tiny helper for Magento custom attributes
const attr = (ent, code, fb = null) =>
  (ent.custom_attributes || []).find((a) => a.attribute_code === code)?.value ?? fb

const genderMap = { 1: "Male", 2: "Female", 3: "Not Specified" }

async function getCustomerByEmail(email) {
  try {
    const { data } = await md.get("/customers", { params: { q: email, limit: 1 } })
    const found = (data?.customers || [])[0]
    return found || null
  } catch (_) {
    return null
  }
}

async function run() {
  const map = loadMap()
  const limit = limiter(6) // a bit of parallelism
  let created = 0,
    reused = 0,
    skipped = 0

  // Ask Magento for exactly what we need (faster + fewer 413s)
  const path =
    '/customers/search?fields=' +
    'items[' +
    'id,firstname,lastname,email,created_at,website_id,group_id,confirmation,' +
    'created_in,dob,taxvat,gender,' +
    'addresses[firstname,lastname,telephone,postcode,country_id,region[region,region_code],city,street],' +
    'custom_attributes' +
    '],' +
    'search_criteria,total_count'

  for await (const page of paginateMagento(path)) {
    const tasks = page.map((c) =>
      limit(async () => {
        const key = String(c.id)
        if (map.customers[key]) {
          skipped++
          return
        }

        const addresses = Array.isArray(c.addresses) ? c.addresses : []
        const primaryAddress =
          addresses.find((address) => address?.default_billing) ||
          addresses.find((address) => address?.default_shipping) ||
          addresses[0] ||
          {}

        const phone =
          primaryAddress.telephone ||
          attr(c, "telephone") ||
          addresses.map((address) => address.telephone).find(Boolean) ||
          null
        const region = primaryAddress.region || {}
        const state = region.region || region.region_code || null
        const postcode = primaryAddress.postcode || null
        const country = primaryAddress.country_id || null
        const company = primaryAddress.company || attr(c, "company") || null

        // custom attributes from your grid (adjust codes if your Magento uses different names)
        const company_code = attr(c, "company_code", null)
        const access_id = attr(c, "access_id", null)
        const approve_customer = attr(c, "approve_customer", null)
        const website_name = attr(c, "created_in", c.created_in || null)

        const confirmed_email = c.confirmation ? "Confirmation Required" : "Confirmation Not Required"
        const gender_label = genderMap[c.gender] || null

        // Medusa create payload
        const payload = {
          email: c.email,
          first_name: c.firstname,
          last_name: c.lastname,
          phone,
          company_name: company,
          metadata: {
            magento_id: c.id,
            group_id: c.group_id ?? null,
            website_id: c.website_id ?? null,
            created_at: c.created_at,
            created_in: website_name,
            confirmed_email,
            dob: c.dob || null,
            tax_vat_number: c.taxvat || null,
            gender: gender_label,
            phone,
            zip: postcode,
            country,
            state,
            city: primaryAddress.city || null,
            street: Array.isArray(primaryAddress.street)
              ? primaryAddress.street.join(", ")
              : primaryAddress.street || null,
            company_code,
            access_id,
            approve_customer,
          },
        }

        try {
          const { data } = await md.post("/customers", payload)
          const customerId = data.customer.id
          map.customers[key] = customerId
          saveMap(map)
          created++
          console.log(`✔ customer ${c.email} → ${customerId}`)

          // create address if we have enough fields
          const addressPayloads = addresses
            .map((address) => {
              if (!address) {
                return null
              }

              const addressRegion = address.region || {}
              const streetLines = Array.isArray(address.street)
                ? address.street.filter(Boolean)
                : address.street
                ? [address.street]
                : []
              const [line1, ...rest] = streetLines

              const addressPhone =
                address.telephone || phone || attr(c, "telephone") || ""
              const addressCompany =
                address.company || company || attr(c, "company") || ""

              const hasContent =
                Boolean(line1) ||
                rest.length > 0 ||
                address.city ||
                address.postcode ||
                addressPhone ||
                address.country_id

              if (!hasContent) {
                return null
              }

              return {
                first_name: address.firstname || c.firstname || "",
                last_name: address.lastname || c.lastname || "",
                address_name:
                  [address.firstname || c.firstname, address.lastname || c.lastname]
                    .filter(Boolean)
                    .join(" ") || null,
                address_1: line1 || "",
                address_2: rest.join(", "),
                city: address.city || "",
                province:
                  addressRegion.region || addressRegion.region_code || state || "",
                postal_code: address.postcode || postcode || "",
                country_code: (address.country_id || country || "").toLowerCase(),
                phone: addressPhone,
                company: addressCompany,
                is_default_shipping: Boolean(address.default_shipping),
                is_default_billing: Boolean(address.default_billing),
                metadata: {
                  magento_address_id: address.id ?? null,
                  magento_customer_id: c.id,
                  magento_country_id: address.country_id || country,
                  magento_region_id: addressRegion.region_id ?? region.region_id ?? null,
                  magento_region_code:
                    addressRegion.region_code ?? region.region_code ?? null,
                },
              }
            })
            .filter(Boolean)

          for (const addressPayload of addressPayloads) {
            await md
              .post(`/customers/${customerId}/addresses`, addressPayload)
              .catch((e) =>
                console.warn("⚠️ address", c.email, e.response?.data || e.message)
              )
          }

          // optional: set a temp password so sign-in is immediately possible
          const tempPw = Math.random().toString(36).slice(-10)
          await md
            .post(`/customers/${customerId}`, { password: tempPw })
            .catch((e) =>
              console.warn("⚠️ password", c.email, e.response?.data || e.message)
            )
        } catch (e) {
          // handle duplicates on email (409) → look up and map
          if (e.response?.status === 409) {
            const existing = await getCustomerByEmail(c.email)
            if (existing?.id) {
              map.customers[key] = existing.id
              saveMap(map)
              reused++
              console.log(`↺ reused customer ${c.email} → ${existing.id}`)
              return
            }
          }
          console.error("❌ customer", c.email, e.response?.data || e.message)
        }
      })
    )

    await Promise.all(tasks)
  }

  console.log(`\n✅ Customers done. created=${created}, reused=${reused}, skipped=${skipped}`)
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

module.exports = run




# .env (in your Medusa project root)

# Medusa config
MEDUSA_ADMIN_ONBOARDING_TYPE=default
STORE_CORS=http://localhost:8000,https://docs.medusajs.com
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
AUTH_CORS=http://localhost:5173,http://localhost:9000,http://localhost:8000,https://docs.medusajs.com

REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
DATABASE_URL=postgres://postgres:admin0178%40@localhost/medusa-my-backend

MEDUSA_BASE_URL=http://localhost:9000
MEDUSA_ADMIN_EMAIL=prashantkaushik700@gmail.com
MEDUSA_ADMIN_PASSWORD=Pkaushik0178@
MEDUSA_ADMIN_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3Rvcl9pZCI6IiIsImFjdG9yX3R5cGUiOiJjdXN0b21lciIsImF1dGhfaWRlbnRpdHlfaWQiOiJhdXRoaWRfMDFLNlpFSDY2M0g3WFlHOVE2S1JCQUdIMFYiLCJhcHBfbWV0YWRhdGEiOnt9LCJpYXQiOjE3NjAzNjQ5ODgsImV4cCI6MTc2MDQ1MTM4OH0.BR23m1EkPl5C1CLNEn8EzilU4JmBEsCkipMBtrSnYRQ
MEDUSA_PUBLISHABLE_KEY=pk_484a65c349e6781e4740ac3da2241f26f3da8d6d3e386c71ee
MEDUSA_SECRET_API_KEY=sk_76ddf95825f1105fde8bb996f20e23ace3024b3f3572c5ed41754bd0f4de0820 npx medusa exec scripts/product.js
MEDUSA_FF_PRODUCT_CATEGORIES=true

# Magento
MAGENTO_REST_BASE_URL=http://local.b2c.com/rest/V1
MAGENTO_ADMIN_TOKEN=eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJ1aWQiOjEwLCJ1dHlwaWQiOjIsImlhdCI6MTc2MDM1OTg5MywiZXhwIjozNjAwMTc2MDM1OTg5M30.mqPLnIWfxd6Ye1ehUguBnKXDBmsFC_769oJSquPnnxQ
MAGENTO_COMPANY_CODE=1140
MAGENTO_ACCESS_ID=6


# ---- Added for smoother v2 setup ----

# Runtime
NODE_ENV=development
PORT=9000
LOG_LEVEL=info

# Extra local CORS origins (useful for React/Vite/Next dev UIs)
STORE_CORS_EXTRA=http://localhost:3000,http://localhost:5173
ADMIN_CORS_EXTRA=http://localhost:7001
AUTH_CORS_EXTRA=http://localhost:3000,http://localhost:5173

# Real Admin API Key (create in Admin → Settings → API Keys → type: admin)
MEDUSA_ADMIN_API_KEY=sk_admin_REPLACE_ME

# Default setup values for scripts / migration helpers
DEFAULT_CURRENCY_CODE=inr
DEFAULT_LOCATION_NAME=Default Warehouse
DEFAULT_LOCATION_ID=   # fill after creating stock location
DEFAULT_SALES_CHANNEL_ID=   # fill after creating/listing sales channels

# Storefront usage
PUBLIC_PUBLISHABLE_KEY=${MEDUSA_PUBLISHABLE_KEY}

# Magento import helpers
MAGENTO_PRICE_CURRENCY=INR
MAGENTO_DEFAULT_TAX_RATE=0

# Optional modules / feature control
ENABLE_PRODUCT_MODULE=true
ENABLE_PRICING_MODULE=true
ENABLE_INVENTORY_MODULE=true
ENABLE_STOCK_LOCATION_MODULE=true
ENABLE_CURRENCY_MODULE=true


curl -s \
  -H "x-medusa-api-key: sk_76ddf95825f1105fde8bb996f20e23ace3024b3f3572c5ed41754bd0f4de0820" \
  http://localhost:9000/admin/products | head
