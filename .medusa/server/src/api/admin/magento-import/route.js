"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const pg_1 = require("pg");
async function POST(req, res) {
    const client = new pg_1.Client({
        connectionString: process.env.DATABASE_URL,
    });
    try {
        console.log("🚀 Starting Magento product import...");
        await client.connect();
        // 🔁 NEW: fetch ALL products with pagination
        const magentoItems = await fetchAllMagentoProducts();
        console.log(`📦 Received ${magentoItems.length} products from Magento (all pages)`);
        if (!magentoItems || !Array.isArray(magentoItems)) {
            return res.status(400).json({
                success: false,
                message: "Invalid response from Magento API - no items array",
            });
        }
        if (magentoItems.length === 0) {
            return res.json({
                success: true,
                message: "No products found to import",
                details: {
                    processed: 0,
                    total_received: 0,
                },
            });
        }
        const result = await processAndInsertProducts(client, magentoItems);
        console.log("✅ Import completed!");
        console.log(`📊 Results: ${result.processed} processed, ${result.errors.length} errors`);
        return res.json({
            success: true,
            message: `Processed ${result.processed} products successfully`,
            total_received: magentoItems.length,
            details: result,
        });
    }
    catch (error) {
        console.error("❌ Error importing products:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to import products",
            error: error.message,
        });
    }
    finally {
        await client.end().catch(console.error);
    }
}
// Function to call Magento API
async function fetchMagentoProducts() {
    const magentoUrl = "http://local.b2c.com/rest/V1/products?searchCriteria[filter_groups][0][filters][1][field]=status&searchCriteria[filter_groups][0][filters][1][value]=1&company_code=1140&accessId=6";
    console.log(`🌐 Fetching products from Magento: ${magentoUrl}`);
    const response = await fetch(magentoUrl, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error(`Magento API responded with status: ${response.status} on page ${currentPage}`);
    }
    const data = await response.json();
    console.log(`✅ Successfully fetched ${data.items?.length || 0} products`);
    return data;
}
// Main processing function
async function processAndInsertProducts(client, magentoProducts) {
    const results = {
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
    let defaultSellerId;
    try {
        defaultSellerId = await ensureDefaultSeller(client);
        results.sellers++;
        console.log(`🏪 Default seller ID: ${defaultSellerId}`);
    }
    catch (error) {
        console.error("❌ Error ensuring default seller:", error);
        results.errors.push(`Default seller error: ${error.message}`);
        return results;
    }
    // Process products in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < magentoProducts.length; i += batchSize) {
        const batch = magentoProducts.slice(i, i + batchSize);
        console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(magentoProducts.length / batchSize)}`);
        for (const magentoProduct of batch) {
            try {
                console.log(`📝 Processing product: ${magentoProduct.sku}`);
                // Validate required fields
                if (!magentoProduct.sku || !magentoProduct.name) {
                    results.warnings.push(`Skipping product with missing SKU or name: ${magentoProduct.sku}`);
                    results.skipped++;
                    continue;
                }
                await processSingleProduct(client, magentoProduct, results, defaultSellerId);
                results.processed++;
                console.log(`✅ Successfully processed: ${magentoProduct.sku}`);
            }
            catch (error) {
                const errorMsg = `Error processing product ${magentoProduct.sku}: ${error.message}`;
                console.error(`❌ ${errorMsg}`);
                results.errors.push(errorMsg);
            }
        }
    }
    return results;
}
// Ensure default seller exists
async function ensureDefaultSeller(client) {
    const email = "default@example.com";
    // Check if seller already exists
    const existingSeller = await client.query(`SELECT id FROM mp_sellers WHERE email = $1`, [email]);
    if (existingSeller.rows.length > 0) {
        return existingSeller.rows[0].id;
    }
    // IMPORTANT: password is NOT NULL in schema, so set a dummy value
    const defaultPassword = "default_password_change_me";
    const result = await client.query(`INSERT INTO mp_sellers (name, email, password, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     RETURNING id`, ["Default Seller", email, defaultPassword]);
    return result.rows[0].id;
}
// Process a single product
async function processSingleProduct(client, magentoProduct, results, defaultSellerId) {
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
async function upsertProduct(client, magentoProduct) {
    const shortDesc = magentoProduct.custom_attributes?.find((attr) => attr.attribute_code === "short_description")?.value || null;
    const longDesc = magentoProduct.custom_attributes?.find((attr) => attr.attribute_code === "description")?.value || null;
    // First try to find existing product
    const existingProduct = await client.query(`SELECT id FROM mp_products WHERE product_code = $1`, [magentoProduct.sku]);
    if (existingProduct.rows.length > 0) {
        // Update existing product
        await client.query(`UPDATE mp_products 
       SET name = $1, short_desc = $2, long_desc = $3, base_price = $4, status = $5, updated_at = NOW()
       WHERE product_code = $6`, [
            magentoProduct.name,
            shortDesc,
            longDesc,
            magentoProduct.price || 0,
            magentoProduct.status === 1 ? "active" : "inactive",
            magentoProduct.sku,
        ]);
        return existingProduct.rows[0].id;
    }
    else {
        // Insert new product
        const result = await client.query(`INSERT INTO mp_products (product_code, name, short_desc, long_desc, base_price, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id`, [
            magentoProduct.sku,
            magentoProduct.name,
            shortDesc,
            longDesc,
            magentoProduct.price || 0,
            magentoProduct.status === 1 ? "active" : "inactive",
        ]);
        return result.rows[0].id;
    }
}
/**
 * Process attributes and attribute values at PRODUCT level
 * product_attributes table is used instead of variant mapping
 */
async function processAttributes(client, magentoProduct, productId, results) {
    if (!magentoProduct.custom_attributes) {
        return;
    }
    console.log(`    Processing ${magentoProduct.custom_attributes.length} attributes for ${magentoProduct.sku}`);
    for (const customAttr of magentoProduct.custom_attributes) {
        // Skip if value is null / undefined / empty
        if (customAttr.value === null ||
            customAttr.value === undefined ||
            customAttr.value === "") {
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
            const attributeId = await upsertAttribute(client, customAttr.attribute_code);
            results.attributes++;
            // Insert or get attribute value
            const attributeValueId = await upsertAttributeValue(client, attributeId, customAttr.value, customAttr.attribute_code);
            results.attributeValues++;
            // Link attribute to PRODUCT (not variant)
            await upsertProductAttribute(client, productId, attributeId, attributeValueId);
        }
        catch (attrError) {
            console.error(`    ❌ Error processing attribute ${customAttr.attribute_code}:`, attrError.message);
            // Don't throw - continue with other attributes
        }
    }
}
// Upsert attribute
async function upsertAttribute(client, attributeCode) {
    const attributeLabel = attributeCode
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    // First try to find existing attribute
    const existingAttribute = await client.query(`SELECT id FROM mp_attributes WHERE attribute_code = $1`, [attributeCode]);
    if (existingAttribute.rows.length > 0) {
        // Update existing attribute
        await client.query(`UPDATE mp_attributes SET label = $1, updated_at = NOW() WHERE attribute_code = $2`, [attributeLabel, attributeCode]);
        return existingAttribute.rows[0].id;
    }
    else {
        // Insert new attribute
        const result = await client.query(`INSERT INTO mp_attributes (attribute_code, label, attribute_type, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id`, [attributeCode, attributeLabel, "text"]);
        return result.rows[0].id;
    }
}
// Upsert attribute value
async function upsertAttributeValue(client, attributeId, value, attributeCode) {
    // Handle different value types
    let processedValue = value;
    let meta = null;
    if (Array.isArray(value)) {
        processedValue = value.join(",");
        meta = { original_type: "array", values: value };
    }
    else if (typeof value === "object" && value !== null) {
        processedValue = JSON.stringify(value);
        meta = { original_type: "object" };
    }
    else {
        processedValue = String(value);
    }
    // Truncate if too long for VARCHAR(255)
    if (processedValue.length > 255) {
        processedValue = processedValue.substring(0, 255);
    }
    // First try to find existing attribute value
    const existingValue = await client.query(`SELECT id FROM mp_attribute_values WHERE attribute_id = $1 AND value = $2`, [attributeId, processedValue]);
    if (existingValue.rows.length > 0) {
        return existingValue.rows[0].id;
    }
    else {
        // Insert new attribute value
        const result = await client.query(`INSERT INTO mp_attribute_values (attribute_id, value, meta, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id`, [attributeId, processedValue, meta ? JSON.stringify(meta) : null]);
        return result.rows[0].id;
    }
}
// Upsert product attribute link (product_attributes)
async function upsertProductAttribute(client, productId, attributeId, attributeValueId) {
    // First check if the link already exists
    const existingLink = await client.query(`SELECT id FROM mp_product_attributes 
     WHERE product_id = $1 AND attribute_id = $2 AND attribute_value_id = $3`, [productId, attributeId, attributeValueId]);
    if (existingLink.rows.length === 0) {
        // Insert new link
        await client.query(`INSERT INTO mp_product_attributes (product_id, attribute_id, attribute_value_id)
       VALUES ($1, $2, $3)`, [productId, attributeId, attributeValueId]);
    }
}
/**
 * Process product gallery images -> product_gallery
 */
async function processGallery(client, magentoProduct, productId, results) {
    const entries = magentoProduct.media_gallery_entries || [];
    if (!entries.length) {
        return;
    }
    console.log(`    Processing ${entries.length} gallery images for ${magentoProduct.sku}`);
    for (const entry of entries) {
        try {
            await upsertProductGallery(client, productId, entry);
            results.galleries++;
        }
        catch (err) {
            console.error(`    ❌ Error processing gallery image for ${magentoProduct.sku}:`, err.message);
        }
    }
}
function mapMagentoImageType(entry) {
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
async function upsertProductGallery(client, productId, entry) {
    const imageType = mapMagentoImageType(entry);
    const imagePath = entry.file; // e.g. "/m/y/my-image.jpg"
    // Check if image already exists for this product
    const existing = await client.query(`SELECT id FROM mp_product_gallery WHERE product_id = $1 AND image = $2`, [productId, imagePath]);
    if (existing.rows.length > 0) {
        // Update label / type if needed
        await client.query(`UPDATE mp_product_gallery
       SET image_type = $1, label = $2, updated_at = NOW()
       WHERE id = $3`, [imageType, entry.label, existing.rows[0].id]);
    }
    else {
        await client.query(`INSERT INTO mp_product_gallery (product_id, image_type, label, image, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`, [productId, imageType, entry.label, imagePath]);
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
async function processCategories(client, magentoProduct, productId, results) {
    const categoryLinks = magentoProduct.extension_attributes?.category_links || [];
    if (!categoryLinks.length) {
        return;
    }
    console.log(`    Processing ${categoryLinks.length} categories for ${magentoProduct.sku}`);
    for (const link of categoryLinks) {
        const magentoCategoryId = parseInt(link.category_id);
        if (!magentoCategoryId || isNaN(magentoCategoryId))
            continue;
        try {
            // Look up the real category by magento_category_id
            const categoryId = await findCategoryByMagentoId(client, magentoCategoryId);
            if (categoryId) {
                await upsertProductCategory(client, productId, categoryId);
                results.productCategories++;
                console.log(`    ✅ Linked product ${magentoProduct.sku} to category ID: ${categoryId} (Magento ID: ${magentoCategoryId})`);
            }
            else {
                results.warnings.push(`Category not found for Magento category ID: ${magentoCategoryId} in product ${magentoProduct.sku}`);
                console.warn(`    ⚠️ Category ${magentoCategoryId} not found for product ${magentoProduct.sku}`);
            }
        }
        catch (err) {
            console.error(`    ❌ Error processing category ${link.category_id} for ${magentoProduct.sku}:`, err.message);
        }
    }
}
// Find category by Magento ID using magento_category_id column
async function findCategoryByMagentoId(client, magentoId) {
    try {
        const result = await client.query(`SELECT id FROM mp_category WHERE magento_category_id = $1`, [magentoId]);
        if (result.rows.length > 0) {
            return result.rows[0].id;
        }
        console.log(`    🔍 Could not find category for Magento ID: ${magentoId}`);
        return null;
    }
    catch (error) {
        console.error(`    ❌ Error finding category for Magento ID ${magentoId}:`, error.message);
        return null;
    }
}
// Upsert into product_categories
async function upsertProductCategory(client, productId, categoryId) {
    const existing = await client.query(`SELECT id FROM mp_product_categories WHERE product_id = $1 AND category_id = $2`, [productId, categoryId]);
    if (existing.rows.length === 0) {
        await client.query(`INSERT INTO mp_product_categories (product_id, category_id, created_at)
       VALUES ($1, $2, NOW())`, [productId, categoryId]);
    }
}
/**
 * Upsert product listing (seller offer) – now uses product_id
 * (No variants table)
 */
async function upsertProductListing(client, productId, sellerId, magentoProduct) {
    // First try to find existing listing
    const existingListing = await client.query(`SELECT id FROM mp_product_listings WHERE seller_id = $1 AND product_id = $2`, [sellerId, productId]);
    const price = magentoProduct.price || 0;
    const status = magentoProduct.status === 1 ? "active" : "inactive";
    const defaultStock = 10; // you can replace with real stock if you fetch it
    if (existingListing.rows.length > 0) {
        // Update existing listing
        await client.query(`UPDATE mp_product_listings 
       SET price = $1, stock = $2, status = $3, updated_at = NOW()
       WHERE seller_id = $4 AND product_id = $5`, [price, defaultStock, status, sellerId, productId]);
    }
    else {
        // Insert new listing
        await client.query(`INSERT INTO mp_product_listings (seller_id, product_id, price, stock, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`, [sellerId, productId, price, defaultStock, status]);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21hZ2VudG8taW1wb3J0L3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBMEVBLG9CQTREQztBQXBJRCwyQkFBNEI7QUF3RXJCLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxNQUFNLE1BQU0sR0FBRyxJQUFJLFdBQU0sQ0FBQztRQUN4QixnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7S0FDM0MsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1FBR3JELE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXZCLDZDQUE2QztRQUM3QyxNQUFNLFlBQVksR0FBRyxNQUFNLHVCQUF1QixFQUFFLENBQUM7UUFDckQsT0FBTyxDQUFDLEdBQUcsQ0FFVCxlQUFlLFlBQVksQ0FBQyxNQUFNLG9DQUFvQyxDQUV2RSxDQUFDO1FBRUYsSUFBSSxDQUFDLFlBQVksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztZQUNsRCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixPQUFPLEVBQUUsS0FBSztnQkFDZCxPQUFPLEVBQUUsb0RBQW9EO2FBQzlELENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDOUIsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNkLE9BQU8sRUFBRSxJQUFJO2dCQUNiLE9BQU8sRUFBRSw2QkFBNkI7Z0JBQ3RDLE9BQU8sRUFBRTtvQkFDUCxTQUFTLEVBQUUsQ0FBQztvQkFDWixjQUFjLEVBQUUsQ0FBQztpQkFDbEI7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFcEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQ1QsZUFBZSxNQUFNLENBQUMsU0FBUyxlQUFlLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxTQUFTLENBQzVFLENBQUM7UUFFRixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxPQUFPLEVBQUUsSUFBSTtZQUNiLE9BQU8sRUFBRSxhQUFhLE1BQU0sQ0FBQyxTQUFTLHdCQUF3QjtZQUM5RCxjQUFjLEVBQUUsWUFBWSxDQUFDLE1BQU07WUFDbkMsT0FBTyxFQUFFLE1BQU07U0FDaEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNwRCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsT0FBTyxFQUFFLDJCQUEyQjtZQUNwQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU87U0FDckIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztZQUFTLENBQUM7UUFDVCxNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFDLENBQUM7QUFDSCxDQUFDO0FBRUQsK0JBQStCO0FBQy9CLEtBQUssVUFBVSxvQkFBb0I7SUFDakMsTUFBTSxVQUFVLEdBQ2QscUxBQXFMLENBQUM7SUFFeEwsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQ0FBc0MsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUVoRSxNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssQ0FBQyxVQUFVLEVBQUU7UUFDdkMsTUFBTSxFQUFFLEtBQUs7UUFDYixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsa0JBQWtCO1NBQ25DO0tBQ0YsQ0FBQyxDQUFDO0lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNqQixNQUFNLElBQUksS0FBSyxDQUNiLHNDQUFzQyxRQUFRLENBQUMsTUFBTSxZQUFZLFdBQVcsRUFBRSxDQUMvRSxDQUFDO0lBQ0osQ0FBQztJQUVILE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFMUUsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsMkJBQTJCO0FBQzNCLEtBQUssVUFBVSx3QkFBd0IsQ0FDckMsTUFBYyxFQUNkLGVBQWlDO0lBRWpDLE1BQU0sT0FBTyxHQUFrQjtRQUM3QixTQUFTLEVBQUUsQ0FBQztRQUNaLE9BQU8sRUFBRSxDQUFDO1FBQ1YsUUFBUSxFQUFFLENBQUM7UUFDWCxRQUFRLEVBQUUsQ0FBQyxFQUFFLGVBQWU7UUFDNUIsVUFBVSxFQUFFLENBQUM7UUFDYixlQUFlLEVBQUUsQ0FBQztRQUNsQixRQUFRLEVBQUUsQ0FBQztRQUNYLFNBQVMsRUFBRSxDQUFDO1FBQ1osVUFBVSxFQUFFLENBQUM7UUFDYixpQkFBaUIsRUFBRSxDQUFDO1FBQ3BCLE1BQU0sRUFBRSxFQUFFO1FBQ1YsT0FBTyxFQUFFLENBQUM7UUFDVixRQUFRLEVBQUUsRUFBRTtLQUNiLENBQUM7SUFFRiwyQ0FBMkM7SUFDM0MsSUFBSSxlQUF1QixDQUFDO0lBQzVCLElBQUksQ0FBQztRQUNILGVBQWUsR0FBRyxNQUFNLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BELE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNsQixPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixlQUFlLEVBQUUsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxLQUFLLENBQUMsa0NBQWtDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMseUJBQXlCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzlELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxxREFBcUQ7SUFDckQsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ3JCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUMzRCxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7UUFDdEQsT0FBTyxDQUFDLEdBQUcsQ0FDVCx1QkFBdUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQy9ELGVBQWUsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUNuQyxFQUFFLENBQ0osQ0FBQztRQUVGLEtBQUssTUFBTSxjQUFjLElBQUksS0FBSyxFQUFFLENBQUM7WUFDbkMsSUFBSSxDQUFDO2dCQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUU1RCwyQkFBMkI7Z0JBQzNCLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNoRCxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FDbkIsOENBQThDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FDbkUsQ0FBQztvQkFDRixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2xCLFNBQVM7Z0JBQ1gsQ0FBQztnQkFFRCxNQUFNLG9CQUFvQixDQUN4QixNQUFNLEVBQ04sY0FBYyxFQUNkLE9BQU8sRUFDUCxlQUFlLENBQ2hCLENBQUM7Z0JBQ0YsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUVwQixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNqRSxDQUFDO1lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxRQUFRLEdBQUcsNEJBQTRCLGNBQWMsQ0FBQyxHQUFHLEtBQUssS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwRixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDL0IsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEMsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQUVELCtCQUErQjtBQUMvQixLQUFLLFVBQVUsbUJBQW1CLENBQUMsTUFBYztJQUMvQyxNQUFNLEtBQUssR0FBRyxxQkFBcUIsQ0FBQztJQUVwQyxpQ0FBaUM7SUFDakMsTUFBTSxjQUFjLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUN2Qyw0Q0FBNEMsRUFDNUMsQ0FBQyxLQUFLLENBQUMsQ0FDUixDQUFDO0lBRUYsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNuQyxPQUFPLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ25DLENBQUM7SUFFRCxrRUFBa0U7SUFDbEUsTUFBTSxlQUFlLEdBQUcsNEJBQTRCLENBQUM7SUFFckQsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUMvQjs7a0JBRWMsRUFDZCxDQUFDLGdCQUFnQixFQUFFLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FDM0MsQ0FBQztJQUVGLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDM0IsQ0FBQztBQUVELDJCQUEyQjtBQUMzQixLQUFLLFVBQVUsb0JBQW9CLENBQ2pDLE1BQWMsRUFDZCxjQUE4QixFQUM5QixPQUFzQixFQUN0QixlQUF1QjtJQUV2QixnQ0FBZ0M7SUFDaEMsTUFBTSxTQUFTLEdBQUcsTUFBTSxhQUFhLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQzlELE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUVuQixxQ0FBcUM7SUFDckMsTUFBTSxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUVwRSxpQ0FBaUM7SUFDakMsTUFBTSxjQUFjLENBQUMsTUFBTSxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFakUsNENBQTRDO0lBQzVDLE1BQU0saUJBQWlCLENBQUMsTUFBTSxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFcEUsK0NBQStDO0lBQy9DLE1BQU0sb0JBQW9CLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDL0UsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3JCLENBQUM7QUFFRCxnREFBZ0Q7QUFDaEQsS0FBSyxVQUFVLGFBQWEsQ0FDMUIsTUFBYyxFQUNkLGNBQThCO0lBRTlCLE1BQU0sU0FBUyxHQUNiLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQ3BDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxLQUFLLG1CQUFtQixDQUN0RCxFQUFFLEtBQUssSUFBSSxJQUFJLENBQUM7SUFFbkIsTUFBTSxRQUFRLEdBQ1osY0FBYyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FDcEMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLEtBQUssYUFBYSxDQUNoRCxFQUFFLEtBQUssSUFBSSxJQUFJLENBQUM7SUFFbkIscUNBQXFDO0lBQ3JDLE1BQU0sZUFBZSxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FDeEMsb0RBQW9ELEVBQ3BELENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUNyQixDQUFDO0lBRUYsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNwQywwQkFBMEI7UUFDMUIsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUNoQjs7K0JBRXlCLEVBQ3pCO1lBQ0UsY0FBYyxDQUFDLElBQUk7WUFDbkIsU0FBUztZQUNULFFBQVE7WUFDUixjQUFjLENBQUMsS0FBSyxJQUFJLENBQUM7WUFDekIsY0FBYyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsVUFBVTtZQUNuRCxjQUFjLENBQUMsR0FBRztTQUNuQixDQUNGLENBQUM7UUFDRixPQUFPLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ3BDLENBQUM7U0FBTSxDQUFDO1FBQ04scUJBQXFCO1FBQ3JCLE1BQU0sTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FDL0I7O29CQUVjLEVBQ2Q7WUFDRSxjQUFjLENBQUMsR0FBRztZQUNsQixjQUFjLENBQUMsSUFBSTtZQUNuQixTQUFTO1lBQ1QsUUFBUTtZQUNSLGNBQWMsQ0FBQyxLQUFLLElBQUksQ0FBQztZQUN6QixjQUFjLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxVQUFVO1NBQ3BELENBQ0YsQ0FBQztRQUNGLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDM0IsQ0FBQztBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxLQUFLLFVBQVUsaUJBQWlCLENBQzlCLE1BQWMsRUFDZCxjQUE4QixFQUM5QixTQUFpQixFQUNqQixPQUFzQjtJQUV0QixJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDdEMsT0FBTztJQUNULENBQUM7SUFFRCxPQUFPLENBQUMsR0FBRyxDQUNULGtCQUFrQixjQUFjLENBQUMsaUJBQWlCLENBQUMsTUFBTSxtQkFBbUIsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUNqRyxDQUFDO0lBRUYsS0FBSyxNQUFNLFVBQVUsSUFBSSxjQUFjLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxRCw0Q0FBNEM7UUFDNUMsSUFDRSxVQUFVLENBQUMsS0FBSyxLQUFLLElBQUk7WUFDekIsVUFBVSxDQUFDLEtBQUssS0FBSyxTQUFTO1lBQzlCLFVBQVUsQ0FBQyxLQUFLLEtBQUssRUFBRSxFQUN2QixDQUFDO1lBQ0QsU0FBUztRQUNYLENBQUM7UUFFRCxnREFBZ0Q7UUFDaEQsTUFBTSxjQUFjLEdBQUc7WUFDckIsYUFBYTtZQUNiLG1CQUFtQjtZQUNuQixZQUFZO1lBQ1osY0FBYztZQUNkLGtCQUFrQjtZQUNsQixjQUFjO1lBQ2QsbUJBQW1CO1lBQ25CLGtCQUFrQjtZQUNsQixhQUFhO1lBQ2IsU0FBUztZQUNULFVBQVU7U0FDWCxDQUFDO1FBRUYsSUFBSSxjQUFjLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO1lBQ3ZELFNBQVM7UUFDWCxDQUFDO1FBRUQsSUFBSSxDQUFDO1lBQ0gsMEJBQTBCO1lBQzFCLE1BQU0sV0FBVyxHQUFHLE1BQU0sZUFBZSxDQUN2QyxNQUFNLEVBQ04sVUFBVSxDQUFDLGNBQWMsQ0FDMUIsQ0FBQztZQUNGLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUVyQixnQ0FBZ0M7WUFDaEMsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLG9CQUFvQixDQUNqRCxNQUFNLEVBQ04sV0FBVyxFQUNYLFVBQVUsQ0FBQyxLQUFLLEVBQ2hCLFVBQVUsQ0FBQyxjQUFjLENBQzFCLENBQUM7WUFDRixPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7WUFFMUIsMENBQTBDO1lBQzFDLE1BQU0sc0JBQXNCLENBQzFCLE1BQU0sRUFDTixTQUFTLEVBQ1QsV0FBVyxFQUNYLGdCQUFnQixDQUNqQixDQUFDO1FBQ0osQ0FBQztRQUFDLE9BQU8sU0FBYyxFQUFFLENBQUM7WUFDeEIsT0FBTyxDQUFDLEtBQUssQ0FDWCxvQ0FBb0MsVUFBVSxDQUFDLGNBQWMsR0FBRyxFQUNoRSxTQUFTLENBQUMsT0FBTyxDQUNsQixDQUFDO1lBQ0YsK0NBQStDO1FBQ2pELENBQUM7SUFDSCxDQUFDO0FBQ0gsQ0FBQztBQUVELG1CQUFtQjtBQUNuQixLQUFLLFVBQVUsZUFBZSxDQUM1QixNQUFjLEVBQ2QsYUFBcUI7SUFFckIsTUFBTSxjQUFjLEdBQUcsYUFBYTtTQUNqQyxLQUFLLENBQUMsR0FBRyxDQUFDO1NBQ1YsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDM0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRWIsdUNBQXVDO0lBQ3ZDLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUMxQyx3REFBd0QsRUFDeEQsQ0FBQyxhQUFhLENBQUMsQ0FDaEIsQ0FBQztJQUVGLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUN0Qyw0QkFBNEI7UUFDNUIsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUNoQixtRkFBbUYsRUFDbkYsQ0FBQyxjQUFjLEVBQUUsYUFBYSxDQUFDLENBQ2hDLENBQUM7UUFDRixPQUFPLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDdEMsQ0FBQztTQUFNLENBQUM7UUFDTix1QkFBdUI7UUFDdkIsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUMvQjs7b0JBRWMsRUFDZCxDQUFDLGFBQWEsRUFBRSxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQ3hDLENBQUM7UUFDRixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQzNCLENBQUM7QUFDSCxDQUFDO0FBRUQseUJBQXlCO0FBQ3pCLEtBQUssVUFBVSxvQkFBb0IsQ0FDakMsTUFBYyxFQUNkLFdBQW1CLEVBQ25CLEtBQVUsRUFDVixhQUFxQjtJQUVyQiwrQkFBK0I7SUFDL0IsSUFBSSxjQUFjLEdBQVcsS0FBSyxDQUFDO0lBQ25DLElBQUksSUFBSSxHQUFRLElBQUksQ0FBQztJQUVyQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUN6QixjQUFjLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQyxJQUFJLEdBQUcsRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQztJQUNuRCxDQUFDO1NBQU0sSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ3ZELGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZDLElBQUksR0FBRyxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsQ0FBQztJQUNyQyxDQUFDO1NBQU0sQ0FBQztRQUNOLGNBQWMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVELHdDQUF3QztJQUN4QyxJQUFJLGNBQWMsQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDaEMsY0FBYyxHQUFHLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRCw2Q0FBNkM7SUFDN0MsTUFBTSxhQUFhLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUN0QywyRUFBMkUsRUFDM0UsQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQzlCLENBQUM7SUFFRixJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ2xDLE9BQU8sYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDbEMsQ0FBQztTQUFNLENBQUM7UUFDTiw2QkFBNkI7UUFDN0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUMvQjs7b0JBRWMsRUFDZCxDQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDbEUsQ0FBQztRQUNGLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDM0IsQ0FBQztBQUNILENBQUM7QUFFRCxxREFBcUQ7QUFDckQsS0FBSyxVQUFVLHNCQUFzQixDQUNuQyxNQUFjLEVBQ2QsU0FBaUIsRUFDakIsV0FBbUIsRUFDbkIsZ0JBQXdCO0lBRXhCLHlDQUF5QztJQUN6QyxNQUFNLFlBQVksR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQ3JDOzZFQUN5RSxFQUN6RSxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsQ0FDM0MsQ0FBQztJQUVGLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDbkMsa0JBQWtCO1FBQ2xCLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FDaEI7MkJBQ3FCLEVBQ3JCLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUMzQyxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILEtBQUssVUFBVSxjQUFjLENBQzNCLE1BQWMsRUFDZCxjQUE4QixFQUM5QixTQUFpQixFQUNqQixPQUFzQjtJQUV0QixNQUFNLE9BQU8sR0FBRyxjQUFjLENBQUMscUJBQXFCLElBQUksRUFBRSxDQUFDO0lBQzNELElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDcEIsT0FBTztJQUNULENBQUM7SUFFRCxPQUFPLENBQUMsR0FBRyxDQUNULGtCQUFrQixPQUFPLENBQUMsTUFBTSx1QkFBdUIsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUM1RSxDQUFDO0lBRUYsS0FBSyxNQUFNLEtBQUssSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUM1QixJQUFJLENBQUM7WUFDSCxNQUFNLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckQsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFBQyxPQUFPLEdBQVEsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sQ0FBQyxLQUFLLENBQ1gsNENBQTRDLGNBQWMsQ0FBQyxHQUFHLEdBQUcsRUFDakUsR0FBRyxDQUFDLE9BQU8sQ0FDWixDQUFDO1FBQ0osQ0FBQztJQUNILENBQUM7QUFDSCxDQUFDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxLQUFpRDtJQUM1RSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztJQUVoQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUM1QixPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztRQUNqRSxPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDO0lBRUQscURBQXFEO0lBQ3JELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRCw4QkFBOEI7QUFDOUIsS0FBSyxVQUFVLG9CQUFvQixDQUNqQyxNQUFjLEVBQ2QsU0FBaUIsRUFDakIsS0FBaUQ7SUFFakQsTUFBTSxTQUFTLEdBQUcsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0MsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLDJCQUEyQjtJQUV6RCxpREFBaUQ7SUFDakQsTUFBTSxRQUFRLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUNqQyx3RUFBd0UsRUFDeEUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQ3ZCLENBQUM7SUFFRixJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQzdCLGdDQUFnQztRQUNoQyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQ2hCOztxQkFFZSxFQUNmLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FDOUMsQ0FBQztJQUNKLENBQUM7U0FBTSxDQUFDO1FBQ04sTUFBTSxNQUFNLENBQUMsS0FBSyxDQUNoQjs2Q0FDdUMsRUFDdkMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQy9DLENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQztBQUVEOztHQUVHO0FBQ0gsb0NBQW9DO0FBQ3BDLG9CQUFvQjtBQUNwQixvQ0FBb0M7QUFDcEMsdUJBQXVCO0FBQ3ZCLDJCQUEyQjtBQUMzQixNQUFNO0FBQ04scUZBQXFGO0FBQ3JGLGlDQUFpQztBQUNqQyxjQUFjO0FBQ2QsTUFBTTtBQUVOLGlCQUFpQjtBQUNqQixvRkFBb0Y7QUFDcEYsT0FBTztBQUVQLHdDQUF3QztBQUN4QyxrREFBa0Q7QUFDbEQsd0NBQXdDO0FBRXhDLFlBQVk7QUFDWiw0RUFBNEU7QUFDNUUsOEJBQThCO0FBRTlCLG9FQUFvRTtBQUNwRSxxQ0FBcUM7QUFDckMsMkJBQTJCO0FBQzNCLHVCQUF1QjtBQUN2Qiw0RkFBNEY7QUFDNUYsc0JBQXNCO0FBQ3RCLFdBQVc7QUFDWCxRQUFRO0FBQ1IsTUFBTTtBQUNOLElBQUk7QUFFSiw2QkFBNkI7QUFDN0IsaUNBQWlDO0FBQ2pDLG9CQUFvQjtBQUNwQiw4QkFBOEI7QUFDOUIsdUJBQXVCO0FBQ3ZCLDhFQUE4RTtBQUM5RSwwREFBMEQ7QUFDMUQsNkRBQTZEO0FBRTdELHFDQUFxQztBQUNyQyx5Q0FBeUM7QUFDekMsNkRBQTZEO0FBQzdELHNCQUFzQjtBQUN0QixPQUFPO0FBRVAsb0NBQW9DO0FBQ3BDLGtDQUFrQztBQUNsQyxNQUFNO0FBRU4sdUNBQXVDO0FBQ3ZDLHFGQUFxRjtBQUNyRiwrQ0FBK0M7QUFDL0Msc0JBQXNCO0FBQ3RCLG9GQUFvRjtBQUNwRixPQUFPO0FBRVAsOEJBQThCO0FBQzlCLElBQUk7QUFFSjs7R0FFRztBQUNILEtBQUssVUFBVSxpQkFBaUIsQ0FDOUIsTUFBYyxFQUNkLGNBQThCLEVBQzlCLFNBQWlCLEVBQ2pCLE9BQXNCO0lBRXRCLE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxvQkFBb0IsRUFBRSxjQUFjLElBQUksRUFBRSxDQUFDO0lBQ2hGLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDMUIsT0FBTztJQUNULENBQUM7SUFFRCxPQUFPLENBQUMsR0FBRyxDQUNULGtCQUFrQixhQUFhLENBQUMsTUFBTSxtQkFBbUIsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUM5RSxDQUFDO0lBRUYsS0FBSyxNQUFNLElBQUksSUFBSSxhQUFhLEVBQUUsQ0FBQztRQUNqQyxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztZQUFFLFNBQVM7UUFFN0QsSUFBSSxDQUFDO1lBQ0gsbURBQW1EO1lBQ25ELE1BQU0sVUFBVSxHQUFHLE1BQU0sdUJBQXVCLENBQUMsTUFBTSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFFNUUsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDZixNQUFNLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQzNELE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixjQUFjLENBQUMsR0FBRyxvQkFBb0IsVUFBVSxpQkFBaUIsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1lBQzdILENBQUM7aUJBQU0sQ0FBQztnQkFDTixPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FDbkIsK0NBQStDLGlCQUFpQixlQUFlLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FDcEcsQ0FBQztnQkFDRixPQUFPLENBQUMsSUFBSSxDQUFDLG1CQUFtQixpQkFBaUIsMEJBQTBCLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ25HLENBQUM7UUFDSCxDQUFDO1FBQUMsT0FBTyxHQUFRLEVBQUUsQ0FBQztZQUNsQixPQUFPLENBQUMsS0FBSyxDQUNYLG1DQUFtQyxJQUFJLENBQUMsV0FBVyxRQUFRLGNBQWMsQ0FBQyxHQUFHLEdBQUcsRUFDaEYsR0FBRyxDQUFDLE9BQU8sQ0FDWixDQUFDO1FBQ0osQ0FBQztJQUNILENBQUM7QUFDSCxDQUFDO0FBRUQsK0RBQStEO0FBQy9ELEtBQUssVUFBVSx1QkFBdUIsQ0FBQyxNQUFjLEVBQUUsU0FBaUI7SUFDdEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUMvQiwyREFBMkQsRUFDM0QsQ0FBQyxTQUFTLENBQUMsQ0FDWixDQUFDO1FBRUYsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUMzQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLGtEQUFrRCxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQzNFLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQywrQ0FBK0MsU0FBUyxHQUFHLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFGLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztBQUNILENBQUM7QUFHRCxpQ0FBaUM7QUFDakMsS0FBSyxVQUFVLHFCQUFxQixDQUNsQyxNQUFjLEVBQ2QsU0FBaUIsRUFDakIsVUFBa0I7SUFFbEIsTUFBTSxRQUFRLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUNqQyxpRkFBaUYsRUFDakYsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQ3hCLENBQUM7SUFFRixJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQy9CLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FDaEI7OEJBQ3dCLEVBQ3hCLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUN4QixDQUFDO0lBQ0osQ0FBQztBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxLQUFLLFVBQVUsb0JBQW9CLENBQ2pDLE1BQWMsRUFDZCxTQUFpQixFQUNqQixRQUFnQixFQUNoQixjQUE4QjtJQUU5QixxQ0FBcUM7SUFDckMsTUFBTSxlQUFlLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUN4Qyw2RUFBNkUsRUFDN0UsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQ3RCLENBQUM7SUFFRixNQUFNLEtBQUssR0FBRyxjQUFjLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztJQUN4QyxNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7SUFDbkUsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLENBQUMsa0RBQWtEO0lBRTNFLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDcEMsMEJBQTBCO1FBQzFCLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FDaEI7O2dEQUUwQyxFQUMxQyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FDbkQsQ0FBQztJQUNKLENBQUM7U0FBTSxDQUFDO1FBQ04scUJBQXFCO1FBQ3JCLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FDaEI7aURBQzJDLEVBQzNDLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUNuRCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMifQ==