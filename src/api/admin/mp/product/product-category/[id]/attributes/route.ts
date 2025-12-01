import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function createClient() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const categoryId = req.params.id;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const client = createClient();
    await client.connect();

    // Step 1: Fetch attribute IDs mapped to the category
    const attrMap = await client.query(
      `
      SELECT attribute_id 
      FROM mp_category_attributes 
      WHERE category_id = $1
      `,
      [categoryId]
    );

    const attributeIds = attrMap.rows.map(r => r.attribute_id);

    if (attributeIds.length === 0) {
      await client.end();
      return res.json({
        success: true,
        attributes: [],
      });
    }

    // Step 2: Fetch attributes
    const attrs = await client.query(
      `
      SELECT * FROM mp_attributes 
      WHERE id = ANY($1)
      ORDER BY sort_order ASC
      `,
      [attributeIds]
    );

    // Step 3: Fetch values for all these attributes
    const values = await client.query(
      `
      SELECT * 
      FROM mp_attribute_values
      WHERE attribute_id = ANY($1)
      `,
      [attributeIds]
    );

    // Group values
    const groupedValues = {};
    values.rows.forEach(v => {
      if (!groupedValues[v.attribute_id]) groupedValues[v.attribute_id] = [];
      groupedValues[v.attribute_id].push(v);
    });

    // Attach values to attributes
    const final = attrs.rows.map(a => ({
      ...a,
      values: groupedValues[a.id] || [],
    }));

    await client.end();

    return res.json({
      success: true,
      attributes: final,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category attributes",
      error: error.message,
    });
  }
}
