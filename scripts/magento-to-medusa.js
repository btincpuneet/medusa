#!/usr/bin/env node
"use strict";

const path = require("node:path");
const fs = require("node:fs");
const { parseArgs } = require("node:util");
const axios = require("axios");
const dotenv = require("dotenv");

// ────────────────────────────────────────────────────────────────────────────────
// Load environment variables (prefer .env.migration, fall back to .env)
// ────────────────────────────────────────────────────────────────────────────────
(() => {
  const searchPaths = [
    path.resolve(__dirname, "../.env.migration"),
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../../.env.migration"),
    path.resolve(__dirname, "../../.env"),
  ];
  let loaded = false;
  for (const envPath of searchPaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      loaded = true;
      break;
    }
  }
  if (!loaded) {
    dotenv.config();
  }
})();

// ────────────────────────────────────────────────────────────────────────────────
// CLI arguments
// ────────────────────────────────────────────────────────────────────────────────
const {
  values: {
    resources: resourcesFilter,
    dryRun = false,
    concurrency: concurrencyFlag,
    verbose = false,
    "currency-code": currencyFlag,
  },
} = parseArgs({
  options: {
    resources: { type: "string", short: "r" },
    dryRun: { type: "boolean", short: "d", default: false },
    concurrency: { type: "string", short: "c" },
    verbose: { type: "boolean", short: "v", default: false },
    "currency-code": { type: "string" },
  },
});

const targetResources = new Set(
  (resourcesFilter || "categories,products,customers")
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean)
);

const concurrency = Math.max(1, Number.parseInt(concurrencyFlag || "4", 10) || 4);

// ────────────────────────────────────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────────────────────────────────────
function sanitizeToken(token) {
  return token ? token.trim().replace(/^['"]|['"]$/g, "") : token;
}

function resolveMagentoBaseUrl() {
  const rawBase =
    process.env.MAGENTO_BASE_URL ||
    process.env.MAGENTO_REST_BASE_URL ||
    "http://localhost";

  const trimmed = rawBase.trim().replace(/\/+$/, "");
  const restMatch = trimmed.match(/(.*)\/rest\/?v?\d*$/i);
  if (restMatch && restMatch[1]) {
    return restMatch[1].replace(/\/+$/, "");
  }
  return trimmed;
}

const config = {
  magentoBaseUrl: resolveMagentoBaseUrl(),
  magentoToken: sanitizeToken(
    process.env.MAGENTO_ADMIN_TOKEN || process.env.MAGENTO_TOKEN || process.env.MAGENTO_ACCESS_TOKEN
  ),
  medusaBaseUrl: (process.env.MEDUSA_BASE_URL || "http://localhost:9000").replace(/\/$/, ""),
  medusaToken: sanitizeToken(process.env.MEDUSA_ADMIN_TOKEN || process.env.MEDUSA_TOKEN),
  mediaBaseUrl: (process.env.MAGENTO_MEDIA_BASE_URL || `${resolveMagentoBaseUrl()}/media/catalog/product`).replace(/\/$/, ""),
  defaultCurrency: (currencyFlag || process.env.MAGENTO_DEFAULT_CURRENCY || process.env.DEFAULT_CURRENCY || "USD").toUpperCase(),
  defaultSalesChannel: process.env.MEDUSA_SALES_CHANNEL_ID || null,
};

if (!config.magentoToken) {
  console.error("❌ Missing Magento token. Set MAGENTO_TOKEN or MAGENTO_ADMIN_TOKEN in your environment.");
  process.exit(1);
}

if (!config.medusaToken) {
  console.error("❌ Missing Medusa admin token. Set MEDUSA_ADMIN_TOKEN (or MEDUSA_TOKEN) in your environment.");
  process.exit(1);
}

// ────────────────────────────────────────────────────────────────────────────────
// HTTP clients
// ────────────────────────────────────────────────────────────────────────────────
const magentoClient = axios.create({
  baseURL: `${config.magentoBaseUrl}/rest/V1`,
  timeout: 30000,
  headers: {
    Authorization: `Bearer ${config.magentoToken}`,
    "Content-Type": "application/json",
  },
});

const medusaClient = axios.create({
  baseURL: `${config.medusaBaseUrl}/admin`,
  timeout: 30000,
  headers: {
    Authorization: `Bearer ${config.medusaToken}`,
    "Content-Type": "application/json",
  },
});

magentoClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;
    console.error(`Magento API error: ${message}`);
    throw error;
  }
);

medusaClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;
    console.error(`Medusa API error: ${message}`);
    if (verbose && error.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
);

// ────────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function slugify(value, fallback) {
  if (!value || typeof value !== "string") {
    value = fallback || "item";
  }
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    || (fallback ? slugify(fallback) : "item");
}

function toAttrMap(customAttributes = []) {
  const map = new Map();
  for (const attr of customAttributes) {
    if (attr && attr.attribute_code) {
      map.set(attr.attribute_code, attr.value);
    }
  }
  return map;
}

function toCents(amount) {
  const parsed = Number.parseFloat(`${amount}`.replace(/,/g, ""));
  if (Number.isFinite(parsed)) {
    return Math.round(parsed * 100);
  }
  return 0;
}

function asBoolean(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  const normalized = `${value}`.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function cleanHtml(value) {
  if (typeof value !== "string") return value || "";
  return value.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").trim();
}

function uniqueArray(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function withBackoff(fn, label = "request") {
  const maxAttempts = 5;
  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      return await fn();
    } catch (error) {
      const status = error.response?.status;
      if (status === 429 && attempt < maxAttempts) {
        const delay = 1000 * attempt;
        console.warn(`⏳ ${label} hit rate limit (attempt ${attempt}), retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
}

function logVerbose(message) {
  if (verbose) {
    console.log(message);
  }
}

async function runWithConcurrency(items, limit, iterator) {
  if (!Array.isArray(items) || !items.length) {
    return;
  }
  const concurrencyLimit = Math.max(1, limit || 1);
  const executing = new Set();
  let index = 0;

  while (index < items.length) {
    while (executing.size >= concurrencyLimit) {
      await Promise.race(executing);
    }

    const currentIndex = index++;
    const promise = (async () => {
      try {
        await iterator(items[currentIndex], currentIndex);
      } finally {
        executing.delete(promise);
      }
    })();

    executing.add(promise);
  }

  await Promise.allSettled(executing);
}

// ────────────────────────────────────────────────────────────────────────────────
// Magento API wrapper
// ────────────────────────────────────────────────────────────────────────────────
class MagentoApi {
  constructor(client) {
    this.client = client;
    this.pageSize = 100;
  }

  async fetchPaged(path, params = {}) {
    const items = [];
    let currentPage = 1;
    while (true) {
      const query = {
        "searchCriteria[pageSize]": this.pageSize,
        "searchCriteria[currentPage]": currentPage,
        ...params,
      };
      const { data } = await withBackoff(() => this.client.get(path, { params: query }), `magento:${path}`);
      const chunk = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
      if (!chunk.length) break;
      items.push(...chunk);
      currentPage += 1;
    }
    return items;
  }

  async getCategories() {
    const { data } = await withBackoff(
      () => this.client.get("categories/list", {
        params: { "searchCriteria[pageSize]": this.pageSize, "searchCriteria[currentPage]": 1 },
      }),
      "magento:categories"
    );
    return Array.isArray(data.items) ? data.items : [];
  }

  async getProducts() {
    return this.fetchPaged("products");
  }

  async getProductBySku(sku) {
    const encoded = encodeURIComponent(sku);
    const { data } = await withBackoff(() => this.client.get(`products/${encoded}`), `magento:product:${sku}`);
    return data;
  }

  async getConfigurableChildren(sku) {
    const encoded = encodeURIComponent(sku);
    const { data } = await withBackoff(
      () => this.client.get(`configurable-products/${encoded}/children`),
      `magento:configurable-children:${sku}`
    );
    return Array.isArray(data) ? data : [];
  }

  async getCustomers() {
    return this.fetchPaged("customers/search");
  }

  async getStockItem(sku) {
    try {
      const encoded = encodeURIComponent(sku);
      const { data } = await withBackoff(
        () => this.client.get(`stockItems/${encoded}`),
        `magento:stock:${sku}`
      );
      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Medusa API wrapper
// ────────────────────────────────────────────────────────────────────────────────
class MedusaApi {
  constructor(client, options = {}) {
    this.client = client;
    this.dryRun = options.dryRun || false;
  }

  async findCategoryByHandle(handle) {
    const { data } = await withBackoff(
      () => this.client.get("/product-categories", { params: { handle, limit: 1 } }),
      `medusa:category:${handle}`
    );
    return data.product_categories?.[0] || null;
  }

  async createCategory(payload) {
    if (this.dryRun) {
      console.log(`📝 [dry-run] Would create category '${payload.name}'`);
      return { id: `dry-${slugify(payload.handle || payload.name)}` };
    }
    const { data } = await withBackoff(() => this.client.post("/product-categories", payload), "medusa:create-category");
    return data.product_category;
  }

  async findProductByExternalOrHandle(externalId, handle) {
    if (externalId) {
      const { data } = await withBackoff(
        () => this.client.get("/products", { params: { external_id: externalId, limit: 1 } }),
        `medusa:product-external:${externalId}`
      );
      if (data.products?.length) {
        return data.products[0];
      }
    }
    if (handle) {
      const { data } = await withBackoff(
        () => this.client.get("/products", { params: { handle, limit: 1 } }),
        `medusa:product-handle:${handle}`
      );
      if (data.products?.length) {
        return data.products[0];
      }
    }
    return null;
  }

  async createProduct(payload) {
    if (this.dryRun) {
      console.log(`📝 [dry-run] Would create product '${payload.title}' (${payload.handle || payload.external_id})`);
      return { id: `dry-${payload.handle || payload.external_id}` };
    }
    const { data } = await withBackoff(() => this.client.post("/products", payload), "medusa:create-product");
    return data.product;
  }

  async findCustomerByEmail(email) {
    const { data } = await withBackoff(
      () => this.client.get("/customers", { params: { email, limit: 1 } }),
      `medusa:customer:${email}`
    );
    return data.customers?.[0] || null;
  }

  async createCustomer(payload) {
    if (this.dryRun) {
      console.log(`📝 [dry-run] Would create customer '${payload.email}'`);
      return { id: `dry-${payload.email}` };
    }
    const { data } = await withBackoff(() => this.client.post("/customers", payload), "medusa:create-customer");
    return data.customer;
  }

  async createCustomerAddress(customerId, payload) {
    if (this.dryRun) {
      console.log(`📝 [dry-run] Would create address for customer '${customerId}'`);
      return;
    }
    await withBackoff(
      () => this.client.post(`/customers/${customerId}/addresses`, payload),
      "medusa:create-customer-address"
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Migration logic
// ────────────────────────────────────────────────────────────────────────────────
const magento = new MagentoApi(magentoClient);
const medusa = new MedusaApi(medusaClient, { dryRun });

const stats = {
  categories: { created: 0, reused: 0, failed: 0 },
  products: { created: 0, skipped: 0, failed: 0 },
  customers: { created: 0, skipped: 0, failed: 0 },
};

const categoryIdMap = new Map();

async function migrateCategories() {
  console.log("\n===== Migrating categories =====");
  const categories = await magento.getCategories();
  if (!categories.length) {
    console.log("No categories returned by Magento");
    return;
  }

  categories.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    if (a.position !== b.position) return (a.position || 0) - (b.position || 0);
    return a.id - b.id;
  });

  for (const category of categories) {
    if (category.id === 1) {
      categoryIdMap.set(category.id, null);
      continue;
    }

    const attrMap = toAttrMap(category.custom_attributes);
    const handle = slugify(attrMap.get("url_key") || category.name, category.name);
    const description = cleanHtml(attrMap.get("description"));
    const parentId = category.parent_id > 1 ? categoryIdMap.get(category.parent_id) : null;

    let medusaCategory = null;
    try {
      medusaCategory = await medusa.findCategoryByHandle(handle);
      if (medusaCategory) {
        stats.categories.reused += 1;
        logVerbose(`↺ Reusing category '${category.name}'`);
      } else {
        const payload = {
          name: category.name,
          handle,
          description: description || undefined,
          is_active: asBoolean(category.is_active ?? category.is_active ?? 1),
          parent_category_id: parentId || null,
          metadata: {
            magento_id: category.id,
            magento_parent_id: category.parent_id,
            magento_path: category.path,
            magento_level: category.level,
          },
        };
        medusaCategory = await medusa.createCategory(payload);
        stats.categories.created += 1;
        console.log(`✔ Created category '${category.name}'`);
      }
      categoryIdMap.set(category.id, medusaCategory?.id || null);
    } catch (error) {
      stats.categories.failed += 1;
      console.error(`✖ Failed to sync category '${category.name}': ${error.message}`);
      if (verbose && error.response?.data) {
        console.error(JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

function buildSimpleOption() {
  return [
    {
      title: "Default",
      values: ["Default"],
    },
  ];
}

function buildVariantOptionValues(optionDefs, variant) {
  const attrMap = toAttrMap(variant.custom_attributes);
  const options = {};
  for (const opt of optionDefs) {
    const code = opt.code || slugify(opt.title, "option");
    const raw = attrMap.get(code);
    if (raw) {
      options[opt.title] = String(raw);
    } else if (opt.values?.length) {
      options[opt.title] = String(opt.values[0]);
    } else {
      options[opt.title] = "Default";
    }
  }
  return options;
}

function resolveVariantTitle(baseTitle, variant, index) {
  const parts = [];
  const attrMap = toAttrMap(variant.custom_attributes);
  const displayKeys = ["size", "color", "colour", "material", "style"];
  for (const key of displayKeys) {
    const value = attrMap.get(key);
    if (value) parts.push(String(value));
  }
  if (!parts.length) {
    const name = variant.name || attrMap.get("name");
    if (name && name !== baseTitle) {
      parts.push(String(name));
    }
  }
  if (!parts.length) {
    parts.push(`Variant ${index + 1}`);
  }
  return `${baseTitle} - ${parts.join(" / ")}`;
}

async function buildVariants(product) {
  if (product.type_id === "configurable") {
    const children = await magento.getConfigurableChildren(product.sku);
    const optionDefsWithCode = product.extension_attributes?.configurable_product_options?.map((opt) => ({
      title: opt.label || opt.attribute_code || "Option",
      code: opt.attribute_code,
      values: [],
    })) || [];

    if (!children.length) {
      logVerbose(`⚠️ Configurable product ${product.sku} has no child variants; falling back to single variant.`);
      return buildVariants({ ...product, type_id: "simple" });
    }

    const variants = [];
    children.forEach((child, index) => {
      const attrMap = toAttrMap(child.custom_attributes);
      const priceSource = attrMap.get("special_price") || child.price || product.price;
      const stock = child.extension_attributes?.stock_item?.qty;
      const stockItem = child.extension_attributes?.stock_item;
      const backorders = asBoolean(stockItem?.backorders);

      const optionValues = optionDefsWithCode.length
        ? buildVariantOptionValues(optionDefsWithCode, child)
        : { Default: "Default" };

      const variant = {
        title: resolveVariantTitle(product.name, child, index),
        sku: child.sku,
        manage_inventory: true,
        allow_backorder: backorders,
        prices: [
          {
            currency_code: config.defaultCurrency.toLowerCase(),
            amount: toCents(priceSource || 0),
          },
        ],
        metadata: {
          magento_id: child.id,
          magento_parent_id: product.id,
          magento_parent_sku: product.sku,
        },
        options: optionValues,
      };

      if (Number.isFinite(Number(stock))) {
        variant.metadata.magento_stock = Number(stock);
      }

      variants.push(variant);
    });

    const productOptions = optionDefsWithCode.length
      ? optionDefsWithCode.map((opt) => ({
          title: opt.title,
          values: uniqueArray(children.map((child) => {
            const map = toAttrMap(child.custom_attributes);
            return map.get(opt.code);
          })),
        }))
      : buildSimpleOption();

    return { variants, options: productOptions };
  }

  const attrMap = toAttrMap(product.custom_attributes);
  const stockItem = product.extension_attributes?.stock_item || null;
  const priceSource = attrMap.get("special_price") || product.price;

  const variant = {
    title: product.name,
    sku: product.sku,
    manage_inventory: true,
    allow_backorder: asBoolean(stockItem?.backorders),
    prices: [
      {
        currency_code: config.defaultCurrency.toLowerCase(),
        amount: toCents(priceSource || 0),
      },
    ],
    metadata: {
      magento_id: product.id,
      magento_parent_id: null,
    },
    options: { Default: "Default" },
  };

  if (Number.isFinite(Number(stockItem?.qty))) {
    variant.metadata.magento_stock = Number(stockItem.qty);
  }

  return { variants: [variant], options: buildSimpleOption() };
}

function buildMedia(product) {
  const entries = product.media_gallery_entries || [];
  const images = [];
  for (const entry of entries) {
    if (entry.media_type !== "image" || !entry.file) continue;
    const url = `${config.mediaBaseUrl}${entry.file.startsWith("/") ? "" : "/"}${entry.file}`;
    images.push({ url });
  }
  return uniqueArray(images.map((img) => img.url)).map((url) => ({ url }));
}

function resolveThumbnail(product, images) {
  const attrMap = toAttrMap(product.custom_attributes);
  const thumb = attrMap.get("thumbnail") || attrMap.get("image");
  if (thumb) {
    return `${config.mediaBaseUrl}${thumb.startsWith("/") ? "" : "/"}${thumb}`;
  }
  return images[0]?.url || null;
}

async function migrateProducts() {
  console.log("\n===== Migrating products =====");
  const products = await magento.getProducts();
  if (!products.length) {
    console.log("No products returned by Magento");
    return;
  }

  let processed = 0;
  await runWithConcurrency(products, concurrency, async (product) => {
    const position = ++processed;
    if (!["simple", "configurable"].includes(product.type_id)) {
      stats.products.skipped += 1;
      logVerbose(`⏭ Skipping product ${product.sku} of type ${product.type_id}`);
      return;
    }

    const attrMap = toAttrMap(product.custom_attributes);
    const handle = slugify(attrMap.get("url_key") || product.sku, product.sku);

    try {
      const existing = await medusa.findProductByExternalOrHandle(String(product.id), handle);
      if (existing) {
        stats.products.skipped += 1;
        logVerbose(`↺ Product already exists in Medusa (${product.sku})`);
        return;
      }

      const { variants, options } = await buildVariants(product);
      const description = cleanHtml(attrMap.get("description"));
      const subtitle = cleanHtml(attrMap.get("short_description"));
      const images = buildMedia(product);
      const thumbnail = resolveThumbnail(product, images);
      const categoryLinks = product.extension_attributes?.category_links || [];
      const categories = categoryLinks
        .map((link) => categoryIdMap.get(Number(link.category_id)))
        .filter(Boolean)
        .map((id) => ({ id }));

      const productOptions = options.length ? options : buildSimpleOption();
      const normalizedOptions = productOptions.map((opt) => ({
        title: opt.title,
        values: uniqueArray(opt.values || ["Default"]),
      }));

      for (const variant of variants) {
        if (!variant.options) {
          variant.options = { Default: "Default" };
        }
        for (const option of normalizedOptions) {
          if (!(option.title in variant.options)) {
            variant.options[option.title] = option.values[0] || "Default";
          }
        }
      }

      const payload = {
        title: product.name,
        handle,
        description: description || null,
        subtitle: subtitle || null,
        status: product.status === 1 ? "published" : "draft",
        images: images.length ? images : undefined,
        thumbnail: thumbnail || undefined,
        external_id: String(product.id),
        metadata: {
          magento_id: product.id,
          magento_sku: product.sku,
          magento_type: product.type_id,
          magento_updated_at: product.updated_at,
        },
        options: normalizedOptions,
        variants,
      };

      if (categories.length) {
        payload.categories = categories;
      }

      if (config.defaultSalesChannel) {
        payload.sales_channels = [{ id: config.defaultSalesChannel }];
      }

      await medusa.createProduct(payload);
      stats.products.created += 1;
      console.log(`✔ Created product '${product.sku}' (${position}/${products.length})`);
    } catch (error) {
      stats.products.failed += 1;
      console.error(`✖ Failed to sync product '${product.sku}': ${error.message}`);
      if (verbose && error.response?.data) {
        console.error(JSON.stringify(error.response.data, null, 2));
      }
    }
  });
}

function mapAddress(address) {
  const street = Array.isArray(address.street) ? address.street : [address.street].filter(Boolean);
  return {
    address_name: address.firstname || address.lastname ? `${address.firstname || ""} ${address.lastname || ""}`.trim() || null : null,
    is_default_shipping: Boolean(address.default_shipping),
    is_default_billing: Boolean(address.default_billing),
    first_name: address.firstname || null,
    last_name: address.lastname || null,
    company: address.company || null,
    address_1: street[0] || null,
    address_2: street[1] || null,
    city: address.city || null,
    country_code: address.country_id ? String(address.country_id).toLowerCase() : null,
    province: address.region?.region || address.region?.region_code || null,
    postal_code: address.postcode || null,
    phone: address.telephone || null,
    metadata: {
      magento_id: address.id,
    },
  };
}

async function migrateCustomers() {
  console.log("\n===== Migrating customers =====");
  const customers = await magento.getCustomers();
  if (!customers.length) {
    console.log("No customers returned by Magento");
    return;
  }

  let processed = 0;
  await runWithConcurrency(customers, concurrency, async (customer) => {
    const position = ++processed;
    try {
      const existing = await medusa.findCustomerByEmail(customer.email);
      if (existing) {
        stats.customers.skipped += 1;
        logVerbose(`↺ Customer already exists (${customer.email})`);
        return;
      }

      const primaryAddress = Array.isArray(customer.addresses) ? customer.addresses[0] : null;

      const payload = {
        email: customer.email,
        first_name: customer.firstname || null,
        last_name: customer.lastname || null,
        phone: customer.telephone || primaryAddress?.telephone || null,
        company_name: primaryAddress?.company || null,
        metadata: {
          magento_id: customer.id,
          magento_group_id: customer.group_id,
        },
      };

      const medusaCustomer = await medusa.createCustomer(payload);
      stats.customers.created += 1;
      console.log(`✔ Created customer '${customer.email}' (${position}/${customers.length})`);

      const addresses = Array.isArray(customer.addresses) ? customer.addresses : [];
      for (const address of addresses) {
        const addressPayload = mapAddress(address);
        await medusa.createCustomerAddress(medusaCustomer.id, addressPayload);
      }
    } catch (error) {
      stats.customers.failed += 1;
      console.error(`✖ Failed to sync customer '${customer.email}': ${error.message}`);
      if (verbose && error.response?.data) {
        console.error(JSON.stringify(error.response.data, null, 2));
      }
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// Main entry
// ────────────────────────────────────────────────────────────────────────────────
(async () => {
  console.log("Magento → Medusa migration");
  console.log(`Magento base URL: ${config.magentoBaseUrl}`);
  console.log(`Medusa base URL:  ${config.medusaBaseUrl}`);
  console.log(`Dry-run:          ${dryRun ? "yes" : "no"}`);
  console.log(`Resources:        ${Array.from(targetResources).join(", ")}`);
  console.log(`Currency:         ${config.defaultCurrency}`);

  try {
    if (targetResources.has("categories")) {
      await migrateCategories();
    }

    if (targetResources.has("products")) {
      await migrateProducts();
    }

    if (targetResources.has("customers")) {
      await migrateCustomers();
    }

    console.log("\n===== Migration summary =====");
    console.log(`Categories: created ${stats.categories.created}, reused ${stats.categories.reused}, failed ${stats.categories.failed}`);
    console.log(`Products:   created ${stats.products.created}, skipped ${stats.products.skipped}, failed ${stats.products.failed}`);
    console.log(`Customers:  created ${stats.customers.created}, skipped ${stats.customers.skipped}, failed ${stats.customers.failed}`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  }
})();
