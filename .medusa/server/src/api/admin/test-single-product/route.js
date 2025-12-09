"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const pg_1 = require("pg");
async function POST(req, res) {
    const client = new pg_1.Client({
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
    }
    catch (error) {
        console.error("Error in test:", error);
        return res.status(500).json({
            success: false,
            message: "Test failed",
            error: error.message,
            stack: error.stack
        });
    }
    finally {
        await client.end();
    }
}
// Helper functions with safe upsert logic
async function ensureDefaultSeller(client) {
    // First try to find existing seller
    const existingSeller = await client.query(`SELECT id FROM sellers WHERE email = $1`, ['default@example.com']);
    if (existingSeller.rows.length > 0) {
        return existingSeller.rows[0].id;
    }
    // Insert new seller
    const result = await client.query(`INSERT INTO sellers (name, email, created_at, updated_at) 
     VALUES ($1, $2, NOW(), NOW()) 
     RETURNING id`, ['Default Seller', 'default@example.com']);
    return result.rows[0].id;
}
async function upsertProduct(client, product) {
    // First try to find existing product
    const existingProduct = await client.query(`SELECT id FROM products WHERE product_code = $1`, [product.sku]);
    if (existingProduct.rows.length > 0) {
        // Update existing product
        await client.query(`UPDATE products 
       SET name = $1, base_price = $2, status = $3, updated_at = NOW()
       WHERE product_code = $4`, [product.name, product.price, product.status === 1 ? 'active' : 'inactive', product.sku]);
        return existingProduct.rows[0].id;
    }
    else {
        // Insert new product
        const result = await client.query(`INSERT INTO products (product_code, name, base_price, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id`, [product.sku, product.name, product.price, product.status === 1 ? 'active' : 'inactive']);
        return result.rows[0].id;
    }
}
async function upsertProductVariant(client, product, productId) {
    // First try to find existing variant
    const existingVariant = await client.query(`SELECT id FROM product_variants WHERE sku = $1`, [product.sku]);
    if (existingVariant.rows.length > 0) {
        // Update existing variant
        await client.query(`UPDATE product_variants 
       SET price = $1, product_id = $2, updated_at = NOW()
       WHERE sku = $3`, [product.price, productId, product.sku]);
        return existingVariant.rows[0].id;
    }
    else {
        // Insert new variant
        const result = await client.query(`INSERT INTO product_variants (product_id, sku, price, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id`, [productId, product.sku, product.price]);
        return result.rows[0].id;
    }
}
async function processAttributes(client, product, variantId, results) {
    if (!product.custom_attributes)
        return;
    for (const attr of product.custom_attributes) {
        const attributeId = await upsertAttribute(client, attr.attribute_code);
        const attributeValueId = await upsertAttributeValue(client, attributeId, attr.value, attr.attribute_code);
        await upsertProductVariantAttribute(client, variantId, attributeId, attributeValueId);
    }
}
async function upsertAttribute(client, attributeCode) {
    // First try to find existing attribute
    const existingAttribute = await client.query(`SELECT id FROM attributes WHERE attribute_code = $1`, [attributeCode]);
    const attributeLabel = attributeCode.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if (existingAttribute.rows.length > 0) {
        // Update existing attribute
        await client.query(`UPDATE attributes SET label = $1, updated_at = NOW() WHERE attribute_code = $2`, [attributeLabel, attributeCode]);
        return existingAttribute.rows[0].id;
    }
    else {
        // Insert new attribute
        const result = await client.query(`INSERT INTO attributes (attribute_code, label, attribute_type, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id`, [attributeCode, attributeLabel, 'text']);
        return result.rows[0].id;
    }
}
async function upsertAttributeValue(client, attributeId, value, attributeCode) {
    const processedValue = String(value);
    // First try to find existing attribute value
    const existingValue = await client.query(`SELECT id FROM attribute_values WHERE attribute_id = $1 AND value = $2`, [attributeId, processedValue]);
    if (existingValue.rows.length > 0) {
        return existingValue.rows[0].id;
    }
    else {
        // Insert new attribute value
        const result = await client.query(`INSERT INTO attribute_values (attribute_id, value, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id`, [attributeId, processedValue]);
        return result.rows[0].id;
    }
}
async function upsertProductVariantAttribute(client, variantId, attributeId, attributeValueId) {
    // First check if the link already exists
    const existingLink = await client.query(`SELECT id FROM product_variant_attributes 
     WHERE variant_id = $1 AND attribute_id = $2 AND attribute_value_id = $3`, [variantId, attributeId, attributeValueId]);
    if (existingLink.rows.length === 0) {
        // Insert new link - WITHOUT created_at/updated_at if they don't exist
        try {
            await client.query(`INSERT INTO product_variant_attributes (variant_id, attribute_id, attribute_value_id)
         VALUES ($1, $2, $3)`, [variantId, attributeId, attributeValueId]);
        }
        catch (e) {
            // If that fails, try with created_at/updated_at
            await client.query(`INSERT INTO product_variant_attributes (variant_id, attribute_id, attribute_value_id, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`, [variantId, attributeId, attributeValueId]);
        }
    }
}
async function upsertProductListing(client, variantId, sellerId, product) {
    // First try to find existing listing
    const existingListing = await client.query(`SELECT id FROM product_listings WHERE seller_id = $1 AND variant_id = $2`, [sellerId, variantId]);
    if (existingListing.rows.length > 0) {
        // Update existing listing
        await client.query(`UPDATE product_listings 
       SET price = $1, stock = $2, status = $3, updated_at = NOW()
       WHERE seller_id = $4 AND variant_id = $5`, [product.price, 10, product.status === 1 ? 'active' : 'inactive', sellerId, variantId]);
    }
    else {
        // Insert new listing - try without created_at/updated_at first
        try {
            await client.query(`INSERT INTO product_listings (seller_id, variant_id, price, stock, status)
         VALUES ($1, $2, $3, $4, $5)`, [sellerId, variantId, product.price, 10, product.status === 1 ? 'active' : 'inactive']);
        }
        catch (e) {
            // If that fails, try with created_at/updated_at
            await client.query(`INSERT INTO product_listings (seller_id, variant_id, price, stock, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`, [sellerId, variantId, product.price, 10, product.status === 1 ? 'active' : 'inactive']);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Rlc3Qtc2luZ2xlLXByb2R1Y3Qvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQSxvQkF5REM7QUEzREQsMkJBQTRCO0FBRXJCLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxNQUFNLE1BQU0sR0FBRyxJQUFJLFdBQU0sQ0FBQztRQUN4QixnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7S0FDM0MsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFdkIsdUNBQXVDO1FBQ3ZDLE1BQU0sV0FBVyxHQUFHO1lBQ2xCLEdBQUcsRUFBRSxjQUFjO1lBQ25CLElBQUksRUFBRSxjQUFjO1lBQ3BCLEtBQUssRUFBRSxLQUFLO1lBQ1osTUFBTSxFQUFFLENBQUM7WUFDVCxpQkFBaUIsRUFBRTtnQkFDakIsRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7Z0JBQ3pDLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFO2FBQzNDO1lBQ0QscUJBQXFCLEVBQUUsRUFBRTtTQUMxQixDQUFDO1FBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1FBRWxELE1BQU0sZUFBZSxHQUFHLE1BQU0sbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUVuRCxNQUFNLFNBQVMsR0FBRyxNQUFNLGFBQWEsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDM0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFF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