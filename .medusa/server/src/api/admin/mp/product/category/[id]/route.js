"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PUT = PUT;
exports.DELETE = DELETE;
const pg_1 = require("pg");
function createClient() {
    return new pg_1.Client({
        connectionString: process.env.DATABASE_URL,
    });
}
// ===============================
// GET: Fetch single category
// ===============================
async function GET(req, res) {
    try {
        const { id } = req.params;
        const client = createClient();
        await client.connect();
        const result = await client.query("SELECT * FROM mp_categories WHERE id = $1", [id]);
        await client.end();
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        return res.json({
            success: true,
            category: result.rows[0],
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch category",
            error: error.message,
        });
    }
}
// ===============================
// PUT: Update category
// ===============================
async function PUT(req, res) {
    try {
        const { id } = req.params;
        const { name, url, parent_id, description, cat_ass_desc, meta_title, meta_desc, status } = req.body;
        const client = createClient();
        await client.connect();
        const result = await client.query(`UPDATE mp_categories SET
        name = $1,
        url = $2,
        parent_id = $3,
        description = $4,
        cat_ass_desc = $5,
        meta_title = $6,
        meta_desc = $7,
        status = $8,
        updated_at = NOW()
       WHERE id = $9
       RETURNING *`, [
            name,
            url,
            parent_id || null,
            description,
            cat_ass_desc,
            meta_title,
            meta_desc,
            status,
            id
        ]);
        await client.end();
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        return res.json({
            success: true,
            category: result.rows[0],
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update category",
            error: error.message,
        });
    }
}
// ===============================
// DELETE: Remove category
// ===============================
async function DELETE(req, res) {
    try {
        const { id } = req.params;
        const client = createClient();
        await client.connect();
        const result = await client.query("DELETE FROM mp_categories WHERE id = $1 RETURNING id", [id]);
        await client.end();
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        return res.json({
            success: true,
            message: "Category deleted",
            id: result.rows[0].id
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete category",
            error: error.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL3Byb2R1Y3QvY2F0ZWdvcnkvW2lkXS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWFBLGtCQTZCQztBQUtELGtCQTZEQztBQUtELHdCQThCQztBQTdJRCwyQkFBNEI7QUFFNUIsU0FBUyxZQUFZO0lBQ25CLE9BQU8sSUFBSSxXQUFNLENBQUM7UUFDaEIsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZO0tBQzNDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxrQ0FBa0M7QUFDbEMsNkJBQTZCO0FBQzdCLGtDQUFrQztBQUMzQixLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7UUFDMUIsTUFBTSxNQUFNLEdBQUcsWUFBWSxFQUFFLENBQUM7UUFDOUIsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFdkIsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUMvQiwyQ0FBMkMsRUFDM0MsQ0FBQyxFQUFFLENBQUMsQ0FDTCxDQUFDO1FBRUYsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFbkIsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUM3QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO1FBQ2pGLENBQUM7UUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxPQUFPLEVBQUUsSUFBSTtZQUNiLFFBQVEs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