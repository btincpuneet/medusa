import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// ====================================
// Returns all countries
// ====================================

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    const result = await db.query(
      "SELECT id, name, status FROM mp_countries WHERE status = 'active' ORDER BY id"
    );

    await db.end();

    return res.json({
      success: true,
      countries: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch countries",
      error: error.message,
    });
  }
}