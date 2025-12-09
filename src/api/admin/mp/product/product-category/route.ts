import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

/**
 * GET → List all product-category mappings
 * POST → Create new mapping
 */

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const result = await client.query(`
      SELECT pc.id, pc.product_id, pc.category_id, pc.created_at,
             p.title as product_name,
             c.name as category_name
      FROM mp_product_categories pc
      LEFT JOIN mp_products p ON p.id = pc.product_id
      LEFT JOIN mp_categories c ON c.id = pc.category_id
      ORDER BY pc.id DESC
    `);

    await client.end();

    return res.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.error("GET product-category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product categories",
      error: error.message,
    });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { product_id, category_id } = req.body;

    if (!product_id || !category_id) {
      return res.status(400).json({
        success: false,
        message: "product_id and category_id are required",
      });
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    // insert mapping
    const result = await client.query(
      `
      INSERT INTO mp_product_categories (product_id, category_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [product_id, category_id]
    );

    await client.end();

    return res.json({
      success: true,
      message: "Mapping created successfully",
      data: result.rows[0],
    });

  } catch (error: any) {
    console.error("POST product-category error:", error);

    // Handle unique constraint error
    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "Mapping already exists (product_id + category_id must be unique)",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create product-category mapping",
      error: error.message,
    });
  }
}
