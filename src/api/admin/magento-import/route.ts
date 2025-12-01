import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

// Define types based on your Magento response
interface MagentoProduct {
  id: number;
  sku: string;
  name: string;
  attribute_set_id: number;
  price: number;
  status: number;
  visibility: number;
  type_id: string;
  created_at: string;
  updated_at: string;
  extension_attributes: {
    website_ids: number[];
    category_links: Array<{
      position: number;
      category_id: string; // Magento category ID
    }>;
    floor_special_price: string;
    featured_product: string;
    bestsellers_product: string;
    top_rated_product: string;
    on_sale_product: string;
  };
  product_links: any[];
  options: any[];
  media_gallery_entries: Array<{
    id: number;
    media_type: string;
    label: string | null;
    position: number;
    disabled: boolean;
    types: string[];
    file: string;
  }>;
  tier_prices: any[];
  custom_attributes: Array<{
    attribute_code: string;
    value: any;
  }>;
}

interface MagentoResponse {
  items: MagentoProduct[];
  search_criteria: any;
  total_count: number;
}

interface ImportResults {
  processed: number;
  sellers: number;
  products: number;

  // kept for compatibility, but not used now (no variants table)
  variants: number;

  attributes: number;
  attributeValues: number;
  listings: number;

  // new counters
  galleries: number;
  categories: number;
  productCategories: number;

  errors: string[];
  skipped: number;
  warnings: string[];
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🚀 Starting Magento product import...");

    await client.connect();

    const magentoResponse = await fetchMagentoProducts();
    console.log(
      `📦 Received ${magentoResponse.items?.length || 0} products from Magento`
    );

    if (!magentoResponse.items || !Array.isArray(magentoResponse.items)) {
      return res.status(400).json({
        success: false,
        message: "Invalid response from Magento API - no items array",
      });
    }

    if (magentoResponse.items.length === 0) {
      return res.json({
        success: true,
        message: "No products found to import",
        details: {
          processed: 0,
          total_received: 0,
        },
      });
    }

    const result = await processAndInsertProducts(client, magentoResponse.items);

    console.log("✅ Import completed!");
    console.log(`📊 Results: ${result.processed} processed, ${result.errors.length} errors`);

    return res.json({
      success: true,
      message: `Processed ${result.processed} products successfully`,
      total_received: magentoResponse.items.length,
      details: result,
    });
  } catch (error: any) {
    console.error("❌ Error importing products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to import products",
      error: error.message,
    });
  } finally {
    await client.end().catch(console.error);
  }
}

// Function to call Magento API
async function fetchMagentoProducts(): Promise<MagentoResponse> {
  const magentoUrl =
    "http://local.b2c.com/rest/V1/products?searchCriteria[filter_groups][0][filters][1][field]=status&searchCriteria[filter_groups][0][filters][1][value]=1&company_code=1140&accessId=6";

  console.log(`🌐 Fetching products from Magento: ${magentoUrl}`);

  const response = await fetch(magentoUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Magento API responded with status: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Successfully fetched ${data.items?.length || 0} products`);

  return data;
}

// Main processing function
async function processAndInsertProducts(
  client: Client,
  magentoProducts: MagentoProduct[]
): Promise<ImportResults> {
  const results: ImportResults = {
    processed: 0,
    sellers: 0,
    products: 0,
    variants: 0, // not used now
    attributes: 0,
    attributeValues: 0,
    listings: 0,
    galleries: 0,
    categories: 0,
    productCategories: 0,
    errors: [],
    skipped: 0,
    warnings: [],
  };

  // First, ensure we have the default seller
  let defaultSellerId: number;
  try {
    defaultSellerId = await ensureDefaultSeller(client);
    results.sellers++;
    console.log(`🏪 Default seller ID: ${defaultSellerId}`);
  } catch (error: any) {
    console.error("❌ Error ensuring default seller:", error);
    results.errors.push(`Default seller error: ${error.message}`);
    return results;
  }

  // Process products in batches to avoid memory issues
  const batchSize = 10;
  for (let i = 0; i < magentoProducts.length; i += batchSize) {
    const batch = magentoProducts.slice(i, i + batchSize);
    console.log(
      `🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        magentoProducts.length / batchSize
      )}`
    );

    for (const magentoProduct of batch) {
      try {
        console.log(`📝 Processing product: ${magentoProduct.sku}`);

        // Validate required fields
        if (!magentoProduct.sku || !magentoProduct.name) {
          results.warnings.push(
            `Skipping product with missing SKU or name: ${magentoProduct.sku}`
          );
          results.skipped++;
          continue;
        }

        await processSingleProduct(
          client,
          magentoProduct,
          results,
          defaultSellerId
        );
        results.processed++;

        console.log(`✅ Successfully processed: ${magentoProduct.sku}`);
      } catch (error: any) {
        const errorMsg = `Error processing product ${magentoProduct.sku}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }
  }

  return results;
}

// Ensure default seller exists
async function ensureDefaultSeller(client: Client): Promise<number> {
  const email = "default@example.com";

  // Check if seller already exists
  const existingSeller = await client.query(
    `SELECT id FROM mp_sellers WHERE email = $1`,
    [email]
  );

  if (existingSeller.rows.length > 0) {
    return existingSeller.rows[0].id;
  }

  // IMPORTANT: password is NOT NULL in schema, so set a dummy value
  const defaultPassword = "default_password_change_me";

  const result = await client.query(
    `INSERT INTO mp_sellers (name, email, password, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     RETURNING id`,
    ["Default Seller", email, defaultPassword]
  );

  return result.rows[0].id;
}

// Process a single product
async function processSingleProduct(
  client: Client,
  magentoProduct: MagentoProduct,
  results: ImportResults,
  defaultSellerId: number
) {
  // Insert or update main product
  const productId = await upsertProduct(client, magentoProduct);
  results.products++;

  // Process attributes (product-level)
  await processAttributes(client, magentoProduct, productId, results);

  // Process product gallery images
  await processGallery(client, magentoProduct, productId, results);

  // Process categories and product_categories
  await processCategories(client, magentoProduct, productId, results);

  // Create/Update product listing (seller offer)
  await upsertProductListing(client, productId, defaultSellerId, magentoProduct);
  results.listings++;
}

// Upsert product (catalog level - no seller_id)
async function upsertProduct(
  client: Client,
  magentoProduct: MagentoProduct
): Promise<number> {
  const shortDesc =
    magentoProduct.custom_attributes?.find(
      (attr) => attr.attribute_code === "short_description"
    )?.value || null;

  const longDesc =
    magentoProduct.custom_attributes?.find(
      (attr) => attr.attribute_code === "description"
    )?.value || null;

  // First try to find existing product
  const existingProduct = await client.query(
    `SELECT id FROM mp_products WHERE product_code = $1`,
    [magentoProduct.sku]
  );

  if (existingProduct.rows.length > 0) {
    // Update existing product
    await client.query(
      `UPDATE mp_products 
       SET name = $1, short_desc = $2, long_desc = $3, base_price = $4, status = $5, updated_at = NOW()
       WHERE product_code = $6`,
      [
        magentoProduct.name,
        shortDesc,
        longDesc,
        magentoProduct.price || 0,
        magentoProduct.status === 1 ? "active" : "inactive",
        magentoProduct.sku,
      ]
    );
    return existingProduct.rows[0].id;
  } else {
    // Insert new product
    const result = await client.query(
      `INSERT INTO mp_products (product_code, name, short_desc, long_desc, base_price, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id`,
      [
        magentoProduct.sku,
        magentoProduct.name,
        shortDesc,
        longDesc,
        magentoProduct.price || 0,
        magentoProduct.status === 1 ? "active" : "inactive",
      ]
    );
    return result.rows[0].id;
  }
}

/**
 * Process attributes and attribute values at PRODUCT level
 * product_attributes table is used instead of variant mapping
 */
async function processAttributes(
  client: Client,
  magentoProduct: MagentoProduct,
  productId: number,
  results: ImportResults
) {
  if (!magentoProduct.custom_attributes) {
    return;
  }

  console.log(
    `    Processing ${magentoProduct.custom_attributes.length} attributes for ${magentoProduct.sku}`
  );

  for (const customAttr of magentoProduct.custom_attributes) {
    // Skip if value is null / undefined / empty
    if (
      customAttr.value === null ||
      customAttr.value === undefined ||
      customAttr.value === ""
    ) {
      continue;
    }

    // Skip system attributes we don't want to store
    const skipAttributes = [
      "description",
      "short_description",
      "meta_title",
      "meta_keyword",
      "meta_description",
      "category_ids",
      "options_container",
      "required_options",
      "has_options",
      "url_key",
      "url_path",
    ];

    if (skipAttributes.includes(customAttr.attribute_code)) {
      continue;
    }

    try {
      // Insert or get attribute
      const attributeId = await upsertAttribute(
        client,
        customAttr.attribute_code
      );
      results.attributes++;

      // Insert or get attribute value
      const attributeValueId = await upsertAttributeValue(
        client,
        attributeId,
        customAttr.value,
        customAttr.attribute_code
      );
      results.attributeValues++;

      // Link attribute to PRODUCT (not variant)
      await upsertProductAttribute(
        client,
        productId,
        attributeId,
        attributeValueId
      );
    } catch (attrError: any) {
      console.error(
        `    ❌ Error processing attribute ${customAttr.attribute_code}:`,
        attrError.message
      );
      // Don't throw - continue with other attributes
    }
  }
}

// Upsert attribute
async function upsertAttribute(
  client: Client,
  attributeCode: string
): Promise<number> {
  const attributeLabel = attributeCode
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // First try to find existing attribute
  const existingAttribute = await client.query(
    `SELECT id FROM mp_attributes WHERE attribute_code = $1`,
    [attributeCode]
  );

  if (existingAttribute.rows.length > 0) {
    // Update existing attribute
    await client.query(
      `UPDATE mp_attributes SET label = $1, updated_at = NOW() WHERE attribute_code = $2`,
      [attributeLabel, attributeCode]
    );
    return existingAttribute.rows[0].id;
  } else {
    // Insert new attribute
    const result = await client.query(
      `INSERT INTO mp_attributes (attribute_code, label, attribute_type, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id`,
      [attributeCode, attributeLabel, "text"]
    );
    return result.rows[0].id;
  }
}

// Upsert attribute value
async function upsertAttributeValue(
  client: Client,
  attributeId: number,
  value: any,
  attributeCode: string
): Promise<number> {
  // Handle different value types
  let processedValue: string = value;
  let meta: any = null;

  if (Array.isArray(value)) {
    processedValue = value.join(",");
    meta = { original_type: "array", values: value };
  } else if (typeof value === "object" && value !== null) {
    processedValue = JSON.stringify(value);
    meta = { original_type: "object" };
  } else {
    processedValue = String(value);
  }

  // Truncate if too long for VARCHAR(255)
  if (processedValue.length > 255) {
    processedValue = processedValue.substring(0, 255);
  }

  // First try to find existing attribute value
  const existingValue = await client.query(
    `SELECT id FROM mp_attribute_values WHERE attribute_id = $1 AND value = $2`,
    [attributeId, processedValue]
  );

  if (existingValue.rows.length > 0) {
    return existingValue.rows[0].id;
  } else {
    // Insert new attribute value
    const result = await client.query(
      `INSERT INTO mp_attribute_values (attribute_id, value, meta, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id`,
      [attributeId, processedValue, meta ? JSON.stringify(meta) : null]
    );
    return result.rows[0].id;
  }
}

// Upsert product attribute link (product_attributes)
async function upsertProductAttribute(
  client: Client,
  productId: number,
  attributeId: number,
  attributeValueId: number
) {
  // First check if the link already exists
  const existingLink = await client.query(
    `SELECT id FROM mp_product_attributes 
     WHERE product_id = $1 AND attribute_id = $2 AND attribute_value_id = $3`,
    [productId, attributeId, attributeValueId]
  );

  if (existingLink.rows.length === 0) {
    // Insert new link
    await client.query(
      `INSERT INTO mp_product_attributes (product_id, attribute_id, attribute_value_id)
       VALUES ($1, $2, $3)`,
      [productId, attributeId, attributeValueId]
    );
  }
}

/**
 * Process product gallery images -> product_gallery
 */
async function processGallery(
  client: Client,
  magentoProduct: MagentoProduct,
  productId: number,
  results: ImportResults
) {
  const entries = magentoProduct.media_gallery_entries || [];
  if (!entries.length) {
    return;
  }

  console.log(
    `    Processing ${entries.length} gallery images for ${magentoProduct.sku}`
  );

  for (const entry of entries) {
    try {
      await upsertProductGallery(client, productId, entry);
      results.galleries++;
    } catch (err: any) {
      console.error(
        `    ❌ Error processing gallery image for ${magentoProduct.sku}:`,
        err.message
      );
    }
  }
}

function mapMagentoImageType(entry: MagentoProduct["media_gallery_entries"][0]) {
  const types = entry.types || [];

  if (types.includes("image")) {
    return "main";
  }

  if (types.includes("small_image") || types.includes("thumbnail")) {
    return "thumbnail";
  }

  // Could be swatch_image or others – treat as gallery
  return "gallery";
}

// Upsert into product_gallery
async function upsertProductGallery(
  client: Client,
  productId: number,
  entry: MagentoProduct["media_gallery_entries"][0]
) {
  const imageType = mapMagentoImageType(entry);
  const imagePath = entry.file; // e.g. "/m/y/my-image.jpg"

  // Check if image already exists for this product
  const existing = await client.query(
    `SELECT id FROM mp_product_gallery WHERE product_id = $1 AND image = $2`,
    [productId, imagePath]
  );

  if (existing.rows.length > 0) {
    // Update label / type if needed
    await client.query(
      `UPDATE mp_product_gallery
       SET image_type = $1, label = $2, updated_at = NOW()
       WHERE id = $3`,
      [imageType, entry.label, existing.rows[0].id]
    );
  } else {
    await client.query(
      `INSERT INTO mp_product_gallery (product_id, image_type, label, image, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [productId, imageType, entry.label, imagePath]
    );
  }
}

/**
 * Process categories & product_categories
 */
// async function processCategories(
//   client: Client,
//   magentoProduct: MagentoProduct,
//   productId: number,
//   results: ImportResults
// ) {
//   const categoryLinks = magentoProduct.extension_attributes?.category_links || [];
//   if (!categoryLinks.length) {
//     return;
//   }

//   console.log(
//     `    Processing ${categoryLinks.length} categories for ${magentoProduct.sku}`
//   );

//   for (const link of categoryLinks) {
//     const magentoCategoryId = link.category_id;
//     if (!magentoCategoryId) continue;

//     try {
//       const categoryId = await upsertCategory(client, magentoCategoryId);
//       results.categories++;

//       await upsertProductCategory(client, productId, categoryId);
//       results.productCategories++;
//     } catch (err: any) {
//       console.error(
//         `    ❌ Error processing category ${link.category_id} for ${magentoProduct.sku}:`,
//         err.message
//       );
//     }
//   }
// }

// Upsert into category table
// async function upsertCategory(
//   client: Client,
//   magentoCategoryId: string
// ): Promise<number> {
//   // Simple mapping – you can later replace with real Magento category data
//   const name = `Magento Category ${magentoCategoryId}`;
//   const urlSlug = `magento-category-${magentoCategoryId}`;

//   // Check by url (unique) or name
//   const existing = await client.query(
//     `SELECT id FROM category WHERE url = $1 OR name = $2`,
//     [urlSlug, name]
//   );

//   if (existing.rows.length > 0) {
//     return existing.rows[0].id;
//   }

//   const result = await client.query(
//     `INSERT INTO category (name, url, description, status, created_at, updated_at)
//      VALUES ($1, $2, $3, TRUE, NOW(), NOW())
//      RETURNING id`,
//     [name, urlSlug, `Auto-created from Magento category ID ${magentoCategoryId}`]
//   );

//   return result.rows[0].id;
// }

/**
 * Process categories & product_categories - using magento_category_id
 */
async function processCategories(
  client: Client,
  magentoProduct: MagentoProduct,
  productId: number,
  results: ImportResults
) {
  const categoryLinks = magentoProduct.extension_attributes?.category_links || [];
  if (!categoryLinks.length) {
    return;
  }

  console.log(
    `    Processing ${categoryLinks.length} categories for ${magentoProduct.sku}`
  );

  for (const link of categoryLinks) {
    const magentoCategoryId = parseInt(link.category_id);
    if (!magentoCategoryId || isNaN(magentoCategoryId)) continue;

    try {
      // Look up the real category by magento_category_id
      const categoryId = await findCategoryByMagentoId(client, magentoCategoryId);
      
      if (categoryId) {
        await upsertProductCategory(client, productId, categoryId);
        results.productCategories++;
        console.log(`    ✅ Linked product ${magentoProduct.sku} to category ID: ${categoryId} (Magento ID: ${magentoCategoryId})`);
      } else {
        results.warnings.push(
          `Category not found for Magento category ID: ${magentoCategoryId} in product ${magentoProduct.sku}`
        );
        console.warn(`    ⚠️ Category ${magentoCategoryId} not found for product ${magentoProduct.sku}`);
      }
    } catch (err: any) {
      console.error(
        `    ❌ Error processing category ${link.category_id} for ${magentoProduct.sku}:`,
        err.message
      );
    }
  }
}

// Find category by Magento ID using magento_category_id column
async function findCategoryByMagentoId(client: Client, magentoId: number): Promise<number | null> {
  try {
    const result = await client.query(
      `SELECT id FROM mp_category WHERE magento_category_id = $1`,
      [magentoId]
    );

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    console.log(`    🔍 Could not find category for Magento ID: ${magentoId}`);
    return null;
  } catch (error: any) {
    console.error(`    ❌ Error finding category for Magento ID ${magentoId}:`, error.message);
    return null;
  }
}


// Upsert into product_categories
async function upsertProductCategory(
  client: Client,
  productId: number,
  categoryId: number
) {
  const existing = await client.query(
    `SELECT id FROM mp_product_categories WHERE product_id = $1 AND category_id = $2`,
    [productId, categoryId]
  );

  if (existing.rows.length === 0) {
    await client.query(
      `INSERT INTO mp_product_categories (product_id, category_id, created_at)
       VALUES ($1, $2, NOW())`,
      [productId, categoryId]
    );
  }
}

/**
 * Upsert product listing (seller offer) – now uses product_id
 * (No variants table)
 */
async function upsertProductListing(
  client: Client,
  productId: number,
  sellerId: number,
  magentoProduct: MagentoProduct
) {
  // First try to find existing listing
  const existingListing = await client.query(
    `SELECT id FROM mp_product_listings WHERE seller_id = $1 AND product_id = $2`,
    [sellerId, productId]
  );

  const price = magentoProduct.price || 0;
  const status = magentoProduct.status === 1 ? "active" : "inactive";
  const defaultStock = 10; // you can replace with real stock if you fetch it

  if (existingListing.rows.length > 0) {
    // Update existing listing
    await client.query(
      `UPDATE mp_product_listings 
       SET price = $1, stock = $2, status = $3, updated_at = NOW()
       WHERE seller_id = $4 AND product_id = $5`,
      [price, defaultStock, status, sellerId, productId]
    );
  } else {
    // Insert new listing
    await client.query(
      `INSERT INTO mp_product_listings (seller_id, product_id, price, stock, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [sellerId, productId, price, defaultStock, status]
    );
  }
}
