import "@medusajs/medusa/dist/models/order"

declare module "@medusajs/medusa/dist/models/order" {
  interface Order {
    magento_order_id?: string | null
  }
}
