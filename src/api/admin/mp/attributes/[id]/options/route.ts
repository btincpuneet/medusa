// app/admin/mp/attributes/[id]/options/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// ====================================
// Get all options for an attribute
// ====================================

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    const { id } = req.params;

    // First get attribute details
    const attributeQuery = "SELECT * FROM mp_attributes WHERE id = $1";
    const attributeResult = await db.query(attributeQuery, [id]);
    
    if (attributeResult.rows.length === 0) {
      await db.end();
      return res.status(404).json({
        success: false,
        message: "Attribute not found"
      });
    }

    const attribute = attributeResult.rows[0];
    
    // Check if attribute type supports options
    if (!['select', 'multiselect'].includes(attribute.attribute_type)) {
      await db.end();
      return res.json({
        success: true,
        attribute,
        options: [],
        message: "This attribute type does not support options"
      });
    }

    // Get options
    const optionsQuery = `
      SELECT * FROM mp_attribute_values 
      WHERE attribute_id = $1 
      ORDER BY sort_order, value
    `;
    const optionsResult = await db.query(optionsQuery, [id]);

    await db.end();

    return res.json({
      success: true,
      attribute,
      options: optionsResult.rows,
      count: optionsResult.rows.length
    });
  } catch (error: any) {
    console.error("Error fetching attribute options:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attribute options",
      error: error.message
    });
  }
}

// ====================================
// Add new option to attribute
// ====================================

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    const { id } = req.params;
    const {
      value,
      label = null,
      meta = null,
      swatch_type = "text",
      swatch_value = null,
      sort_order = 0,
      is_default = false
    } = req.body;

    // Validate required fields
    if (!value) {
      return res.status(400).json({
        success: false,
        message: "Option value is required"
      });
    }

    // Check if attribute exists and supports options
    const attributeQuery = "SELECT * FROM mp_attributes WHERE id = $1";
    const attributeResult = await db.query(attributeQuery, [id]);
    
    if (attributeResult.rows.length === 0) {
      await db.end();
      return res.status(404).json({
        success: false,
        message: "Attribute not found"
      });
    }

    const attribute = attributeResult.rows[0];
    
    if (!['select', 'multiselect'].includes(attribute.attribute_type)) {
      await db.end();
      return res.status(400).json({
        success: false,
        message: "This attribute type does not support options"
      });
    }

    // Check if option value already exists for this attribute
    const checkQuery = `
      SELECT id FROM mp_attribute_values 
      WHERE attribute_id = $1 AND value = $2
    `;
    const checkResult = await db.query(checkQuery, [id, value]);
    
    if (checkResult.rows.length > 0) {
      await db.end();
      return res.status(400).json({
        success: false,
        message: `Option with value '${value}' already exists for this attribute`
      });
    }

    // If setting as default, remove default from other options
    if (is_default) {
      await db.query(
        "UPDATE mp_attribute_values SET is_default = false WHERE attribute_id = $1",
        [id]
      );
    }

    const insertQuery = `
      INSERT INTO mp_attribute_values (
        attribute_id, value, label, meta, 
        swatch_type, swatch_value, sort_order, is_default,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      id,
      value,
      label || value, // Use value as label if label not provided
      meta,
      swatch_type,
      swatch_value,
      sort_order,
      is_default
    ]);

    await db.end();

    return res.json({
      success: true,
      message: "Option added successfully",
      option: result.rows[0]
    });
  } catch (error: any) {
    console.error("Error adding attribute option:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add attribute option",
      error: error.message
    });
  }
}