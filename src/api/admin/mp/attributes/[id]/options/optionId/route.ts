// app/admin/mp/attributes/[id]/options/[optionId]/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// ====================================
// Update an attribute option
// ====================================

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    const { id, optionId } = req.params;
    const updateData = req.body;

    // Check if option exists
    const checkQuery = `
      SELECT * FROM mp_attribute_values 
      WHERE id = $1 AND attribute_id = $2
    `;
    const checkResult = await db.query(checkQuery, [optionId, id]);
    
    if (checkResult.rows.length === 0) {
      await db.end();
      return res.status(404).json({
        success: false,
        message: "Option not found"
      });
    }

    // Check if value is being changed and if it's unique
    if (updateData.value) {
      const valueCheckQuery = `
        SELECT id FROM mp_attribute_values 
        WHERE attribute_id = $1 AND value = $2 AND id != $3
      `;
      const valueCheckResult = await db.query(valueCheckQuery, [
        id,
        updateData.value,
        optionId
      ]);
      
      if (valueCheckResult.rows.length > 0) {
        await db.end();
        return res.status(400).json({
          success: false,
          message: `Option with value '${updateData.value}' already exists for this attribute`
        });
      }
    }

    // If setting as default, remove default from other options
    if (updateData.is_default === true) {
      await db.query(
        "UPDATE mp_attribute_values SET is_default = false WHERE attribute_id = $1 AND id != $2",
        [id, optionId]
      );
    }

    // Build dynamic update query
    const fields = Object.keys(updateData);
    const setClause = fields
      .map((field, index) => `${field} = $${index + 3}`)
      .join(", ");
    
    const query = `
      UPDATE mp_attribute_values 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND attribute_id = $2
      RETURNING *
    `;

    const values = [optionId, id, ...fields.map(field => updateData[field])];
    
    const result = await db.query(query, values);

    await db.end();

    return res.json({
      success: true,
      message: "Option updated successfully",
      option: result.rows[0]
    });
  } catch (error: any) {
    console.error("Error updating attribute option:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update attribute option",
      error: error.message
    });
  }
}

// ====================================
// Delete an attribute option
// ====================================

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    const { id, optionId } = req.params;

    // Check if option exists
    const checkQuery = `
      SELECT * FROM mp_attribute_values 
      WHERE id = $1 AND attribute_id = $2
    `;
    const checkResult = await db.query(checkQuery, [optionId, id]);
    
    if (checkResult.rows.length === 0) {
      await db.end();
      return res.status(404).json({
        success: false,
        message: "Option not found"
      });
    }

    const option = checkResult.rows[0];
    
    // Check if option is set as default
    if (option.is_default) {
      await db.end();
      return res.status(400).json({
        success: false,
        message: "Cannot delete the default option. Set another option as default first."
      });
    }

    // Check if option is used in product attributes
    const productCheckQuery = `
      SELECT COUNT(*) as count 
      FROM mp_product_attributes 
      WHERE attribute_value_id = $1
    `;
    const productCheckResult = await db.query(productCheckQuery, [optionId]);
    
    if (parseInt(productCheckResult.rows[0].count) > 0) {
      await db.end();
      return res.status(400).json({
        success: false,
        message: "Cannot delete option that is assigned to products"
      });
    }

    // Delete the option
    const query = "DELETE FROM mp_attribute_values WHERE id = $1 AND attribute_id = $2";
    await db.query(query, [optionId, id]);

    await db.end();

    return res.json({
      success: true,
      message: "Option deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting attribute option:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete attribute option",
      error: error.message
    });
  }
}

// ====================================
// Set an option as default
// ====================================

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    const { id, optionId } = req.params;

    // Check if option exists
    const checkQuery = `
      SELECT id FROM mp_attribute_values 
      WHERE id = $1 AND attribute_id = $2
    `;
    const checkResult = await db.query(checkQuery, [optionId, id]);
    
    if (checkResult.rows.length === 0) {
      await db.end();
      return res.status(404).json({
        success: false,
        message: "Option not found"
      });
    }

    // Remove default from all options
    await db.query(
      "UPDATE mp_attribute_values SET is_default = false WHERE attribute_id = $1",
      [id]
    );

    // Set this option as default
    const updateQuery = `
      UPDATE mp_attribute_values 
      SET is_default = true, updated_at = NOW()
      WHERE id = $1 AND attribute_id = $2
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [optionId, id]);

    await db.end();

    return res.json({
      success: true,
      message: "Option set as default successfully",
      option: result.rows[0]
    });
  } catch (error: any) {
    console.error("Error setting default option:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to set default option",
      error: error.message
    });
  }
}