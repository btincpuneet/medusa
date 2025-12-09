import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function createClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
  });
}

// ===============================
// GET: Fetch single category
// ===============================
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const client = createClient();
    await client.connect();

    const result = await client.query(
      "SELECT * FROM mp_categories WHERE id = $1",
      [id]
    );

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.json({
      success: true,
      category: result.rows[0],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
}

// ===============================
// PUT: Update category
// ===============================
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const {
      name,
      url,
      parent_id,
      description,
      cat_ass_desc,
      meta_title,
      meta_desc,
      status
    } = req.body;

    const client = createClient();
    await client.connect();

    const result = await client.query(
      `UPDATE mp_categories SET
        name = $1,
        url = $2,
        parent_id = $3,
        description = $4,
        cat_ass_desc = $5,
        meta_title = $6,
        meta_desc = $7,
        status = $8,
        updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        name,
        url,
        parent_id || null,
        description,
        cat_ass_desc,
        meta_title,
        meta_desc,
        status,
        id
      ]
    );

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.json({
      success: true,
      category: result.rows[0],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
}

// ===============================
// DELETE: Remove category
// ===============================
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const client = createClient();
    await client.connect();

    const result = await client.query(
      "DELETE FROM mp_categories WHERE id = $1 RETURNING id",
      [id]
    );

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.json({
      success: true,
      message: "Category deleted",
      id: result.rows[0].id
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
}
