// medusa-config.ts
import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const config = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.admin_CORS || process.env.ADMIN_CORS!, // tolerate either case
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: {
    /** Medusa v2 Product module */
    product: {
      resolve: "@medusajs/product",
      options: {},
    },
    promotion: {
      resolve: "@medusajs/promotion",
      options: {},
    },

    // If/when you need them, add similarly:
    // pricing:  { resolve: "@medusajs/pricing",  options: {} },
    // inventory:{ resolve: "@medusajs/inventory",options: {} },
    // stockLocation: { resolve: "@medusajs/stock-location", options: {} },
  },
})

// Visible proof during boot that THIS file was loaded and contains the module key.
try {
  // Avoid crashing in build tools that don't have console (very rare)
  // eslint-disable-next-line no-console
  console.log("[medusa-config] modules keys:", Object.keys((config as any).modules || {}))
} catch {}

export default config
