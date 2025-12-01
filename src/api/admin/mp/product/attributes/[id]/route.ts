import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function createClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
  });
}

// ===============================
// GET: Fetch single attribute
// ===============================
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const client = createClient();
    await client.connect();

    const result = await client.query(
      "SELECT * FROM mp_attributes WHERE id = $1",
      [id]
    );

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    return res.json({
      success: true,
      attribute: result.rows[0],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attribute",
      error: error.message,
    });
  }
}

// ===============================
// PUT: Update attribute
// ===============================
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const { attribute_code, label, attribute_type } = req.body;

    const client = createClient();
    await client.connect();

    const result = await client.query(
      `UPDATE mp_attributes SET
        attribute_code = $1,
        label = $2,
        attribute_type = $3,
        updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [attribute_code, label, attribute_type, id]
    );

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    return res.json({
      success: true,
      attribute: result.rows[0],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update attribute",
      error: error.message,
    });
  }
}

// ===============================
// DELETE: Remove attribute
// ===============================
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const client = createClient();
    await client.connect();

    const result = await client.query(
      "DELETE FROM mp_attributes WHERE id = $1 RETURNING id",
      [id]
    );

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    return res.json({
      success: true,
      message: "Attribute deleted",
      id: result.rows[0].id,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete attribute",
      error: error.message,
    });
  }
}
