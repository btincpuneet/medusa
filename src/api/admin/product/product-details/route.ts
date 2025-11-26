import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function createClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
  });
}

// ===============================
// GET: Fetch product details with all joins
// ===============================
export async function GET(req: MedusaRequest, res: MedusaResponse) {
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
        
      FROM products p

      -- Seller and Listing info
      LEFT JOIN product_listings pl ON p.id = pl.product_id
      LEFT JOIN sellers s ON pl.seller_id = s.id

      -- Categories (through product_categories junction table)
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN category c ON pc.category_id = c.id

      -- Gallery images
      LEFT JOIN product_gallery pg ON p.id = pg.product_id

      -- Attributes (through product_attributes and attribute_values)
      LEFT JOIN product_attributes pa ON p.id = pa.product_id
      LEFT JOIN attributes a ON pa.attribute_id = a.id
      LEFT JOIN attribute_values av ON pa.attribute_value_id = av.id

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
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product details",
      error: error.message,
    });
  }
}

// Helper function to transform flat SQL result into structured object
function transformProductData(rows: any[]) {
  if (rows.length === 0) return null;

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