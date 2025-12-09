import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// ====================================
// Returns all Attribute Sets
// ====================================

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    const result = await db.query(
      "SELECT id, name, status FROM mp_attribute_sets ORDER BY id"
    );

    await db.end();

    return res.json({
      success: true,
      attributesets: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attribute sets",
      error: error.message,
    });
  }
}