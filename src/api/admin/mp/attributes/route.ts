// app/admin/mp/attributes/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// ====================================
// Returns all Attributes with filtering
// ====================================

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    // Get query parameters
    const { q: searchQuery = "", type = "all", entity = "all" } = req.query;
    
    let query = "SELECT * FROM mp_attributes WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    // Add search filter
    if (searchQuery && searchQuery !== "") {
      query += ` AND (attribute_code ILIKE $${paramIndex} OR label ILIKE $${paramIndex})`;
      params.push(`%${searchQuery}%`);
      paramIndex++;
    }

    // Add type filter
    if (type && type !== "all") {
      query += ` AND attribute_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Add entity filter
    if (entity && entity !== "all") {
      query += ` AND entity_type = $${paramIndex}`;
      params.push(entity);
      paramIndex++;
    }

    // Add ordering
    query += " ORDER BY sort_order, attribute_code";

    console.log("Executing query:", query, "Params:", params);

    const result = await db.query(query, params);

    await db.end();

    return res.json({
      success: true,
      attributes: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error("Error fetching attributes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attributes",
      error: error.message,
    });
  }
}

// ====================================
// Create a new Attribute
// ====================================

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    const {
      attribute_code,
      label,
      attribute_type,
      entity_type = "product",
      is_required = false,
      is_unique = false,
      is_filterable = false,
      is_searchable = true,
      is_variant = false,
      is_system = false,
      validation_rules = null,
      default_value = null,
      sort_order = 0
    } = req.body;

    // Validate required fields
    if (!attribute_code || !label || !attribute_type) {
      return res.status(400).json({
        success: false,
        message: "attribute_code, label, and attribute_type are required"
      });
    }

    // Check if attribute code already exists
    const checkQuery = "SELECT id FROM mp_attributes WHERE attribute_code = $1";
    const checkResult = await db.query(checkQuery, [attribute_code]);
    
    if (checkResult.rows.length > 0) {
      await db.end();
      return res.status(400).json({
        success: false,
        message: `Attribute with code '${attribute_code}' already exists`
      });
    }

    const query = `
      INSERT INTO mp_attributes (
        attribute_code, label, attribute_type, entity_type,
        is_required, is_unique, is_filterable, is_searchable,
        is_variant, is_system, validation_rules, default_value, sort_order,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `;

    const result = await db.query(query, [
      attribute_code,
      label,
      attribute_type,
      entity_type,
      is_required,
      is_unique,
      is_filterable,
      is_searchable,
      is_variant,
      is_system,
      validation_rules,
      default_value,
      sort_order
    ]);

    await db.end();

    return res.json({
      success: true,
      message: "Attribute created successfully",
      attribute: result.rows[0]
    });
  } catch (error: any) {
    console.error("Error creating attribute:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create attribute",
      error: error.message
    });
  }
}