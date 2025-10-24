// medusa-config.js
// CommonJS config for Medusa v2.x using @medusajs/framework
const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

// Load .env.[NODE_ENV] and .env
loadEnv(process.env.NODE_ENV || "development", process.cwd())

module.exports = defineConfig({
  projectConfig: {
    // DB connection string, e.g.:
    // postgres://USER:PASSWORD@localhost:5432/medusa
    databaseUrl: process.env.DATABASE_URL,

    // Optional Redis (recommended for prod; fake redis is ok in dev)
    // redisUrl: process.env.REDIS_URL,

    http: {
      // Set permissive defaults for local dev
      storeCors:
        process.env.STORE_CORS ||
        "http://localhost:8000,http://localhost:3000,http://localhost:3002,http://localhost:5173",
      adminCors:
        process.env.ADMIN_CORS ||
        "http://localhost:7001,http://localhost:9000,http://localhost:3002,http://localhost:5173",
      authCors:
        process.env.AUTH_CORS ||
        "http://localhost:8000,http://localhost:3000,http://localhost:3002,http://localhost:5173",

      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },

  // ---- v2 Modules (minimal set for products/prices/inventory) ----
  modules: {
    product: {
      resolve: "@medusajs/product",
      options: {},
    },
    pricing: {
      resolve: "@medusajs/pricing",
      options: {},
    },
    inventory: {
      resolve: "@medusajs/inventory",
      options: {},
    },
    currency: {
      resolve: "@medusajs/currency",
      options: {},
    },
    promotion: {
      resolve: "@medusajs/promotion",
      options: {},
    },
    // (Optional, enable later if you need them)
    // salesChannel: { resolve: "@medusajs/sales-channel", options: {} },
    // promotion:    { resolve: "@medusajs/promotion",     options: {} },
    // fulfillment:  { resolve: "@medusajs/fulfillment",   options: {} },
    // tax:          { resolve: "@medusajs/tax",           options: {} },
  },

  // Keep any plugins you already had here
  plugins: [
    // e.g. file service, payment providers, etc.
  ],
})
