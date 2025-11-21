import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from 'pg';

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Test with a simple product structure
    const testProduct = {
      sku: 'TEST-SKU-001',
      name: 'Test Product',
      price: 99.99,
      status: 1,
      custom_attributes: [
        { attribute_code: 'color', value: 'red' },
        { attribute_code: 'size', value: 'large' }
      ],
      media_gallery_entries: []
    };

    console.log("Starting test product insertion...");

    const defaultSellerId = await ensureDefaultSeller(client);
    console.log("Default seller ID:", defaultSellerId);

    const productId = await upsertProduct(client, testProduct);
    console.log("Product ID:", productId);

    const variantId = await upsertProductVariant(client, testProduct, productId);
    console.log("Variant ID:", variantId);

    await processAttributes(client, testProduct, variantId, {});
    console.log("Attributes processed");

    await upsertProductListing(client, variantId, defaultSellerId, testProduct);
    console.log("Product listing created");

    return res.json({
      success: true,
      message: "Test product inserted successfully",
      productId,
      variantId,
      sellerId: defaultSellerId
    });

  } catch (error) {
    console.error("Error in test:", error);
    return res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message,
      stack: error.stack
    });
  } finally {
    await client.end();
  }
}

// Helper functions with safe upsert logic
async function ensureDefaultSeller(client: Client): Promise<number> {
  // First try to find existing seller
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

async function upsertProduct(client: Client, product: any): Promise<number> {
  // First try to find existing product
  const existingProduct = await client.query(
    `SELECT id FROM products WHERE product_code = $1`,
    [product.sku]
  );

  if (existingProduct.rows.length > 0) {
    // Update existing product
    await client.query(
      `UPDATE products 
       SET name = $1, base_price = $2, status = $3, updated_at = NOW()
       WHERE product_code = $4`,
      [product.name, product.price, product.status === 1 ? 'active' : 'inactive', product.sku]
    );
    return existingProduct.rows[0].id;
  } else {
    // Insert new product
    const result = await client.query(
      `INSERT INTO products (product_code, name, base_price, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [product.sku, product.name, product.price, product.status === 1 ? 'active' : 'inactive']
    );
    return result.rows[0].id;
  }
}

async function upsertProductVariant(client: Client, product: any, productId: number): Promise<number> {
  // First try to find existing variant
  const existingVariant = await client.query(
    `SELECT id FROM product_variants WHERE sku = $1`,
    [product.sku]
  );

  if (existingVariant.rows.length > 0) {
    // Update existing variant
    await client.query(
      `UPDATE product_variants 
       SET price = $1, product_id = $2, updated_at = NOW()
       WHERE sku = $3`,
      [product.price, productId, product.sku]
    );
    return existingVariant.rows[0].id;
  } else {
    // Insert new variant
    const result = await client.query(
      `INSERT INTO product_variants (product_id, sku, price, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id`,
      [productId, product.sku, product.price]
    );
    return result.rows[0].id;
  }
}

async function processAttributes(client: Client, product: any, variantId: number, results: any) {
  if (!product.custom_attributes) return;
  
  for (const attr of product.custom_attributes) {
    const attributeId = await upsertAttribute(client, attr.attribute_code);
    const attributeValueId = await upsertAttributeValue(client, attributeId, attr.value, attr.attribute_code);
    await upsertProductVariantAttribute(client, variantId, attributeId, attributeValueId);
  }
}

async function upsertAttribute(client: Client, attributeCode: string): Promise<number> {
  // First try to find existing attribute
  const existingAttribute = await client.query(
    `SELECT id FROM attributes WHERE attribute_code = $1`,
    [attributeCode]
  );

  const attributeLabel = attributeCode.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

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

async function upsertAttributeValue(client: Client, attributeId: number, value: any, attributeCode: string): Promise<number> {
  const processedValue = String(value);
  
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
      `INSERT INTO attribute_values (attribute_id, value, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id`,
      [attributeId, processedValue]
    );
    return result.rows[0].id;
  }
}

async function upsertProductVariantAttribute(client: Client, variantId: number, attributeId: number, attributeValueId: number) {
  // First check if the link already exists
  const existingLink = await client.query(
    `SELECT id FROM product_variant_attributes 
     WHERE variant_id = $1 AND attribute_id = $2 AND attribute_value_id = $3`,
    [variantId, attributeId, attributeValueId]
  );

  if (existingLink.rows.length === 0) {
    // Insert new link - WITHOUT created_at/updated_at if they don't exist
    try {
      await client.query(
        `INSERT INTO product_variant_attributes (variant_id, attribute_id, attribute_value_id)
         VALUES ($1, $2, $3)`,
        [variantId, attributeId, attributeValueId]
      );
    } catch (e) {
      // If that fails, try with created_at/updated_at
      await client.query(
        `INSERT INTO product_variant_attributes (variant_id, attribute_id, attribute_value_id, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [variantId, attributeId, attributeValueId]
      );
    }
  }
}

async function upsertProductListing(client: Client, variantId: number, sellerId: number, product: any) {
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
      [product.price, 10, product.status === 1 ? 'active' : 'inactive', sellerId, variantId]
    );
  } else {
    // Insert new listing - try without created_at/updated_at first
    try {
      await client.query(
        `INSERT INTO product_listings (seller_id, variant_id, price, stock, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [sellerId, variantId, product.price, 10, product.status === 1 ? 'active' : 'inactive']
      );
    } catch (e) {
      // If that fails, try with created_at/updated_at
      await client.query(
        `INSERT INTO product_listings (seller_id, variant_id, price, stock, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [sellerId, variantId, product.price, 10, product.status === 1 ? 'active' : 'inactive']
      );
    }
  }
}