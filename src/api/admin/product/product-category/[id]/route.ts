import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const result = await client.query(
      `
      SELECT pc.*, 
             p.title as product_name,
             c.name as category_name
      FROM product_categories pc
      LEFT JOIN products p ON p.id = pc.product_id
      LEFT JOIN category c ON c.id = pc.category_id
      WHERE pc.id = $1
      `,
      [id]
    );

    await client.end();

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Mapping not found" });
    }

    return res.json({ success: true, data: result.rows[0] });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mapping",
      error: error.message,
    });
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const { product_id, category_id } = req.body;

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const result = await client.query(
      `
      UPDATE product_categories
      SET product_id = $1, category_id = $2
      WHERE id = $3
      RETURNING *
      `,
      [product_id, category_id, id]
    );

    await client.end();

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Mapping not found" });
    }

    return res.json({
      success: true,
      message: "Mapping updated successfully",
      data: result.rows[0],
    });

  } catch (error: any) {
    console.error("PUT mapping error:", error);

    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "Duplicate mapping — product_id + category_id already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update mapping",
      error: error.message,
    });
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const result = await client.query(
      `DELETE FROM product_categories WHERE id = $1`,
      [id]
    );

    await client.end();

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Mapping not found" });
    }

    return res.json({
      success: true,
      message: "Mapping deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete mapping",
      error: error.message,
    });
  }
}
