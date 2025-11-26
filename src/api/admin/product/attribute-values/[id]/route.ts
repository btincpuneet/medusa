import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function createClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
  });
}

// ===============================
// GET: Fetch single attribute value
// ===============================
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;

    const client = createClient();
    await client.connect();

    const result = await client.query(
      "SELECT * FROM attribute_values WHERE id = $1",
      [id]
    );

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attribute value not found",
      });
    }

    return res.json({
      success: true,
      attribute_value: result.rows[0]
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attribute value",
      error: error.message,
    });
  }
}

// ===============================
// PUT: Update attribute value
// ===============================
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const { attribute_id, value, meta } = req.body;

    const client = createClient();
    await client.connect();

    const result = await client.query(
      `UPDATE attribute_values SET
        attribute_id = $1,
        value = $2,
        meta = $3,
        updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [attribute_id, value, meta || null, id]
    );

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attribute value not found",
      });
    }

    return res.json({
      success: true,
      attribute_value: result.rows[0]
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update attribute value",
      error: error.message,
    });
  }
}

// ===============================
// DELETE: Remove attribute value
// ===============================
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;

    const client = createClient();
    await client.connect();

    const result = await client.query(
      "DELETE FROM attribute_values WHERE id = $1 RETURNING id",
      [id]
    );

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attribute value not found",
      });
    }

    return res.json({
      success: true,
      message: "Attribute value deleted",
      id: result.rows[0].id
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete attribute value",
      error: error.message,
    });
  }
}
