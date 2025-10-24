// scripts/prices.js
// Sync Magento tier prices into Medusa price lists.

const { mg, md, paginateMagento } = require("./clients");
const { cents, limiter } = require("./utils");
const { loadMap, saveMap } = require("./id-map");

const DEFAULT_CURRENCY =
  (process.env.DEFAULT_CURRENCY_CODE ||
    process.env.DEFAULT_CURRENCY ||
    "usd").toLowerCase();

const map = loadMap();
map.variants = map.variants || {};
const variantCache = new Map(Object.entries(map.variants));

function normalizeSku(sku) {
  return String(sku || "").trim();
}

async function resolveVariantId(sku) {
  const normalized = normalizeSku(sku);
  if (!normalized) {
    return null;
  }
  if (variantCache.has(normalized)) {
    return variantCache.get(normalized);
  }

  const { data } = await md.get("/product-variants", {
    params: { q: normalized, limit: 20 },
  });

  const variants = data.variants || [];
  const match =
    variants.find(
      (variant) =>
        normalizeSku(variant.sku).toLowerCase() === normalized.toLowerCase()
    ) || variants[0];

  if (!match?.id) {
    return null;
  }

  variantCache.set(normalized, match.id);
  map.variants[normalized] = match.id;
  return match.id;
}

async function findPriceListByTitle(title) {
  const { data } = await md.get("/price-lists", {
    params: { q: title, limit: 50 },
  });
  const lists = data.price_lists || [];
  return lists.find((pl) => pl.title === title) || null;
}

async function ensurePriceListForSku(sku) {
  const title = `Tier prices ${sku}`;
  const existing = await findPriceListByTitle(title);
  if (existing?.id) {
    return { priceList: existing, created: false };
  }

  const { data } = await md.post("/price-lists", {
    title,
    description: `Tier pricing imported from Magento for SKU ${sku}`,
    status: "active",
    type: "sale",
  });

  return { priceList: data.price_list, created: true };
}

async function fetchExistingPriceIds(priceListId) {
  try {
    const { data } = await md.get(`/price-lists/${priceListId}`);
    return (data.price_list?.prices || [])
      .map((price) => price.id)
      .filter(Boolean);
  } catch (err) {
    console.warn(
      `⚠️  Unable to read existing prices for price list ${priceListId}:`,
      err.response?.data || err.message
    );
    return [];
  }
}

async function upsertTierPrices(priceListId, variantId, tiers) {
  const create = tiers
    .map((tier) => {
      const minQty = Math.max(1, Number(tier.qty || 1));
      const amount = cents(tier.value);
      if (amount <= 0) {
        return null;
      }
      return {
        currency_code: DEFAULT_CURRENCY,
        amount,
        min_quantity: minQty,
        variant_id: variantId,
      };
    })
    .filter(Boolean);

  if (!create.length) {
    return { created: 0, deleted: 0 };
  }

  const existingIds = await fetchExistingPriceIds(priceListId);
  const payload = { create };
  if (existingIds.length) {
    payload.delete = existingIds;
  }

  await md.post(`/price-lists/${priceListId}/prices/batch`, payload);
  return { created: create.length, deleted: existingIds.length };
}

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

async function* paginateTierProducts() {
  const fields =
    "/products?fields=items[sku,extension_attributes[tier_prices]],search_criteria,total_count";
  for await (const items of paginateMagento(fields, undefined, MAGENTO_EXTRA_PARAMS)) {
    yield items;
  }
}

async function run() {
  console.log("💸 Importing Magento tier prices → Medusa price lists");
  const limit = limiter();
  let createdLists = 0;
  let updatedLists = 0;
  let priceRows = 0;
  let skipped = 0;

  for await (const page of paginateTierProducts()) {
    const tasks = page.map((product) =>
      limit(async () => {
        const sku = normalizeSku(product.sku);
        const tiers = product.extension_attributes?.tier_prices || [];
        if (!sku || !tiers.length) {
          skipped++;
          return;
        }

        try {
          const variantId = await resolveVariantId(sku);
          if (!variantId) {
            skipped++;
            console.warn(`⚠️  Missing Medusa variant for SKU ${sku}`);
            return;
          }

          const { priceList, created } = await ensurePriceListForSku(sku);
          const { created: createdPrices } = await upsertTierPrices(
            priceList.id,
            variantId,
            tiers
          );

          if (created) {
            createdLists++;
          } else {
            updatedLists++;
          }

          priceRows += createdPrices;
          console.log(
            `✔ Synced tier prices for ${sku} (${createdPrices} entries)`
          );
        } catch (err) {
          skipped++;
          console.error(
            `❌ Failed tier price sync for ${sku}:`,
            err.response?.data || err.message
          );
        }
      })
    );

    await Promise.all(tasks);
  }

  saveMap(map);
  console.log(
    `✅ Price list sync complete. New lists: ${createdLists}, Updated lists: ${updatedLists}, Prices written: ${priceRows}, Skipped: ${skipped}`
  );
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = run;
