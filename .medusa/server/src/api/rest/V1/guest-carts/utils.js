"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMagentoGuestCart = exports.toMagentoGuestCartItem = void 0;
const toNumber = (value) => {
    if (typeof value === "number") {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    if (value && typeof value === "object" && "value" in value) {
        const raw = value.value;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};
const buildExtensionAttributes = (item) => {
    const metadata = (item.metadata ?? {});
    return {
        company_code: metadata.company_code ?? null,
        brand_id: metadata.brand_id ?? null,
        domain_id: metadata.domain_id ?? null,
        category_id: metadata.category_id ?? null,
    };
};
const defaultSku = (item) => {
    return (item.variant_sku ??
        item.variant_id ??
        item.product_handle ??
        item.product_id ??
        item.id);
};
const toMagentoGuestCartItem = (cartId, item) => {
    const price = toNumber(item.unit_price);
    const qty = Number(item.quantity ?? 0);
    return {
        item_id: item.id,
        sku: defaultSku(item),
        name: item.title ?? item.product_title ?? "",
        price,
        qty,
        quote_id: cartId,
        product_type: item.product_type ?? "simple",
        row_total: price * qty,
        extension_attributes: buildExtensionAttributes(item),
        custom_attributes: [],
    };
};
exports.toMagentoGuestCartItem = toMagentoGuestCartItem;
const toMagentoGuestCart = (cart) => {
    const items = Array.isArray(cart.items) ? cart.items : [];
    const itemsQty = items.reduce((acc, item) => acc + Number(item.quantity ?? 0), 0);
    return {
        id: cart.id,
        items_count: items.length,
        items_qty: itemsQty,
        customer: cart.customer_id
            ? {
                id: cart.customer_id,
                email: cart.email ?? null,
            }
            : null,
        items: items.map((item) => (0, exports.toMagentoGuestCartItem)(cart.id, item)),
        billing_address: cart.billing_address ?? null,
        shipping_address: cart.shipping_address ?? null,
    };
};
exports.toMagentoGuestCart = toMagentoGuestCart;
// @ts-nocheck
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvZ3Vlc3QtY2FydHMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsTUFBTSxRQUFRLEdBQUcsQ0FBQyxLQUFjLEVBQVUsRUFBRTtJQUMxQyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzlCLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUNELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDOUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzVCLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDN0MsQ0FBQztJQUVELElBQUksS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLElBQUssS0FBYSxFQUFFLENBQUM7UUFDcEUsTUFBTSxHQUFHLEdBQUksS0FBYSxDQUFDLEtBQUssQ0FBQTtRQUNoQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDMUIsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUM3QyxDQUFDO0lBRUQsT0FBTyxDQUFDLENBQUE7QUFDVixDQUFDLENBQUE7QUFFRCxNQUFNLHdCQUF3QixHQUFHLENBQUMsSUFBcUIsRUFBRSxFQUFFO0lBQ3pELE1BQU0sUUFBUSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQTRCLENBQUE7SUFDakUsT0FBTztRQUNMLFlBQVksRUFBRSxRQUFRLENBQUMsWUFBWSxJQUFJLElBQUk7UUFDM0MsUUFBUSxFQUFF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