import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function createClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
  });
}

// ===============================
// GET: Fetch all attributes
// ===============================
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const client = createClient();
    await client.connect();

    const result = await client.query(
      "SELECT * FROM attributes ORDER BY id DESC"
    );

    await client.end();

    return res.json({
      success: true,
      attributes: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attributes",
      error: error.message,
    });
  }
}

// ===============================
// POST: Create new attribute
// ===============================
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { attribute_code, label, attribute_type } = req.body;

    const client = createClient();
    await client.connect();

    const result = await client.query(
      `INSERT INTO attributes
        (attribute_code, label, attribute_type, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [attribute_code, label, attribute_type || "text"]
    );

    await client.end();

    return res.json({
      success: true,
      attribute: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create attribute",
      error: error.message,
    });
  }
}
