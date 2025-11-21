import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from 'pg';

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
      category_id: string;
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
  variants: number;
  attributes: number;
  attributeValues: number;
  listings: number;
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
    console.log(`📦 Received ${magentoResponse.items?.length || 0} products from Magento`);

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
          total_received: 0
        }
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

  } catch (error) {
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
  const magentoUrl = 'http://local.b2c.com/rest/V1/products?searchCriteria[filter_groups][0][filters][1][field]=status&searchCriteria[filter_groups][0][filters][1][value]=1&searchCriteria[filter_groups][0][filters][0][field]=category_id&searchCriteria[filter_groups][0][filters][0][value]=42&company_code=9110&accessId=2';
  
  console.log(`🌐 Fetching products from Magento: ${magentoUrl}`);

  const response = await fetch(magentoUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Magento API responded with status: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Successfully fetched ${data.items?.length || 0} products`);
  
  return data;
}

// Main processing function
async function processAndInsertProducts(client: Client, magentoProducts: MagentoProduct[]): Promise<ImportResults> {
  const results: ImportResults = {
    processed: 0,
    sellers: 0,
    products: 0,
    variants: 0,
    attributes: 0,
    attributeValues: 0,
    listings: 0,
    errors: [],
    skipped: 0,
    warnings: []
  };

  // First, ensure we have the default seller
  try {
    const defaultSellerId = await ensureDefaultSeller(client);
    results.sellers++;
    console.log(`🏪 Default seller ID: ${defaultSellerId}`);
  } catch (error) {
    console.error("❌ Error ensuring default seller:", error);
    results.errors.push(`Default seller error: ${error.message}`);
    return results;
  }

  // Process products in batches to avoid memory issues
  const batchSize = 10;
  for (let i = 0; i < magentoProducts.length; i += batchSize) {
    const batch = magentoProducts.slice(i, i + batchSize);
    console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(magentoProducts.length/batchSize)}`);
    
    for (const magentoProduct of batch) {
      try {
        console.log(`📝 Processing product: ${magentoProduct.sku}`);
        
        // Validate required fields
        if (!magentoProduct.sku || !magentoProduct.name) {
          results.warnings.push(`Skipping product with missing SKU or name: ${magentoProduct.sku}`);
          results.skipped++;
          continue;
        }

        await processSingleProduct(client, magentoProduct, results);
        results.processed++;
        
        console.log(`✅ Successfully processed: ${magentoProduct.sku}`);
      } catch (error) {
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
  // Check if seller already exists
  const existingSeller = await client.query(
    `SELECT id FROM sellers WHERE email = $1`, 
    ['default@example.com']
  );

  if (existingSeller.rows.length > 0) {
    return existingSeller.rows[0].id;
  }

  // Insert new seller
  const result = await client.query(
    `INSERT INTO sellers (name, email, created_at, updated_at) 
     VALUES ($1, $2, NOW(), NOW()) 
     RETURNING id`,
    ['Default Seller', 'default@example.com']
  );
  
  return result.rows[0].id;
}

// Process a single product and its variants
async function processSingleProduct(
  client: Client, 
  magentoProduct: MagentoProduct, 
  results: ImportResults
) {
  const defaultSellerId = await ensureDefaultSeller(client);

  // Insert or update main product
  const productId = await upsertProduct(client, magentoProduct);
  results.products++;

  // Process product variants (each Magento product is treated as a variant)
  const variantId = await upsertProductVariant(client, magentoProduct, productId);
  results.variants++;

  // Process attributes and attribute values
  await processAttributes(client, magentoProduct, variantId, results);

  // Create product listing
  await upsertProductListing(client, variantId, defaultSellerId, magentoProduct);
  results.listings++;
}

// Upsert product (catalog level - no seller_id)
async function upsertProduct(client: Client, magentoProduct: MagentoProduct): Promise<number> {
  const shortDesc = magentoProduct.custom_attributes?.find(
    attr => attr.attribute_code === 'short_description'
  )?.value || null;

  const longDesc = magentoProduct.custom_attributes?.find(
    attr => attr.attribute_code === 'description'
  )?.value || null;

  // First try to find existing product
  const existingProduct = await client.query(
    `SELECT id FROM products WHERE product_code = $1`,
    [magentoProduct.sku]
  );

  if (existingProduct.rows.length > 0) {
    // Update existing product
    await client.query(
      `UPDATE products 
       SET name = $1, short_desc = $2, long_desc = $3, base_price = $4, status = $5, updated_at = NOW()
       WHERE product_code = $6`,
      [
        magentoProduct.name,
        shortDesc,
        longDesc,
        magentoProduct.price || 0,
        magentoProduct.status === 1 ? 'active' : 'inactive',
        magentoProduct.sku
      ]
    );
    return existingProduct.rows[0].id;
  } else {
    // Insert new product
    const result = await client.query(
      `INSERT INTO products (product_code, name, short_desc, long_desc, base_price, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id`,
      [
        magentoProduct.sku,
        magentoProduct.name,
        shortDesc,
        longDesc,
        magentoProduct.price || 0,
        magentoProduct.status === 1 ? 'active' : 'inactive'
      ]
    );
    return result.rows[0].id;
  }
}

// Upsert product variant
async function upsertProductVariant(client: Client, magentoProduct: MagentoProduct, productId: number): Promise<number> {
  const mainImage = magentoProduct.media_gallery_entries?.find(entry => 
    entry.types.includes('image') || entry.types.includes('small_image')
  )?.file || magentoProduct.media_gallery_entries?.[0]?.file || null;

  // First try to find existing variant
  const existingVariant = await client.query(
    `SELECT id FROM product_variants WHERE sku = $1`,
    [magentoProduct.sku]
  );

  if (existingVariant.rows.length > 0) {
    // Update existing variant
    await client.query(
      `UPDATE product_variants 
       SET price = $1, product_id = $2, image = $3, updated_at = NOW()
       WHERE sku = $4`,
      [
        magentoProduct.price || 0,
        productId,
        mainImage,
        magentoProduct.sku
      ]
    );
    return existingVariant.rows[0].id;
  } else {
    // Insert new variant
    const result = await client.query(
      `INSERT INTO product_variants (product_id, sku, price, image, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [
        productId,
        magentoProduct.sku,
        magentoProduct.price || 0,
        mainImage
      ]
    );
    return result.rows[0].id;
  }
}

// Process attributes and attribute values
async function processAttributes(client: Client, magentoProduct: MagentoProduct, variantId: number, results: ImportResults) {
  if (!magentoProduct.custom_attributes) {
    return;
  }

  console.log(`    Processing ${magentoProduct.custom_attributes.length} attributes for ${magentoProduct.sku}`);

  for (const customAttr of magentoProduct.custom_attributes) {
    // Skip if value is null or undefined or empty
    if (customAttr.value === null || customAttr.value === undefined || customAttr.value === '') {
      continue;
    }

    // Skip some system attributes we don't need to store as variants
    const skipAttributes = [
      'description', 
      'short_description', 
      'meta_title', 
      'meta_keyword', 
      'meta_description',
      'category_ids',
      'options_container',
      'required_options',
      'has_options',
      'url_key',
      'url_path'
    ];
    
    if (skipAttributes.includes(customAttr.attribute_code)) {
      continue;
    }

    try {
      // Insert or get attribute
      const attributeId = await upsertAttribute(client, customAttr.attribute_code);
      results.attributes++;

      // Insert or get attribute value
      const attributeValueId = await upsertAttributeValue(
        client, 
        attributeId, 
        customAttr.value,
        customAttr.attribute_code
      );
      results.attributeValues++;

      // Link attribute to variant
      await upsertProductVariantAttribute(client, variantId, attributeId, attributeValueId);
      
    } catch (attrError) {
      console.error(`    ❌ Error processing attribute ${customAttr.attribute_code}:`, attrError.message);
      // Don't throw here - continue with other attributes
    }
  }
}

// Upsert attribute
async function upsertAttribute(client: Client, attributeCode: string): Promise<number> {
  const attributeLabel = attributeCode.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // First try to find existing attribute
  const existingAttribute = await client.query(
    `SELECT id FROM attributes WHERE attribute_code = $1`,
    [attributeCode]
  );

  if (existingAttribute.rows.length > 0) {
    // Update existing attribute
    await client.query(
      `UPDATE attributes SET label = $1, updated_at = NOW() WHERE attribute_code = $2`,
      [attributeLabel, attributeCode]
    );
    return existingAttribute.rows[0].id;
  } else {
    // Insert new attribute
    const result = await client.query(
      `INSERT INTO attributes (attribute_code, label, attribute_type, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id`,
      [attributeCode, attributeLabel, 'text']
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
  let processedValue = value;
  let meta = null;

  if (Array.isArray(value)) {
    processedValue = value.join(',');
    meta = JSON.stringify({ original_type: 'array', values: value });
  } else if (typeof value === 'object' && value !== null) {
    processedValue = JSON.stringify(value);
    meta = JSON.stringify({ original_type: 'object' });
  } else {
    processedValue = String(value);
  }

  // Truncate if too long for VARCHAR(255)
  if (processedValue.length > 255) {
    processedValue = processedValue.substring(0, 255);
  }

  // First try to find existing attribute value
  const existingValue = await client.query(
    `SELECT id FROM attribute_values WHERE attribute_id = $1 AND value = $2`,
    [attributeId, processedValue]
  );

  if (existingValue.rows.length > 0) {
    return existingValue.rows[0].id;
  } else {
    // Insert new attribute value
    const result = await client.query(
      `INSERT INTO attribute_values (attribute_id, value, meta, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id`,
      [attributeId, processedValue, meta]
    );
    return result.rows[0].id;
  }
}

// Upsert product variant attribute link
async function upsertProductVariantAttribute(
  client: Client, 
  variantId: number, 
  attributeId: number, 
  attributeValueId: number
) {
  // First check if the link already exists
  const existingLink = await client.query(
    `SELECT id FROM product_variant_attributes 
     WHERE variant_id = $1 AND attribute_id = $2 AND attribute_value_id = $3`,
    [variantId, attributeId, attributeValueId]
  );

  if (existingLink.rows.length === 0) {
    // Insert new link
    await client.query(
      `INSERT INTO product_variant_attributes (variant_id, attribute_id, attribute_value_id, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [variantId, attributeId, attributeValueId]
    );
  }
}

// Upsert product listing (seller offer)
async function upsertProductListing(client: Client, variantId: number, sellerId: number, magentoProduct: MagentoProduct) {
  // First try to find existing listing
  const existingListing = await client.query(
    `SELECT id FROM product_listings WHERE seller_id = $1 AND variant_id = $2`,
    [sellerId, variantId]
  );

  if (existingListing.rows.length > 0) {
    // Update existing listing
    await client.query(
      `UPDATE product_listings 
       SET price = $1, stock = $2, status = $3, updated_at = NOW()
       WHERE seller_id = $4 AND variant_id = $5`,
      [
        magentoProduct.price || 0,
        10, // Default stock
        magentoProduct.status === 1 ? 'active' : 'inactive',
        sellerId,
        variantId
      ]
    );
  } else {
    // Insert new listing
    await client.query(
      `INSERT INTO product_listings (seller_id, variant_id, price, stock, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [
        sellerId,
        variantId,
        magentoProduct.price || 0,
        10, // Default stock
        magentoProduct.status === 1 ? 'active' : 'inactive'
      ]
    );
  }
}