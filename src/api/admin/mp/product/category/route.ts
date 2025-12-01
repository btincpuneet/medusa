import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function createClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
  });
}



export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const client = createClient();
    await client.connect();

    const result = await client.query(`
      SELECT
        id,
        name,
        parent_id,
        source,
        magento_category_id
      FROM mp_categories
      ORDER BY id ASC
    `);

    await client.end();

    const rows = result.rows;

    // ----------------------------------------------------
    // BUILD INDEX MAPS
    // ----------------------------------------------------

    // Medusa categories map (by id)
    const medusaMap = new Map();
    // Magento categories map (by magento_category_id)
    const magentoMap = new Map();

    rows.forEach(cat => {
      const node = { ...cat, children: [] };

      if (cat.source === "magento") {
        magentoMap.set(cat.magento_category_id, node);
      } else {
        medusaMap.set(cat.id, node);
      }
    });

    // ----------------------------------------------------
    // BUILD THE TREE
    // ----------------------------------------------------
    const tree: any[] = [];

    rows.forEach(cat => {
      let node =
        cat.source === "magento"
          ? magentoMap.get(cat.magento_category_id)
          : medusaMap.get(cat.id);

      if (!cat.parent_id) {
        // ROOT CATEGORY
        tree.push(node);
      } else {
        // MAGENTO CATEGORY CHILD
        if (cat.source === "magento") {
          const parent = magentoMap.get(cat.parent_id);
          if (parent) parent.children.push(node);
        } else {
          // MEDUSA CATEGORY CHILD
          const parent = medusaMap.get(cat.parent_id);
          if (parent) parent.children.push(node);
        }
      }
    });

    return res.json({
      success: true,
      categories: tree,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
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
      parent_id,
      status = "active",
      source = "medusa", // medusa OR magento
      magento_category_id = null
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Category name is required",
      });
    }

    const client = createClient();
    await client.connect();

    // Generate URL slug
    const url = generateSlug(name.trim());

    // ==================================================
    // 🔥 DETERMINE PARENT BASED ON SOURCE
    // ==================================================
    let parentLevel = 1;
    let position = 1;
    let finalParentId = null; // always internal DB id

    if (parent_id) {
      let parentQuery;

      if (source === "magento") {
        // Parent is from Magento → parent_id = magento_category_id
        parentQuery = await client.query(
          `SELECT id, level FROM mp_categories WHERE magento_category_id = $1`,
          [parent_id]
        );
      } else {
        // Parent is a normal Medusa category → parent_id = internal DB id
        parentQuery = await client.query(
          `SELECT id, level FROM mp_categories WHERE id = $1`,
          [parent_id]
        );
      }

      if (parentQuery.rows.length === 0) {
        await client.end();
        return res.status(400).json({
          success: false,
          error: "Parent category does not exist",
        });
      }

      finalParentId = parentQuery.rows[0].id;
      parentLevel = parentQuery.rows[0].level + 1;

      // Get position under this parent
      const pos = await client.query(
        `SELECT COALESCE(MAX(position), 0) + 1 AS next_pos 
         FROM mp_categories WHERE parent_id = $1`,
        [finalParentId]
      );

      position = pos.rows[0].next_pos;
    } else {
      // ROOT CATEGORY
      const pos = await client.query(
        `SELECT COALESCE(MAX(position), 0) + 1 AS next_pos 
         FROM mp_categories WHERE parent_id IS NULL`
      );

      position = pos.rows[0].next_pos;
    }

    // ==================================================
    // 🔥 VALIDATE NAME DUPLICATE AT SAME LEVEL
    // ==================================================
    const existingCheck = await client.query(
      `SELECT id FROM mp_categories WHERE name = $1 AND parent_id IS NOT DISTINCT FROM $2`,
      [name.trim(), finalParentId]
    );

    if (existingCheck.rows.length > 0) {
      await client.end();
      return res.status(400).json({
        success: false,
        error: `Category "${name}" already exists at this level`,
      });
    }

    // ==================================================
    // 🔥 VALIDATE URL DUPLICATE AT SAME LEVEL
    // ==================================================
    const urlCheck = await client.query(
      `SELECT id FROM mp_categories WHERE url = $1 AND parent_id IS NOT DISTINCT FROM $2`,
      [url, finalParentId]
    );

    if (urlCheck.rows.length > 0) {
      await client.end();
      return res.status(400).json({
        success: false,
        error: "A category with this URL already exists at this level",
      });
    }

    // ==================================================
    // 🔥 INSERT NEW CATEGORY
    // ==================================================
    const result = await client.query(
      `INSERT INTO mp_categories (
        name, 
        url,
        parent_id,
        description,
        meta_title,
        meta_desc,
        status,
        source,
        level,
        position,
        magento_category_id,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        name.trim(),
        url,
        finalParentId,
        null, // description
        null, // meta_title
        null, // meta_desc
        status,
        source,
        parentLevel,
        position,
        source === "magento" ? magento_category_id || parent_id : null
      ]
    );

    await client.end();

    return res.json({
      success: true,
      category: result.rows[0],
      message: "Category created successfully",
    });

  } catch (error: any) {
    console.error("Create Category Error:", error);

    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        error: "Duplicate name or URL",
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        error: "Parent category does not exist",
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create category",
    });
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
