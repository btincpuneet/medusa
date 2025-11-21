import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { EntityManager } from "typeorm";

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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log('Starting Magento product import...');
    
    const manager: EntityManager = req.scope.resolve("manager");
    
    // Call Magento API
    const magentoResponse = await fetchMagentoProducts();
    
    if (!magentoResponse.items || !Array.isArray(magentoResponse.items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid response from Magento API'
      });
    }

    // Process and insert data into database
    const results = await manager.transaction(async (transactionManager) => {
      return await processAndInsertProducts(transactionManager, magentoResponse.items);
    });
    
    return res.json({
      success: true,
      message: `Successfully processed ${results.processed} products`,
      details: results,
      total_received: magentoResponse.items.length
    });

  } catch (error) {
    console.error('Error importing products:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import products',
      error: error.message
    });
  }
}

// Function to call Magento API
async function fetchMagentoProducts(): Promise<MagentoResponse> {
  const magentoUrl = 'http://local.b2c.com/rest/V1/products?searchCriteria[filter_groups][0][filters][1][field]=status&searchCriteria[filter_groups][0][filters][1][value]=1&searchCriteria[filter_groups][0][filters][0][field]=category_id&searchCriteria[filter_groups][0][filters][0][value]=42&company_code=9110&accessId=2';
  
  const response = await fetch(magentoUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Magento API responded with status: ${response.status}`);
  }

  return await response.json();
}

// Main processing function
async function processAndInsertProducts(manager: EntityManager, magentoProducts: MagentoProduct[]) {
  const results = {
    processed: 0,
    sellers: 0,
    products: 0,
    variants: 0,
    attributes: 0,
    attributeValues: 0,
    inventory: 0
  };

  // First, ensure we have the default seller
  const defaultSellerId = await ensureDefaultSeller(manager);

  for (const magentoProduct of magentoProducts) {
    try {
      await processSingleProduct(manager, magentoProduct, defaultSellerId, results);
      results.processed++;
    } catch (error) {
      console.error(`Error processing product ${magentoProduct.sku}:`, error);
    }
  }

  return results;
}

// Ensure default seller exists
async function ensureDefaultSeller(manager: EntityManager): Promise<string> {
  // Check if seller already exists
  const existingSeller = await manager.query(
    `SELECT id FROM sellers WHERE email = $1`,
    ['default@example.com']
  );

  if (existingSeller.length > 0) {
    return existingSeller[0].id;
  }

  // Insert new seller
  const result = await manager.query(
    `INSERT INTO sellers (name, email, created_at, updated_at) 
     VALUES ($1, $2, NOW(), NOW()) 
     RETURNING id`,
    ['Default Seller', 'default@example.com']
  );
  
  return result[0].id;
}

// Process a single product and its variants
async function processSingleProduct(
  manager: EntityManager, 
  magentoProduct: MagentoProduct, 
  sellerId: string, 
  results: any
) {
  // Insert or update main product
  const productId = await upsertProduct(manager, magentoProduct, sellerId);
  results.products++;

  // Process product variants (each Magento product is treated as a variant)
  const variantId = await upsertProductVariant(manager, magentoProduct, productId);
  results.variants++;

  // Process attributes and attribute values
  await processAttributes(manager, magentoProduct, variantId, results);

  // Update inventory
  await upsertInventory(manager, variantId, sellerId);
  results.inventory++;
}

// Upsert product
async function upsertProduct(manager: EntityManager, magentoProduct: MagentoProduct, sellerId: string): Promise<string> {
  const shortDesc = magentoProduct.custom_attributes?.find(
    attr => attr.attribute_code === 'short_description'
  )?.value || null;

  const result = await manager.query(
    `INSERT INTO products (seller_id, product_code, name, short_desc, base_price, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     ON CONFLICT (product_code) DO UPDATE SET
       name = EXCLUDED.name,
       short_desc = EXCLUDED.short_desc,
       base_price = EXCLUDED.base_price,
       status = EXCLUDED.status,
       updated_at = NOW()
     RETURNING id`,
    [
      sellerId,
      magentoProduct.sku,
      magentoProduct.name,
      shortDesc,
      magentoProduct.price || 0,
      magentoProduct.status === 1 ? 'active' : 'inactive'
    ]
  );

  return result[0].id;
}

// Upsert product variant
async function upsertProductVariant(manager: EntityManager, magentoProduct: MagentoProduct, productId: string): Promise<string> {
  const mainImage = magentoProduct.media_gallery_entries?.[0]?.file || null;

  const result = await manager.query(
    `INSERT INTO product_variants (product_id, sku, price, image, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (sku) DO UPDATE SET
       price = EXCLUDED.price,
       image = EXCLUDED.image,
       updated_at = NOW()
     RETURNING id`,
    [
      productId,
      magentoProduct.sku,
      magentoProduct.price || 0,
      mainImage
    ]
  );

  return result[0].id;
}

// Process attributes and attribute values
async function processAttributes(manager: EntityManager, magentoProduct: MagentoProduct, variantId: string, results: any) {
  if (!magentoProduct.custom_attributes) return;

  for (const customAttr of magentoProduct.custom_attributes) {
    // Skip if value is null or undefined
    if (customAttr.value === null || customAttr.value === undefined) continue;

    // Insert or get attribute
    const attributeId = await upsertAttribute(manager, customAttr.attribute_code);
    results.attributes++;

    // Insert or get attribute value
    const attributeValueId = await upsertAttributeValue(
      manager, 
      attributeId, 
      customAttr.value,
      customAttr.attribute_code
    );
    results.attributeValues++;

    // Link attribute to variant
    await upsertProductVariantAttribute(manager, variantId, attributeId, attributeValueId);
  }
}

// Upsert attribute
async function upsertAttribute(manager: EntityManager, attributeCode: string): Promise<string> {
  const attributeLabel = attributeCode.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const result = await manager.query(
    `INSERT INTO attributes (attribute_code, label, attribute_type, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (attribute_code) DO UPDATE SET
       label = EXCLUDED.label,
       updated_at = NOW()
     RETURNING id`,
    [attributeCode, attributeLabel, 'text']
  );

  return result[0].id;
}

// Upsert attribute value
async function upsertAttributeValue(
  manager: EntityManager, 
  attributeId: string, 
  value: any, 
  attributeCode: string
): Promise<string> {
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

  const result = await manager.query(
    `INSERT INTO attribute_values (attribute_id, value, meta, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (attribute_id, value) DO UPDATE SET
       meta = EXCLUDED.meta,
       updated_at = NOW()
     RETURNING id`,
    [attributeId, processedValue, meta]
  );

  return result[0].id;
}

// Upsert product variant attribute link
async function upsertProductVariantAttribute(
  manager: EntityManager, 
  variantId: string, 
  attributeId: string, 
  attributeValueId: string
) {
  await manager.query(
    `INSERT INTO product_variant_attributes (variant_id, attribute_id, attribute_value_id, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (variant_id, attribute_id) DO UPDATE SET
       attribute_value_id = EXCLUDED.attribute_value_id,
       updated_at = NOW()`,
    [variantId, attributeId, attributeValueId]
  );
}

// Upsert inventory
async function upsertInventory(manager: EntityManager, variantId: string, sellerId: string) {
  await manager.query(
    `INSERT INTO inventory (variant_id, seller_id, stock_available, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (variant_id, seller_id) DO UPDATE SET
       updated_at = NOW()`,
    [variantId, sellerId, 10] // Default stock of 10
  );
}