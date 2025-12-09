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
// ===============================
// GET: Fetch all attribute values
// Optional filter: ?attribute_id=1
// ===============================
async function GET(req, res) {
    try {
        const { attribute_id } = req.query;
        const client = createClient();
        await client.connect();
        let query = "SELECT * FROM mp_attribute_values";
        let params = [];
        if (attribute_id) {
            query += " WHERE attribute_id = $1";
            params.push(attribute_id);
        }
        query += " ORDER BY id DESC";
        const result = await client.query(query, params);
        await client.end();
        return res.json({
            success: true,
            attribute_values: result.rows
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch attribute values",
            error: error.message,
        });
    }
}
// ===============================
// POST: Create a new attribute value
// ===============================
async function POST(req, res) {
    try {
        const { attribute_id, value, meta } = req.body;
        const client = createClient();
        await client.connect();
        const result = await client.query(`INSERT INTO mp_attribute_values 
        (attribute_id, value, meta, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`, [attribute_id, value, meta || null]);
        await client.end();
        return res.json({
            success: true,
            attribute_value: result.rows[0]
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create attribute value",
            error: error.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL3Byb2R1Y3QvYXR0cmlidXRlLXZhbHVlcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWNBLGtCQWlDQztBQUtELG9CQTZCQztBQS9FRCwyQkFBNEI7QUFFNUIsU0FBUyxZQUFZO0lBQ25CLE9BQU8sSUFBSSxXQUFNLENBQUM7UUFDaEIsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZO0tBQzNDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxrQ0FBa0M7QUFDbEMsa0NBQWtDO0FBQ2xDLG1DQUFtQztBQUNuQyxrQ0FBa0M7QUFDM0IsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxZQUFZLEVBQUUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDO1FBRW5DLE1BQU0sTUFBTSxHQUFHLFlBQVksRUFBRSxDQUFDO1FBQzlCLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXZCLElBQUksS0FBSyxHQUFHLG1DQUFtQyxDQUFDO1FBQ2hELElBQUksTUFBTSxHQUFVLEVBQUUsQ0FBQztRQUV2QixJQUFJLFlBQVksRUFBRSxDQUFDO1lBQ2pCLEtBQUssSUFBSSwwQkFBMEIsQ0FBQztZQUNwQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFRCxLQUFLLElBQUksbUJBQW1CLENBQUM7UUFFN0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVqRCxNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUVuQixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxPQUFPLEVBQUUsSUFBSTtZQUNiLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxJQUFJO1NBQzlCLENBQUMsQ0FBQztJQUVMLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsS0FBSztZQUNkLE9BQU8sRUFBRSxrQ0FBa0M7WUFDM0MsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDO0FBRUQsa0NBQWtDO0FBQ2xDLHFDQUFxQztBQUNyQyxrQ0FBa0M7QUFDM0IsS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFFL0MsTUFBTSxNQUFNLEdBQUcsWUFBWSxFQUFFLENBQUM7UUFDOUIsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFdkIsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUMvQjs7O21CQUdhLEVBQ2IsQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLElBQUksSUFBSSxJQUFJLENBQUMsQ0FDcEMsQ0FBQztRQUVGLE1BQU0sTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRW5CLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztZQUNkLE9BQU8sRUFBRSxJQUFJO1lBQ2IsZUFBZSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQ2hDLENBQUMsQ0FBQztJQUVMLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsS0FBSztZQUNkLE9BQU8sRUFBRSxrQ0FBa0M7WUFDM0MsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDIn0=