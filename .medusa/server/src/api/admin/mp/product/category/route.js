"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("pg");
function createClient() {
    return new pg_1.Client({
        connectionString: process.env.DATABASE_URL,
    });
}
async function GET(req, res) {
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
            }
            else {
                medusaMap.set(cat.id, node);
            }
        });
        // ----------------------------------------------------
        // BUILD THE TREE
        // ----------------------------------------------------
        const tree = [];
        rows.forEach(cat => {
            let node = cat.source === "magento"
                ? magentoMap.get(cat.magento_category_id)
                : medusaMap.get(cat.id);
            if (!cat.parent_id) {
                // ROOT CATEGORY
                tree.push(node);
            }
            else {
                // MAGENTO CATEGORY CHILD
                if (cat.source === "magento") {
                    const parent = magentoMap.get(cat.parent_id);
                    if (parent)
                        parent.children.push(node);
                }
                else {
                    // MEDUSA CATEGORY CHILD
                    const parent = medusaMap.get(cat.parent_id);
                    if (parent)
                        parent.children.push(node);
                }
            }
        });
        return res.json({
            success: true,
            categories: tree,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}
// ===============================
// POST: Create new category
// ===============================
async function POST(req, res) {
    try {
        const { name, parent_id, status = "active", source = "medusa", // medusa OR magento
        magento_category_id = null } = req.body;
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
                parentQuery = await client.query(`SELECT id, level FROM mp_categories WHERE magento_category_id = $1`, [parent_id]);
            }
            else {
                // Parent is a normal Medusa category → parent_id = internal DB id
                parentQuery = await client.query(`SELECT id, level FROM mp_categories WHERE id = $1`, [parent_id]);
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
            const pos = await client.query(`SELECT COALESCE(MAX(position), 0) + 1 AS next_pos 
         FROM mp_categories WHERE parent_id = $1`, [finalParentId]);
            position = pos.rows[0].next_pos;
        }
        else {
            // ROOT CATEGORY
            const pos = await client.query(`SELECT COALESCE(MAX(position), 0) + 1 AS next_pos 
         FROM mp_categories WHERE parent_id IS NULL`);
            position = pos.rows[0].next_pos;
        }
        // ==================================================
        // 🔥 VALIDATE NAME DUPLICATE AT SAME LEVEL
        // ==================================================
        const existingCheck = await client.query(`SELECT id FROM mp_categories WHERE name = $1 AND parent_id IS NOT DISTINCT FROM $2`, [name.trim(), finalParentId]);
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
        const urlCheck = await client.query(`SELECT id FROM mp_categories WHERE url = $1 AND parent_id IS NOT DISTINCT FROM $2`, [url, finalParentId]);
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
        const result = await client.query(`INSERT INTO mp_categories (
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
      RETURNING *`, [
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
        ]);
        await client.end();
        return res.json({
            success: true,
            category: result.rows[0],
            message: "Category created successfully",
        });
    }
    catch (error) {
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
function generateSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL3Byb2R1Y3QvY2F0ZWdvcnkvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFZQSxrQkE2RUM7QUFTRCxvQkE4S0M7QUE5UUQsMkJBQTRCO0FBRTVCLFNBQVMsWUFBWTtJQUNuQixPQUFPLElBQUksV0FBTSxDQUFDO1FBQ2hCLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWTtLQUMzQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBSU0sS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILE1BQU0sTUFBTSxHQUFHLFlBQVksRUFBRSxDQUFDO1FBQzlCLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXZCLE1BQU0sTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQzs7Ozs7Ozs7O0tBU2pDLENBQUMsQ0FBQztRQUVILE1BQU0sTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRW5CLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFFekIsdURBQXVEO1FBQ3ZELG1CQUFtQjtRQUNuQix1REFBdUQ7UUFFdkQsZ0NBQWdDO1FBQ2hDLE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDNUIsa0RBQWtEO1FBQ2xELE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFFN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNqQixNQUFNLElBQUksR0FBRyxFQUFFLEdBQUcsR0FBRyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUV0QyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzdCLFVBQVUsQ0FBQyxHQUFHLENB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