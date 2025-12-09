"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("pg");
/**
 * GET → List all product-category mappings
 * POST → Create new mapping
 */
async function GET(req, res) {
    try {
        const client = new pg_1.Client({ connectionString: process.env.DATABASE_URL });
        await client.connect();
        const result = await client.query(`
      SELECT pc.id, pc.product_id, pc.category_id, pc.created_at,
             p.title as product_name,
             c.name as category_name
      FROM mp_product_categories pc
      LEFT JOIN mp_products p ON p.id = pc.product_id
      LEFT JOIN mp_categories c ON c.id = pc.category_id
      ORDER BY pc.id DESC
    `);
        await client.end();
        return res.json({
            success: true,
            data: result.rows,
        });
    }
    catch (error) {
        console.error("GET product-category error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch product categories",
            error: error.message,
        });
    }
}
async function POST(req, res) {
    try {
        const { product_id, category_id } = req.body;
        if (!product_id || !category_id) {
            return res.status(400).json({
                success: false,
                message: "product_id and category_id are required",
            });
        }
        const client = new pg_1.Client({ connectionString: process.env.DATABASE_URL });
        await client.connect();
        // insert mapping
        const result = await client.query(`
      INSERT INTO mp_product_categories (product_id, category_id)
      VALUES ($1, $2)
      RETURNING *
      `, [product_id, category_id]);
        await client.end();
        return res.json({
            success: true,
            message: "Mapping created successfully",
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error("POST product-category error:", error);
        // Handle unique constraint error
        if (error.code === "23505") {
            return res.status(400).json({
                success: false,
                message: "Mapping already exists (product_id + category_id must be unique)",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to create product-category mapping",
            error: error.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL3Byb2R1Y3QvcHJvZHVjdC1jYXRlZ29yeS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVNBLGtCQStCQztBQUVELG9CQWlEQztBQXpGRCwyQkFBNEI7QUFFNUI7OztHQUdHO0FBRUksS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILE1BQU0sTUFBTSxHQUFHLElBQUksV0FBTSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXZCLE1BQU0sTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQzs7Ozs7Ozs7S0FRakMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFbkIsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ2QsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7U0FDbEIsQ0FBQyxDQUFDO0lBRUwsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXBELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUFFLEtBQUs7WUFDZCxPQUFPLEVBQUUsb0NBQW9DO1lBQzdDLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTztTQUNyQixDQUFDLENBQUM7SUFDTCxDQUFDO0FBQ0gsQ0FBQztBQUVNLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFFN0MsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2hDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE9BQU8sRUFBRSx5Q0FBeUM7YUFDbkQsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sTUFBTSxHQUFHLElBQUksV0FBTSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXZCLGlCQUFpQjtRQUNqQixNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQy9COzs7O09BSUMsRUFDRCxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FDMUIsQ0FBQztRQUVGLE1BQU0sTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRW5CLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztZQUNkLE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFLDhCQUE4QjtZQUN2QyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDckIsQ0FBQyxDQUFDO0lBRUwsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVyRCxpQ0FBaUM7UUFDakMsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDO1lBQzNCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE9BQU8sRUFBRSxrRUFBa0U7YUFDNUUsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUFFLEtBQUs7WUFDZCxPQUFPLEVBQUUsMkNBQTJDO1lBQ3BELEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTztTQUNyQixDQUFDLENBQUM7SUFDTCxDQUFDO0FBQ0gsQ0FBQyJ9