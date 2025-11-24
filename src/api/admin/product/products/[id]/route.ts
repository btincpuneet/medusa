import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// ====================================
// GET – Fetch single product with relations
// ====================================
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;

  try {
    const db = client();
    await db.connect();

    const product = await db.query("SELECT * FROM products WHERE id = $1", [id]);
    if (product.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const gallery = await db.query(
      "SELECT * FROM product_gallery WHERE product_id = $1",
      [id]
    );

    const categories = await db.query(
      `SELECT c.* FROM category c 
       JOIN product_categories pc ON pc.category_id = c.id
       WHERE pc.product_id = $1`,
      [id]
    );

    const attributes = await db.query(
      `SELECT pa.*, a.label, av.value 
       FROM product_attributes pa
       JOIN attributes a ON a.id = pa.attribute_id
       JOIN attribute_values av ON av.id = pa.attribute_value_id
       WHERE pa.product_id = $1`,
      [id]
    );

    await db.end();

    return res.json({
      success: true,
      product: product.rows[0],
      gallery: gallery.rows,
      categories: categories.rows,
      attributes: attributes.rows
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: err.message
    });
  }
}

// ====================================
// PUT – Update product + relations
// ====================================
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;

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

    // 1. Update product
    await db.query(
      `UPDATE products SET
        product_code = $1,
        name = $2,
        short_desc = $3,
        long_desc = $4,
        base_price = $5,
        status = $6,
        updated_at = NOW()
       WHERE id = $7`,
      [product_code, name, short_desc, long_desc, base_price, status, id]
    );

    // 2. Reset & insert gallery
    await db.query("DELETE FROM product_gallery WHERE product_id = $1", [id]);
    for (const g of gallery) {
      await db.query(
        `INSERT INTO product_gallery (product_id, image_type, label, image_url, created_at, updated_at)
         VALUES ($1,$2,$3,$4,NOW(),NOW())`,
        [id, g.image_type, g.label, g.image_url]
      );
    }

    // 3. Reset & insert categories
    await db.query("DELETE FROM product_categories WHERE product_id = $1", [id]);
    for (const catId of categories) {
      await db.query(
        `INSERT INTO product_categories (product_id, category_id, created_at)
         VALUES ($1,$2,NOW())`,
        [id, catId]
      );
    }

    // 4. Reset & insert attributes
    await db.query("DELETE FROM product_attributes WHERE product_id = $1", [id]);
    for (const a of attributes) {
      await db.query(
        `INSERT INTO product_attributes (product_id, attribute_id, attribute_value_id, created_at, updated_at)
         VALUES ($1,$2,$3,NOW(),NOW())`,
        [id, a.attribute_id, a.attribute_value_id]
      );
    }

    await db.query("COMMIT");
    await db.end();

    return res.json({
      success: true,
      message: "Product updated successfully"
    });

  } catch (err) {
    await db.query("ROLLBACK");
    await db.end();
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: err.message
    });
  }
}

// ====================================
// DELETE – Remove product
// ====================================
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;

  try {
    const db = client();
    await db.connect();

    const result = await db.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id]
    );

    await db.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.json({
      success: true,
      message: "Product deleted",
      id: result.rows[0].id
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: err.message
    });
  }
}
