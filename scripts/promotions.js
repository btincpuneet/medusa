// scripts/promotions.js
// Sync Magento sales rules (cart price rules) into Medusa promotions.

const { mg, md } = require("./clients");
const { limiter } = require("./utils");
const {
  ApplicationMethodAllocation,
  ApplicationMethodTargetType,
  ApplicationMethodType,
  PromotionStatus,
  PromotionType,
} = require("@medusajs/framework/utils");

const DEFAULT_CURRENCY =
  (process.env.DEFAULT_CURRENCY_CODE ||
    process.env.DEFAULT_CURRENCY ||
    "usd").toLowerCase();

const promotionCache = new Map();

function normalizeCode(code, fallback) {
  const trimmed = String(code || "").trim();
  if (trimmed) {
    return trimmed.toUpperCase();
  }
  return fallback.toUpperCase();
}

function buildMetadata(rule) {
  return {
    source: "magento",
    magento_rule_id: String(rule.rule_id ?? ""),
    magento_coupon_type: rule.coupon_type ?? null,
    magento_simple_action: rule.simple_action || null,
    magento_customer_groups: rule.customer_group_ids || [],
    magento_from_date: rule.from_date || null,
    magento_to_date: rule.to_date || null,
  };
}

function mapApplicationMethod(rule) {
  const action = String(rule.simple_action || "").toLowerCase();
  const discountAmount = Number(rule.discount_amount || 0);
  const description = rule.description || rule.name || undefined;

  if (discountAmount <= 0) {
    return null;
  }

  if (action === "by_percent") {
    return {
      description,
      type: ApplicationMethodType.PERCENTAGE,
      target_type: ApplicationMethodTargetType.ORDER,
      value: Math.min(Math.max(discountAmount, 0), 100),
    };
  }

  if (action === "cart_fixed") {
    return {
      description,
      type: ApplicationMethodType.FIXED,
      target_type: ApplicationMethodTargetType.ORDER,
      value: Math.max(discountAmount, 0),
      currency_code: DEFAULT_CURRENCY,
    };
  }

  if (action === "by_fixed") {
    return {
      description,
      type: ApplicationMethodType.FIXED,
      target_type: ApplicationMethodTargetType.ITEMS,
      allocation: ApplicationMethodAllocation.ACROSS,
      value: Math.max(discountAmount, 0),
      currency_code: DEFAULT_CURRENCY,
    };
  }

  return null;
}

async function fetchPromotionByCode(code) {
  if (promotionCache.has(code)) {
    return promotionCache.get(code);
  }

  const { data } = await md.get("/promotions", {
    params: { code, limit: 50 },
  });
  const promotions = data.promotions || [];
  const match = promotions.find(
    (promotion) => String(promotion.code || "").toUpperCase() === code
  );
  promotionCache.set(code, match || null);
  return match || null;
}

async function createPromotion(payload) {
  const { data } = await md.post("/promotions", payload);
  const created = data.promotion;
  if (created?.code) {
    promotionCache.set(created.code.toUpperCase(), created);
  }
  return created;
}

async function updatePromotion(id, code, payload) {
  const { data } = await md.post(`/promotions/${id}`, payload);
  const updated = data.promotion;
  if (updated?.code) {
    promotionCache.set(updated.code.toUpperCase(), updated);
  } else {
    promotionCache.set(code, null);
  }
  return updated;
}

async function* paginateSalesRules(pageSize = Number(process.env.PAGE_SIZE || 100)) {
  let page = 1;
  while (true) {
    const { data } = await mg.get("/salesRules/search", {
      params: {
        "searchCriteria[currentPage]": page,
        "searchCriteria[pageSize]": pageSize,
        "searchCriteria[filter_groups][0][filters][0][field]": "rule_id",
        "searchCriteria[filter_groups][0][filters][0][condition_type]": "gt",
        "searchCriteria[filter_groups][0][filters][0][value]": "0",
      },
    });

    const items = data.items || [];
    if (!items.length) {
      break;
    }

    yield items;

    if (items.length < pageSize) {
      break;
    }
    page++;
  }
}

async function processRule(rule) {
  const applicationMethod = mapApplicationMethod(rule);
  if (!applicationMethod) {
    console.warn(
      `⚠️  Skipping Magento rule ${rule.rule_id} (${rule.name}) – unsupported action ${rule.simple_action}`
    );
    return { created: 0, updated: 0, skipped: 1 };
  }

  const fallbackCode = `RULE-${rule.rule_id || Date.now()}`;
  const code = normalizeCode(rule.coupon_code, fallbackCode);
  const couponType = Number(rule.coupon_type ?? 0);
  const isAutomatic = couponType !== 1;
  const payload = {
    code,
    is_automatic: isAutomatic,
    type: PromotionType.STANDARD,
    status: Number(rule.is_active) === 1 ? PromotionStatus.ACTIVE : PromotionStatus.INACTIVE,
    application_method: {
      ...applicationMethod,
      max_quantity:
        applicationMethod.allocation === ApplicationMethodAllocation.EACH &&
        Number(rule.discount_qty || 0) > 0
          ? Number(rule.discount_qty)
          : undefined,
    },
    additional_data: {
      metadata: buildMetadata(rule),
    },
  };

  const existing = await fetchPromotionByCode(code);
  if (existing?.id) {
    await updatePromotion(existing.id, code, payload);
    console.log(`↺ Updated promotion ${code}`);
    return { created: 0, updated: 1, skipped: 0 };
  }

  await createPromotion(payload);
  console.log(`✔ Created promotion ${code}`);
  return { created: 1, updated: 0, skipped: 0 };
}

async function run() {
  console.log("🎯 Importing Magento promotions → Medusa");
  const limit = limiter();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for await (const chunk of paginateSalesRules()) {
    const tasks = chunk.map((rule) =>
      limit(() => processRule(rule))
    );
    const results = await Promise.all(tasks);
    for (const res of results) {
      created += res.created;
      updated += res.updated;
      skipped += res.skipped;
    }
  }

  console.log(
    `✅ Promotion sync complete. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`
  );
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = run;
