"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("pg");
function createClient() {
    return new pg_1.Client({
        connectionString: process.env.DATABASE_URL,
    });
}
// ===============================
// GET: Fetch product details with all joins
// ===============================
async function GET(req, res) {
    try {
        const { product_code } = req.query;
        if (!product_code) {
            return res.status(400).json({
                success: false,
                message: "Product code is required",
            });
        }
        const client = createClient();
        await client.connect();
        const query = `
      SELECT 
        -- Product basic info
        p.id AS product_id,
        p.product_code,
        p.name AS product_name,
        p.short_desc,
        p.long_desc,
        p.base_price,
        p.status AS product_status,
        p.created_at AS product_created,
        p.updated_at AS product_updated,
        
        -- Seller/Listing info
        s.id AS seller_id,
        s.name AS seller_name,
        s.email AS seller_email,
        pl.price AS listing_price,
        pl.stock AS listing_stock,
        pl.status AS listing_status,
        
        -- Categories
        c.id AS category_id,
        c.name AS category_name,
        c.magento_category_id,
        c.url AS category_url,
        c.level AS category_level,
        c.position AS category_position,
        
        -- Gallery images
        pg.id AS gallery_id,
        pg.image_type,
        pg.label AS image_label,
        pg.image AS image_path,
        
        -- Attributes
        a.id AS attribute_id,
        a.attribute_code,
        a.label AS attribute_label,
        a.attribute_type,
        av.id AS attribute_value_id,
        av.value AS attribute_value,
        av.meta AS attribute_meta
        
      FROM mp_products p

      -- Seller and Listing info
      LEFT JOIN mp_product_listings pl ON p.id = pl.product_id
      LEFT JOIN mp_sellers s ON pl.seller_id = s.id

      -- Categories (through product_categories junction table)
      LEFT JOIN mp_product_categories pc ON p.id = pc.product_id
      LEFT JOIN mp_categories c ON pc.category_id = c.id

      -- Gallery images
      LEFT JOIN mp_product_gallery pg ON p.id = pg.product_id

      -- Attributes (through product_attributes and attribute_values)
      LEFT JOIN mp_product_attributes pa ON p.id = pa.product_id
      LEFT JOIN mp_attributes a ON pa.attribute_id = a.id
      LEFT JOIN mp_attribute_values av ON pa.attribute_value_id = av.id

      WHERE p.product_code = $1
      ORDER BY 
        c.level DESC,
        pg.image_type,
        a.attribute_code
    `;
        const result = await client.query(query, [product_code]);
        await client.end();
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        // Transform the flat result into a structured object
        const productData = transformProductData(result.rows);
        return res.json({
            success: true,
            product: productData,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch product details",
            error: error.message,
        });
    }
}
// Helper function to transform flat SQL result into structured object
function transformProductData(rows) {
    if (rows.length === 0)
        return null;
    const firstRow = rows[0];
    // Basic product info (from first row since it's the same for all)
    const product = {
        id: firstRow.product_id,
        product_code: firstRow.product_code,
        name: firstRow.product_name,
        short_desc: firstRow.short_desc,
        long_desc: firstRow.long_desc,
        base_price: firstRow.base_price,
        status: firstRow.product_status,
        created_at: firstRow.product_created,
        updated_at: firstRow.product_updated,
        seller: {
            id: firstRow.seller_id,
            name: firstRow.seller_name,
            email: firstRow.seller_email,
        },
        listing: {
            price: firstRow.listing_price,
            stock: firstRow.listing_stock,
            status: firstRow.listing_status,
        },
        categories: [],
        gallery: [],
        attributes: []
    };
    // Use Sets to avoid duplicates
    const categoriesMap = new Map();
    const galleryMap = new Map();
    const attributesMap = new Map();
    rows.forEach(row => {
        // Process categories
        if (row.category_id && !categoriesMap.has(row.category_id)) {
            categoriesMap.set(row.category_id, {
                id: row.category_id,
                name: row.category_name,
                magento_category_id: row.magento_category_id,
                url: row.category_url,
                level: row.category_level,
                position: row.category_position
            });
        }
        // Process gallery images
        if (row.gallery_id && !galleryMap.has(row.gallery_id)) {
            galleryMap.set(row.gallery_id, {
                id: row.gallery_id,
                image_type: row.image_type,
                label: row.image_label,
                image_path: row.image_path
            });
        }
        // Process attributes
        if (row.attribute_id && !attributesMap.has(row.attribute_id)) {
            attributesMap.set(row.attribute_id, {
                id: row.attribute_id,
                attribute_code: row.attribute_code,
                attribute_label: row.attribute_label,
                attribute_type: row.attribute_type,
                value: row.attribute_value,
                meta: row.attribute_meta
            });
        }
    });
    // Convert Maps to arrays
    product.categories = Array.from(categoriesMap.values());
    product.gallery = Array.from(galleryMap.values());
    product.attributes = Array.from(attributesMap.values());
    return product;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL3Byb2R1Y3QvcHJvZHVjdC1kZXRhaWxzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBYUEsa0JBMkdDO0FBdEhELDJCQUE0QjtBQUU1QixTQUFTLFlBQVk7SUFDbkIsT0FBTyxJQUFJLFdBQU0sQ0FBQztRQUNoQixnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7S0FDM0MsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELGtDQUFrQztBQUNsQyw0Q0FBNEM7QUFDNUMsa0NBQWtDO0FBQzNCLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsWUFBWSxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztRQUVuQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDbEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsT0FBTyxFQUFFLDBCQUEwQjthQUNwQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsWUFBWSxFQUFFLENBQUM7UUFDOUIsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFdkIsTUFBTSxLQUFLLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7S0FtRWIsQ0FBQztRQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRW5CLElBQUksTUFB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