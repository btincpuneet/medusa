// scripts/diag-container.js
module.exports = {
  default: async ({ container, logger }) => {
    const log = logger || console
    const regs = Object.keys(container.registrations || {}).sort()
    const has = (k) => (regs.includes(k) ? "YES" : "no")

    console.log("Total registrations:", regs.length)
    console.log("productModuleService (v1-style name):", has("productModuleService"))
    console.log("productService:", has("productService"))
    console.log("productCategoryService:", has("productCategoryService"))

    try {
      const svc = container.resolve("productModuleService")
      console.log("Resolve productModuleService (container):", !!svc ? "OK" : "FAILED")
    } catch (e) {
      console.log("Resolve productModuleService (container) FAILED:", e.message)
    }

    // v2 modules are resolved via Modules SDK (not DI container)
    try {
      const { MedusaModule, Modules } = require("@medusajs/modules-sdk")
      const pm = await MedusaModule.getModuleInstance(Modules.PRODUCT)
      console.log("ModulesSDK PRODUCT resolved:", pm ? "OK" : "FAILED")
      if (pm?.listProducts) {
        const res = await pm.listProducts({ take: 1 })
        console.log("ModulesSDK listProducts ok, count:", Array.isArray(res) ? res.length : 0)
      }
    } catch (e) {
      console.log("ModulesSDK PRODUCT resolve FAILED:", e.message)
    }

    try {
      const ps = container.resolve("productService")
      console.log("Resolve productService (v1):", !!ps ? "OK" : "FAILED")
    } catch (e) {
      console.log("Resolve productService (v1) FAILED:", e.message)
    }

    log.info?.("Finished diag.")
  },
}
