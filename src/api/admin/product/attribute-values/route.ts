import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function createClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
  });
}

// ===============================
// GET: Fetch all attribute values
// Optional filter: ?attribute_id=1
// ===============================
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { attribute_id } = req.query;

    const client = createClient();
    await client.connect();

    let query = "SELECT * FROM attribute_values";
    let params: any[] = [];

    if (attribute_id) {
      query += " WHERE attribute_id = $1";
      params.push(attribute_id);
    }

    query += " ORDER BY id DESC";

    const result = await client.query(query, params);

    await client.end();

    return res.json({
      success: true,
      attribute_values: result.rows
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attribute values",
      error: error.message,
    });
  }
}

// ===============================
// POST: Create a new attribute value
// ===============================
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { attribute_id, value, meta } = req.body;

    const client = createClient();
    await client.connect();

    const result = await client.query(
      `INSERT INTO attribute_values 
        (attribute_id, value, meta, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [attribute_id, value, meta || null]
    );

    await client.end();

    return res.json({
      success: true,
      attribute_value: result.rows[0]
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create attribute value",
      error: error.message,
    });
  }
}
