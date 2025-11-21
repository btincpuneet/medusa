import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function createClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
  });
}

// ===============================
// GET: Fetch all categories
// ===============================
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const client = createClient();
    await client.connect();

    const result = await client.query("SELECT * FROM category ORDER BY id DESC");

    await client.end();

    return res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
}

// ===============================
// POST: Create new category
// ===============================
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
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
      `INSERT INTO category 
        (name, url, parent_id, description, cat_ass_desc, meta_title, meta_desc, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
       RETURNING *`,
      [
        name,
        url,
        parent_id || null,
        description,
        cat_ass_desc,
        meta_title,
        meta_desc,
        status ?? true
      ]
    );

    await client.end();

    return res.json({
      success: true,
      category: result.rows[0],
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
}
