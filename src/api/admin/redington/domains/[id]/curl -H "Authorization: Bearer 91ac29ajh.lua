curl -H "Authorization: Bearer 91ac29ajhw7a650sxxd9j3tb9ve7wzpt" \
         "http://local.b2c.com/rest/V1/products?searchCriteria[currentPage]=1&searchCriteria[pageSize]=5"





         curl -s -H "Authorization: Bearer sk_c237ac429d186c69afe40743fd65ed186069522c04f0832f41268a8267678b6f" http://localhost:9000/admin/collections | head
         curl -s -H "Authorization: Bearer " http://localhost:9000/admin/collections | head

         curl -s \
  -H "x-publishable-api-key: pk_484a65c349e6781e4740ac3da2241f26f3da8d6d3e386c71ee5a7d52bd1516ee" \
  http://localhost:9000/store/products | head

  curl -s -X POST http://localhost:9000/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"prashantkaushik700@gmail.com","password":"rrW48GqXcgkdz9f"}'


  backup .env file 

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
MEDUSA_ADMIN_EMAIL=admin@local.test
MEDUSA_ADMIN_PASSWORD=Admin#123
MEDUSA_ADMIN_TOKEN=sk_c237ac429d186c69afe40743fd65ed186069522c04f0832f41268a8267678b6f
MEDUSA_PUBLISHABLE_KEY=pk_484a65c349e6781e4740ac3da2241f26f3da8d6d3e386c71ee



# Magento
MAGENTO_REST_BASE_URL=http://local.b2c.com/rest/V1
MAGENTO_ADMIN_TOKEN=91ac29ajhw7a650sxxd9j3tb9ve7wzpt
MAGENTO_COMPANY_CODE=1140
MAGENTO_ACCESS_ID=6


curl -s -H "x-medusa-access-token: sk_c237ac429d186c69afe40743fd65ed186069522c04f0832f41268a8267678b6f" \ http://localhost:9000/admin/collections | head


INSERT INTO provider_identity (
  id,
  entity_id,
  provider,
  auth_identity_id
) VALUES (
  'pi_admin_local',
  'admin@local.test',
  'emailpass',          
  'ai_admin_local'
);