"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("pg");
function createClient() {
    return new pg_1.Client({ connectionString: process.env.DATABASE_URL });
}
async function GET(req, res) {
    try {
        const categoryId = req.params.id;
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: "Category ID is required",
            });
        }
        const client = createClient();
        await client.connect();
        // Step 1: Fetch attribute IDs mapped to the category
        const attrMap = await client.query(`
      SELECT attribute_id 
      FROM mp_category_attributes 
      WHERE category_id = $1
      `, [categoryId]);
        const attributeIds = attrMap.rows.map(r => r.attribute_id);
        if (attributeIds.length === 0) {
            await client.end();
            return res.json({
                success: true,
                attributes: [],
            });
        }
        // Step 2: Fetch attributes
        const attrs = await client.query(`
      SELECT * FROM mp_attributes 
      WHERE id = ANY($1)
      ORDER BY sort_order ASC
      `, [attributeIds]);
        // Step 3: Fetch values for all these attributes
        const values = await client.query(`
      SELECT * 
      FROM mp_attribute_values
      WHERE attribute_id = ANY($1)
      `, [attributeIds]);
        // Group values
        const groupedValues = {};
        values.rows.forEach(v => {
            if (!groupedValues[v.attribute_id])
                groupedValues[v.attribute_id] = [];
            groupedValues[v.attribute_id].push(v);
        });
        // Attach values to attributes
        const final = attrs.rows.map(a => ({
            ...a,
            values: groupedValues[a.id] || [],
        }));
        await client.end();
        return res.json({
            success: true,
            attributes: final,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch category attributes",
            error: error.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL3Byb2R1Y3QvcHJvZHVjdC1jYXRlZ29yeS9baWRdL2F0dHJpYnV0ZXMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSxrQkFpRkM7QUF2RkQsMkJBQTRCO0FBRTVCLFNBQVMsWUFBWTtJQUNuQixPQUFPLElBQUksV0FBTSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFFTSxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsSUFBSSxDQUFDO1FBQ0gsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFFakMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE9BQU8sRUFBRSx5QkFBeUI7YUFDbkMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sTUFBTSxHQUFHLFlBQVksRUFBRSxDQUFDO1FBQzlCLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXZCLHFEQUFxRDtRQUNyRCxNQUFNLE9BQU8sR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQ2hDOzs7O09BSUMsRUFDRCxDQUFDLFVBQVUsQ0FBQyxDQUNiLENBQUM7UUFFRixNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUUzRCxJQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDOUIsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDbkIsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNkLE9BQU8sRUFBRSxJQUFJO2dCQUNiLFVBQVUsRUFBRSxFQUFFO2FBQ2YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELDJCQUEyQjtRQUMzQixNQUFNLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQzlCOzs7O09BSUMsRUFDRCxDQUFDLFlBQVksQ0FBQyxDQUNmLENBQUM7UUFFRixnREFBZ0Q7UUFDaEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUMvQjs7OztPQUlDLEVBQ0QsQ0FBQyxZQUFZLENBQUMsQ0FDZixDQUFDO1FBRUYsZUFBZTtRQUNmLE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUN0QixJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7Z0JBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDdkUsYUFBYSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEMsQ0FBQyxDQUFDLENBQUM7UUFFSCw4QkFBOEI7UUFDOUIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsQ0FBQztZQUNKLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUU7U0FDbEMsQ0FBQyxDQUFDLENBQUM7UUFFSixNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUVuQixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxPQUFPLEVBQUUsSUFBSTtZQUNiLFVBQVUsRUFBRSxLQUFLO1NBQ2xCLENBQUMsQ0FBQztJQUVMLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsS0FBSztZQUNkLE9BQU8sRUFBRSxxQ0FBcUM7WUFDOUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDIn0=