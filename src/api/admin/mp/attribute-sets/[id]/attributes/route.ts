import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function createClient() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Attribute set ID is required",
    });
  }

  const client = createClient();

  try {
    await client.connect();

    // Step 1: fetch attribute IDs from mapping table
    const attrMap = await client.query(
      `
      SELECT attribute_id
      FROM mp_attribute_set_groups
      WHERE attribute_set_id = $1
      `,
      [id]
    );

    const attributeIds = attrMap.rows.map((r) => r.attribute_id);

    if (attributeIds.length === 0) {
      await client.end();
      return res.json({
        success: true,
        attributes: [],
      });
    }

    // Step 2: fetch attributes
    const attrs = await client.query(
      `
      SELECT *
      FROM mp_attributes
      WHERE id = ANY($1)
      ORDER BY sort_order ASC
      `,
      [attributeIds]
    );

    // Step 3: fetch predefined attribute values
    const values = await client.query(
      `
      SELECT *
      FROM mp_attribute_values
      WHERE attribute_id = ANY($1)
      ORDER BY sort_order ASC
      `,
      [attributeIds]
    );

    // Step 4: group values by attribute_id
    const groupedValues: Record<number, any[]> = {};
    values.rows.forEach((v) => {
      if (!groupedValues[v.attribute_id]) groupedValues[v.attribute_id] = [];
      groupedValues[v.attribute_id].push(v);
    });

    // Step 5: attach values to attributes only if they exist
    const final = attrs.rows.map((a) => {
      const vals = groupedValues[a.id];
      return {
        ...a,
        values: vals && vals.length > 0 ? vals : null,
      };
    });

    await client.end();

    return res.json({
      success: true,
      attributes: final,
    });

  } catch (error) {
    await client.end();
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category attributes",
      error: error.message,
    });
  }
}
