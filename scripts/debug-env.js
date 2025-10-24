module.exports = {
  /**
   * @param {import("@medusajs/framework/types").ExecArgs} _
   */
  default: async function debugEnv() {
    console.log("MEDUSA_SECRET_API_KEY:", process.env.MEDUSA_SECRET_API_KEY)
    console.log("MEDUSA_ADMIN_API_KEY:", process.env.MEDUSA_ADMIN_API_KEY)
    console.log("MAGENTO_ADMIN_TOKEN:", process.env.MAGENTO_ADMIN_TOKEN ? "<set>" : "<missing>")
  },
}
