// medusa-config.js
// CommonJS config for Medusa v2.x using @medusajs/framework
const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

// Load .env.[NODE_ENV] and .env
loadEnv(process.env.NODE_ENV || "development", process.cwd())

const buildCors = (...values) => {
  const origins = values
    .filter(Boolean)
    .flatMap((value) =>
      String(value)
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    )
  return Array.from(new Set(origins)).join(",")
}

module.exports = defineConfig({
  projectConfig: {
    // DB connection string, e.g.:
    // postgres://USER:PASSWORD@localhost:5432/medusa
    databaseUrl: process.env.DATABASE_URL,

    // Optional Redis (recommended for prod; fake redis is ok in dev)
    // redisUrl: process.env.REDIS_URL,

    http: {
      // Set permissive defaults for local dev
      storeCors: buildCors(
        process.env.STORE_CORS ||
          "http://localhost:8000,http://localhost:3000,http://localhost:3002,http://localhost:5173",
        process.env.STORE_CORS_EXTRA
      ),
      adminCors: buildCors(
        process.env.ADMIN_CORS ||
          "http://localhost:7001,http://localhost:9000,http://localhost:3002,http://localhost:5173",
        process.env.ADMIN_CORS_EXTRA
      ),
      authCors: buildCors(
        process.env.AUTH_CORS ||
          "http://localhost:8000,http://localhost:3000,http://localhost:3002,http://localhost:5173",
        process.env.AUTH_CORS_EXTRA
      ),

      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },

<<<<<<< Updated upstream
=======
  admin: {
    path: "/app",
    backendUrl: process.env.MEDUSA_BASE_URL || "http://localhost:9000",
    // Only override HMR fields; avoid spreading base config to prevent duplicate plugins during merge
    vite: (config) => ({
      server: {
        ...(config.server ?? {}),
        hmr: {
          ...(config.server?.hmr ?? {}),
          host: HMR_HOST ?? config.server?.hmr?.host,
          port: HMR_PORT ?? config.server?.hmr?.port,
          clientPort: HMR_CLIENT_PORT ?? config.server?.hmr?.clientPort,
          protocol: HMR_PROTOCOL ?? config.server?.hmr?.protocol,
        },
      },
    }),
  },

>>>>>>> Stashed changes
  // ---- v2 Modules (minimal set for products/prices/inventory) ----
  modules: {
    product: {
      resolve: "@medusajs/product",
      options: {},
    },
    customer: {
      resolve: "@medusajs/customer",
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
    order: {
      resolve: "@medusajs/order",
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
