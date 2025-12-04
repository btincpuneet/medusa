// app/admin/mp/attributes/[id]/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// ====================================
// Get single Attribute by ID
// ====================================

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    const { id } = req.params;

    const query = "SELECT * FROM mp_attributes WHERE id = $1";
    const result = await db.query(query, [id]);

    await db.end();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found"
      });
    }

    return res.json({
      success: true,
      attribute: result.rows[0]
    });
  } catch (error: any) {
    console.error("Error fetching attribute:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attribute",
      error: error.message
    });
  }
}

// ====================================
// Update an Attribute
// ====================================

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    const { id } = req.params;
    const updateData = req.body;

    // Check if attribute exists
    const checkQuery = "SELECT id FROM mp_attributes WHERE id = $1";
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      await db.end();
      return res.status(404).json({
        success: false,
        message: "Attribute not found"
      });
    }

    // Check if attribute_code is being changed and if it's unique
    if (updateData.attribute_code) {
      const codeCheckQuery = `
        SELECT id FROM mp_attributes 
        WHERE attribute_code = $1 AND id != $2
      `;
      const codeCheckResult = await db.query(codeCheckQuery, [
        updateData.attribute_code,
        id
      ]);
      
      if (codeCheckResult.rows.length > 0) {
        await db.end();
        return res.status(400).json({
          success: false,
          message: `Attribute with code '${updateData.attribute_code}' already exists`
        });
      }
    }

    // Build dynamic update query
    const fields = Object.keys(updateData);
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(", ");
    
    const query = `
      UPDATE mp_attributes 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const values = [id, ...fields.map(field => updateData[field])];
    
    const result = await db.query(query, values);

    await db.end();

    return res.json({
      success: true,
      message: "Attribute updated successfully",
      attribute: result.rows[0]
    });
  } catch (error: any) {
    console.error("Error updating attribute:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update attribute",
      error: error.message
    });
  }
}

// ====================================
// Delete an Attribute
// ====================================

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    const { id } = req.params;

    // Check if attribute exists and is not system
    const checkQuery = "SELECT id, is_system FROM mp_attributes WHERE id = $1";
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      await db.end();
      return res.status(404).json({
        success: false,
        message: "Attribute not found"
      });
    }

    const attribute = checkResult.rows[0];
    
    if (attribute.is_system) {
      await db.end();
      return res.status(400).json({
        success: false,
        message: "System attributes cannot be deleted"
      });
    }

    // Check if attribute is used in any attribute sets
    const setCheckQuery = `
      SELECT COUNT(*) as count 
      FROM mp_attribute_set_mappings 
      WHERE attribute_id = $1
    `;
    const setCheckResult = await db.query(setCheckQuery, [id]);
    
    if (parseInt(setCheckResult.rows[0].count) > 0) {
      await db.end();
      return res.status(400).json({
        success: false,
        message: "Cannot delete attribute that is assigned to attribute sets"
      });
    }

    // Check if attribute has values assigned to products
    const valueCheckQuery = `
      SELECT COUNT(*) as count 
      FROM mp_product_attributes 
      WHERE attribute_id = $1
    `;
    const valueCheckResult = await db.query(valueCheckQuery, [id]);
    
    if (parseInt(valueCheckResult.rows[0].count) > 0) {
      await db.end();
      return res.status(400).json({
        success: false,
        message: "Cannot delete attribute that has values assigned to products"
      });
    }

    // Delete attribute options first (for select/multiselect attributes)
    await db.query("DELETE FROM mp_attribute_values WHERE attribute_id = $1", [id]);

    // Delete the attribute
    const query = "DELETE FROM mp_attributes WHERE id = $1";
    await db.query(query, [id]);

    await db.end();

    return res.json({
      success: true,
      message: "Attribute deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting attribute:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete attribute",
      error: error.message
    });
  }
}