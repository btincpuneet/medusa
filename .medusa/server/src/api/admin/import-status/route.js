"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("pg");
async function GET(req, res) {
    const client = new pg_1.Client({
        connectionString: process.env.DATABASE_URL,
    });
    try {
        await client.connect();
        // Get counts from all tables
        const productCount = await client.query('SELECT COUNT(*) as count FROM products');
        const variantCount = await client.query('SELECT COUNT(*) as count FROM product_variants');
        const sellerCount = await client.query('SELECT COUNT(*) as count FROM sellers');
        const attributeCount = await client.query('SELECT COUNT(*) as count FROM attributes');
        const attributeValueCount = await client.query('SELECT COUNT(*) as count FROM attribute_values');
        const listingCount = await client.query('SELECT COUNT(*) as count FROM product_listings');
        // Get recent products
        const recentProducts = await client.query(`
      SELECT p.product_code, p.name, p.status, p.created_at, COUNT(pva.id) as attribute_count
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN product_variant_attributes pva ON pv.id = pva.variant_id
      GROUP BY p.id, p.product_code, p.name, p.status, p.created_at
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
        return res.json({
            success: true,
            counts: {
                products: parseInt(productCount.rows[0].count),
                variants: parseInt(variantCount.rows[0].count),
                sellers: parseInt(sellerCount.rows[0].count),
                attributes: parseInt(attributeCount.rows[0].count),
                attribute_values: parseInt(attributeValueCount.rows[0].count),
                listings: parseInt(listingCount.rows[0].count),
            },
            recent_products: recentProducts.rows
        });
    }
    catch (error) {
        console.error("Error checking status:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to check import status",
            error: error.message
        });
    }
    finally {
        await client.end();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2ltcG9ydC1zdGF0dXMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQSxrQkFrREM7QUFwREQsMkJBQTRCO0FBRXJCLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLE1BQU0sR0FBRyxJQUFJLFdBQU0sQ0FBQztRQUN4QixnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7S0FDM0MsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFdkIsNkJBQTZCO1FBQzdCLE1BQU0sWUFBWSxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1FBQ2xGLE1BQU0sWUFBWSxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO1FBQzFGLE1BQU0sV0FBVyxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1FBQ2hGLE1BQU0sY0FBYyxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO1FBQ3RGLE1BQU0sbUJBQW1CLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7UUFDakcsTUFBTSxZQUFZLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7UUFFMUYsc0JBQXNCO1FBQ3RCLE1BQU0sY0FBYyxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQzs7Ozs7Ozs7S0FRekMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ2QsT0FBTyxFQUFFLElBQUk7WUFDYixNQUFNLEVBQUU7Z0JBQ04sUUFBUSxFQUFFLFFBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDOUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDOUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDNUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDbEQsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQzdELFFBQVEsRUFBRSxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7YUFDL0M7WUFDRCxlQUFlLEVBQUUsY0FBYyxDQUFDLElBQUk7U0FDckMsQ0FBQyxDQUFDO0lBRUwsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQy9DLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUFFLEtBQUs7WUFDZCxPQUFPLEVBQUUsK0JBQStCO1lBQ3hDLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTztTQUNyQixDQUFDLENBQUM7SUFDTCxDQUFDO1lBQVMsQ0FBQztRQUNULE1BQU0sTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3JCLENBQUM7QUFDSCxDQUFDIn0=