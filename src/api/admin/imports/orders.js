// src/api/admin/import/orders.js
// Medusa v1-style custom admin route to import historical orders with fixed totals
export default (router) => {
  router.post("/admin/import/orders", async (req, res) => {
    const manager = req.scope.resolve("manager");
    const orderService = req.scope.resolve("order");
    const lineItemService = req.scope.resolve("lineItemService");

    const payload = req.body;
    await manager.transaction(async (trx) => {
      const order = await orderService.withTransaction(trx).create({
        email: payload.customer_email,
        currency_code: payload.currency_code,
        status: "completed",
        fulfillment_status: payload.fulfillment_status || "not_fulfilled",
        payment_status: payload.payment_status || "captured",
        metadata: { legacy_id: payload.legacy_id, migrated: true },
        created_at: new Date(payload.created_at || Date.now())
      });

      for (const it of (payload.items || [])) {
        await lineItemService.withTransaction(trx).create({
          order_id: order.id,
          title: it.title,
          quantity: Math.max(1, Number(it.quantity || 1)),
          unit_price: Number(it.unit_price || 0),
          variant_id: null,
          metadata: { sku: it.sku }
        });
      }

      await orderService.withTransaction(trx).update(order.id, {
        subtotal: payload.totals?.subtotal ?? 0,
        tax_total: payload.totals?.tax_total ?? 0,
        discount_total: payload.totals?.discount_total ?? 0,
        shipping_total: payload.totals?.shipping_total ?? 0,
        total: payload.totals?.total ?? 0,
        metadata: { ...(order.metadata || {}), payment_method: payload.payment_method, shipping_method: payload.shipping_method }
      });

      res.json({ id: order.id });
    });
  });
};
