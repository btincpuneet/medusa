import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function createClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
  });
}

// ===============================
// GET: Fetch Regions by country id
// ===============================
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params; // This should be country_id
    const client = createClient();
    await client.connect();

    // Query by country_id instead of region id
    const result = await client.query(
      "SELECT * FROM mp_regions WHERE country_id = $1 ORDER BY name",
      [id]
    );

    await client.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No regions found for this country" });
    }

    return res.json({
      success: true,
      regions: result.rows, // Return all rows, not just the first one
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch regions",
      error: error.message,
    });
  }
}