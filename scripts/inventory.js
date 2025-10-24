// scripts/inventory.js
const { mg, md, paginateMagento } = require("./clients");
const { loadMap, saveMap } = require("./id-map");
const { limiter } = require("./utils");

const MSI_ENABLED = String(process.env.MAGENTO_MSI || "true").toLowerCase() === "true";
const DEFAULT_LOCATION_CODE = (process.env.MEDUSA_DEFAULT_LOCATION || "default").trim() || "default";
const REQUIRED_VARIANT_QUANTITY = Math.max(1, Number(process.env.MEDUSA_REQUIRED_QUANTITY || 1));

function buildMagentoExtraParams() {
  const query = (process.env.MAGENTO_EXTRA_QUERY || "").trim();
  if (!query) {
    return {};
  }
  const params = new URLSearchParams(query);
  const out = {};
  for (const [key, value] of params.entries()) {
    out[key] = value;
  }
  return out;
}

const MAGENTO_EXTRA_PARAMS = buildMagentoExtraParams();

function normalizeSku(sku) {
  return (sku || "").trim();
}

function aggregateMagentoLevels(entries) {
  const bucket = new Map();
  for (const entry of entries) {
    const code = (entry.source_code || DEFAULT_LOCATION_CODE || "default").trim() || DEFAULT_LOCATION_CODE;
    const qty = Number(entry.quantity ?? entry.qty ?? 0);
    const safeQty = Number.isFinite(qty) ? Math.max(0, Math.floor(qty)) : 0;
    bucket.set(code, (bucket.get(code) || 0) + safeQty);
  }
  return Array.from(bucket.entries()).map(([source_code, quantity]) => ({
    source_code,
    quantity,
  }));
}

async function collectSkus(map) {
  const cached = Object.keys(map.products || {}).filter(Boolean);
  if (cached.length) return cached;

  console.log("ℹ️  No cached SKU map found – scanning Magento catalog...");
  const skus = new Set();
  for await (const page of paginateMagento(
    "/products?fields=items[sku],search_criteria,total_count",
    undefined,
    MAGENTO_EXTRA_PARAMS
  )) {
    for (const item of page) {
      const sku = normalizeSku(item?.sku);
      if (sku) skus.add(sku);
    }
  }
  return Array.from(skus);
}

function createLocationHelpers(map) {
  const cache = map.locations || (map.locations = {});
  const inflight = new Map();

  async function lookupExisting(name) {
    try {
      const { data } = await md.get("/stock-locations", {
        params: { q: name, limit: 50 },
      });
      const match = (data.stock_locations || []).find(
        (loc) => loc.name?.toLowerCase?.() === name.toLowerCase()
      );
      return match || null;
    } catch {
      return null;
    }
  }

  async function ensure(name) {
    const key = name.trim();
    if (cache[key]) return cache[key];

    if (inflight.has(key)) return inflight.get(key);

    const promise = (async () => {
      const existing = await lookupExisting(key);
      if (existing) {
        cache[key] = existing.id;
        saveMap(map);
        return existing.id;
      }

      try {
        const { data } = await md.post("/stock-locations", { name: key });
        const id = data.stock_location?.id;
        if (!id) throw new Error("Missing stock_location.id in response");
        cache[key] = id;
        saveMap(map);
        console.log("➕ Created stock location", key);
        return id;
      } catch (err) {
        inflight.delete(key);
        throw err;
      }
    })();

    inflight.set(key, promise);
    const id = await promise;
    inflight.delete(key);
    return id;
  }

  return ensure;
}

async function fetchMagentoLevels(sku) {
  if (!MSI_ENABLED) {
    const { data } = await mg.get(`/stockItems/${encodeURIComponent(sku)}`);
    const qty = Number(data.qty ?? 0);
    return aggregateMagentoLevels([
      {
        source_code: DEFAULT_LOCATION_CODE,
        quantity: qty,
      },
    ]);
  }

  const { data } = await mg.get("/inventory/source-items", {
    params: {
      "searchCriteria[filter_groups][0][filters][0][field]": "sku",
      "searchCriteria[filter_groups][0][filters][0][value]": sku,
      "searchCriteria[filter_groups][0][filters][0][condition_type]": "eq",
      "searchCriteria[pageSize]": 100,
    },
  });
  return aggregateMagentoLevels(data.items || []);
}

async function findVariantBySku(sku) {
  const { data } = await md.get("/product-variants", {
    params: { q: sku, limit: 20 },
  });

  const variants = data.variants || [];
  return variants.find((v) => normalizeSku(v.sku) === sku) || variants[0] || null;
}

async function ensureInventoryItem(variant, levels) {
  const sku = normalizeSku(variant.sku) || variant.id;
  const { data } = await md.get("/inventory-items", {
    params: { sku, limit: 1 },
  });
  let item = data.inventory_items?.[0] || null;

  if (item) {
    return item;
  }

  const location_levels = levels.map((level) => ({
    location_id: level.location_id,
    stocked_quantity: level.quantity,
  }));

  const payload = {
    sku,
    title: variant.title || sku,
    description: variant.title || sku,
    requires_shipping: variant.requires_shipping ?? true,
    location_levels: location_levels.length ? location_levels : undefined,
  };

  const { data: created } = await md.post("/inventory-items", payload);
  item = created.inventory_item;
  if (!item) {
    throw new Error(`Failed to create inventory item for ${sku}`);
  }
  console.log("➕ Created inventory item", sku);
  return item;
}

async function ensureVariantAttachment(variant, inventoryItemId) {
  const productId = variant.product_id;
  if (!productId) {
    throw new Error(`Variant ${variant.id} missing product_id`);
  }

  try {
    await md.post(`/products/${productId}/variants/${variant.id}/inventory-items`, {
      inventory_item_id: inventoryItemId,
      required_quantity: REQUIRED_VARIANT_QUANTITY,
    });
    console.log("🔗 Linked variant", variant.sku || variant.id, "→ inventory item");
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;
    if (status === 409 || /already attached/i.test(message)) {
      return;
    }
    throw err;
  }
}

async function syncLocationLevels(inventoryItemId, desiredLevels) {
  if (!desiredLevels.length) {
    return;
  }

  const { data } = await md.get(`/inventory-items/${inventoryItemId}`);
  const currentLevels = data.inventory_item?.location_levels || [];
  const currentByLocation = new Map(
    currentLevels.map((level) => [level.location_id, level])
  );

  for (const level of desiredLevels) {
    const existing = currentByLocation.get(level.location_id);
    if (!existing) {
      await md.post(`/inventory-items/${inventoryItemId}/location-levels`, {
        location_id: level.location_id,
        stocked_quantity: level.quantity,
      });
      continue;
    }

    const presentQty = Number(existing.stocked_quantity ?? 0);
    if (presentQty !== level.quantity) {
      await md.post(
        `/inventory-items/${inventoryItemId}/location-levels/${level.location_id}`,
        {
          stocked_quantity: level.quantity,
        }
      );
    }
  }
}

async function run() {
  const map = loadMap();
  const ensureLocationId = createLocationHelpers(map);
  const limit = limiter();

  const skus = (await collectSkus(map)).map(normalizeSku).filter(Boolean);
  if (!skus.length) {
    console.log("⚠️  No SKUs found to sync.");
    return;
  }

  console.log(
    `📦 Syncing inventory for ${skus.length} SKUs (Magento MSI ${MSI_ENABLED ? "on" : "off"})`
  );

  let updated = 0;
  let skipped = 0;

  const tasks = skus.map((sku) =>
    limit(async () => {
      try {
        const levels = await fetchMagentoLevels(sku);
        if (!levels.length) {
          skipped++;
          console.warn("⚠️  No stock data in Magento for", sku);
          return;
        }

        const locations = [];
        for (const level of levels) {
          const location_id = await ensureLocationId(level.source_code);
          locations.push({
            source_code: level.source_code,
            location_id,
            quantity: level.quantity,
          });
        }

        const variant = await findVariantBySku(sku);
        if (!variant) {
          skipped++;
          console.warn("⚠️  Variant missing in Medusa for", sku);
          return;
        }

        map.variants = map.variants || {};
        map.variants[sku] = variant.id;
        if (variant.product_id) {
          map.products = map.products || {};
          if (!map.products[sku]) {
            map.products[sku] = variant.product_id;
          }
        }

        const inventoryItem = await ensureInventoryItem(variant, locations);
        await ensureVariantAttachment(variant, inventoryItem.id);
        await syncLocationLevels(inventoryItem.id, locations);

        updated++;
        const summary = locations.map((l) => `${l.quantity}@${l.source_code}`).join(", ");
        console.log(`✔ inventory ${sku} (${summary})`);
      } catch (err) {
        const detail = err.response?.data || err.message;
        console.error("❌ inventory", sku, detail);
      }
    })
  );

  await Promise.all(tasks);
  saveMap(map);
  console.log(`✅ Inventory done. Updated: ${updated}, Skipped: ${skipped}`);
}

if (require.main === module)
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });

module.exports = run;
