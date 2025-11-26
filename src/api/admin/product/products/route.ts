import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// ====================================
// GET – Fetch all products
// ====================================
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    // Read query parameter “q”
    const search = req.query.q ? String(req.query.q).trim() : "";

    let result;

    if (search !== "") {
      // 🔍 Filter by name or product_code
      result = await db.query(
        `
        SELECT * FROM products
        WHERE 
          LOWER(name) LIKE LOWER($1)
          OR LOWER(product_code) LIKE LOWER($1)
        ORDER BY id DESC
        `,
        [`%${search}%`]
      );
    } else {
      // No search → return all products
      result = await db.query(
        "SELECT * FROM products ORDER BY id DESC"
      );
    }

    await db.end();

    return res.json({ success: true, products: result.rows });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message
    });
  }
}


// ====================================
// POST – Create product (multi-table insert)
// ====================================
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const {
    product_code,
    name,
    short_desc,
    long_desc,
    base_price,
    status,
    gallery = [],
    categories = [],
    attributes = []
  } = req.body;

  const db = client();
  await db.connect();

  try {
    await db.query("BEGIN");

    // 1. Insert product
    const productResult = await db.query(
      `INSERT INTO products
        (product_code, name, short_desc, long_desc, base_price, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
       RETURNING *`,
      [product_code, name, short_desc, long_desc, base_price, status ?? "active"]
    );

    const product = productResult.rows[0];
    const productId = product.id;

    // 2. Insert gallery images
    for (const g of gallery) {
      await db.query(
        `INSERT INTO product_gallery
          (product_id, image_type, label, image, created_at, updated_at)
         VALUES ($1,$2,$3,$4,NOW(),NOW())`,
        [productId, g.image_type, g.label, g.image]
      );
    }

    // 3. Insert categories
    for (const catId of categories) {
      await db.query(
        `INSERT INTO product_categories
          (product_id, category_id, created_at)
         VALUES ($1,$2,NOW())`,
        [productId, catId]
      );
    }

    // 4. Insert attributes
    for (const attr of attributes) {
      await db.query(
        `INSERT INTO product_attributes
          (product_id, attribute_id, attribute_value_id)
         VALUES ($1,$2,$3)`,
        [productId, attr.attribute_id, attr.attribute_value_id]
      );
    }

    await db.query("COMMIT");
    await db.end();

    return res.json({
      success: true,
      product,
      message: "Product created successfully"
    });

  } catch (err) {
    await db.query("ROLLBACK");
    await db.end();
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: err.message
    });
  }
}
