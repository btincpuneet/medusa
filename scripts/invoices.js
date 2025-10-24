// scripts/invoices.js
// Magento → Medusa invoice sync
// Fetch Magento invoices for orders already migrated into Medusa and store them on the order metadata.

const { mg, md } = require("./clients")
const { limiter } = require("./utils")

const PAGE_SIZE = parseInt(process.env.PAGE_SIZE || "100", 10)
const MAGENTO_BASE_URL =
  (process.env.MAGENTO_BASE_URL ||
    process.env.MAGENTO_REST_BASE_URL?.replace(/\/rest\/.*$/i, "") ||
    "http://localhost").replace(/\/+$/, "")

async function fetchMedusaOrders() {
  const orders = []
  let offset = 0

  while (true) {
    const { data } = await md.get("/orders", {
      params: {
        limit: PAGE_SIZE,
        offset,
        fields: "id,metadata",
      },
    })

    const batch = data?.orders || []
    if (!batch.length) break

    orders.push(...batch)
    offset += batch.length

    if (batch.length < PAGE_SIZE) break
  }

  return orders
}

async function fetchMagentoInvoices(incrementId) {
  if (!incrementId) {
    return []
  }

  const params = {
    "searchCriteria[pageSize]": 20,
    "searchCriteria[currentPage]": 1,
    "searchCriteria[filter_groups][0][filters][0][field]": "order_increment_id",
    "searchCriteria[filter_groups][0][filters][0][value]": incrementId,
    "searchCriteria[filter_groups][0][filters][0][condition_type]": "eq",
  }

  try {
    const { data } = await mg.get("/invoices", { params })
    const items = data?.items || []
    if (Array.isArray(items) && items.length) {
      return items
    }
  } catch (err) {
    console.warn(
      `⚠️  Magento invoice search by order_increment_id failed (${incrementId}): ${
        err.response?.data || err.message
      }`
    )
  }

  // fallback search by order_id if we have it
  try {
    const orderSearch = {
      "searchCriteria[pageSize]": 20,
      "searchCriteria[currentPage]": 1,
      "searchCriteria[filter_groups][0][filters][0][field]": "order_id",
      "searchCriteria[filter_groups][0][filters][0][value]": incrementId,
      "searchCriteria[filter_groups][0][filters][0][condition_type]": "eq",
    }
    const { data } = await mg.get("/invoices", { params: orderSearch })
    return data?.items || []
  } catch (err) {
    console.warn(
      `⚠️  Magento invoice fallback search failed (${incrementId}): ${
        err.response?.data || err.message
      }`
    )
    return []
  }
}

function mapInvoice(invoice) {
  return {
    id: invoice.entity_id ?? null,
    increment_id: invoice.increment_id ?? null,
    order_id: invoice.order_id ?? null,
    order_increment_id: invoice.order_increment_id ?? null,
    grand_total: invoice.grand_total ?? null,
    subtotal: invoice.subtotal ?? null,
    tax_amount: invoice.tax_amount ?? null,
    currency: invoice.order_currency_code ?? invoice.global_currency_code ?? null,
    created_at: invoice.created_at ?? null,
    updated_at: invoice.updated_at ?? null,
    pdf_url: invoice.entity_id
      ? `${MAGENTO_BASE_URL}/rest/V1/invoices/${invoice.entity_id}`
      : null,
  }
}

async function updateMedusaOrder(orderId, orderMetadata, mappedInvoices) {
  const nextMetadata = {
    ...(orderMetadata || {}),
    magento_invoices: mappedInvoices,
  }

  await md.post(`/orders/${orderId}`, {
    metadata: nextMetadata,
  })
}

async function run() {
  console.log("🧾 Syncing Magento invoices into Medusa orders...")
  const orders = await fetchMedusaOrders()
  const limit = limiter()
  let updated = 0
  let skipped = 0

  const tasks = orders.map((order) =>
    limit(async () => {
      const magentoInc = order.metadata?.magento_increment_id
      if (!magentoInc) {
        skipped++
        return
      }

      const invoices = await fetchMagentoInvoices(magentoInc)
      if (!invoices.length) {
        skipped++
        console.warn(`⚠️  No invoices found in Magento for order increment ${magentoInc}`)
        return
      }

      const mapped = invoices.map(mapInvoice)
      await updateMedusaOrder(order.id, order.metadata, mapped)
      updated++
      console.log(`✔ Stored ${mapped.length} invoice(s) for order ${order.id}`)
    })
  )

  await Promise.all(tasks)
  console.log(`✅ Invoice sync complete. Updated orders: ${updated}, Skipped: ${skipped}`)
}

if (require.main === module) {
  run().catch((err) => {
    console.error("Invoice sync failed:", err)
    process.exit(1)
  })
}

module.exports = run
