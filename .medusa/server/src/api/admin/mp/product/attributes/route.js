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
// GET: Fetch all attributes
// ===============================
// export async function GET(req: MedusaRequest, res: MedusaResponse) {
//   try {
//     const client = createClient();
//     await client.connect();
//     const result = await client.query(
//       "SELECT * FROM mp_attributes ORDER BY id DESC"
//     );
//     await client.end();
//     return res.json({
//       success: true,
//       attributes: result.rows,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch attributes",
//       error: error.message,
//     });
//   }
// }
async function GET(req, res) {
    try {
        const client = createClient();
        await client.connect();
        // Fetch attributes
        const attrs = await client.query("SELECT * FROM mp_attributes ORDER BY id DESC");
        const attributeIds = attrs.rows.map(a => a.id);
        // Fetch values for all attributes
        const values = await client.query("SELECT * FROM mp_attribute_values WHERE attribute_id = ANY($1)", [attributeIds]);
        // Group values by attribute_id
        const groupedValues = {};
        values.rows.forEach(v => {
            if (!groupedValues[v.attribute_id])
                groupedValues[v.attribute_id] = [];
            groupedValues[v.attribute_id].push(v);
        });
        // Attach values to attributes
        const final = attrs.rows.map(a => ({
            ...a,
            values: groupedValues[a.id] || []
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
            message: "Failed to fetch attributes",
            error: error.message,
        });
    }
}
// ===============================
// POST: Create new attribute
// ===============================
async function POST(req, res) {
    try {
        const { attribute_code, label, attribute_type } = req.body;
        const client = createClient();
        await client.connect();
        const result = await client.query(`INSERT INTO mp_attributes
        (attribute_code, label, attribute_type, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`, [attribute_code, label, attribute_type || "text"]);
        await client.end();
        return res.json({
            success: true,
            attribute: result.rows[0],
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create attribute",
            error: error.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL3Byb2R1Y3QvYXR0cmlidXRlcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQXFDQSxrQkE0Q0M7QUFNRCxvQkE0QkM7QUFqSEQsMkJBQTRCO0FBRTVCLFNBQVMsWUFBWTtJQUNuQixPQUFPLElBQUksV0FBTSxDQUFDO1FBQ2hCLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWTtLQUMzQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsa0NBQWtDO0FBQ2xDLDRCQUE0QjtBQUM1QixrQ0FBa0M7QUFDbEMsdUVBQXVFO0FBQ3ZFLFVBQVU7QUFDVixxQ0FBcUM7QUFDckMsOEJBQThCO0FBRTlCLHlDQUF5QztBQUN6Qyx1REFBdUQ7QUFDdkQsU0FBUztBQUVULDBCQUEwQjtBQUUxQix3QkFBd0I7QUFDeEIsdUJBQXVCO0FBQ3ZCLGlDQUFpQztBQUNqQyxVQUFVO0FBQ1Ysc0JBQXNCO0FBQ3RCLG9DQUFvQztBQUNwQyx3QkFBd0I7QUFDeEIsK0NBQStDO0FBQy9DLDhCQUE4QjtBQUM5QixVQUFVO0FBQ1YsTUFBTTtBQUNOLElBQUk7QUFFRyxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLEdBQUcsWUFBWSxFQUFFLENBQUM7UUFDOUIsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFdkIsbUJBQW1CO1FBQ25CLE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FDOUIsOENBQThDLENBQy9DLENBQUM7UUFFRixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUUvQyxrQ0FBa0M7UUFDbEMsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUMvQixnRUFBZ0UsRUFDaEUsQ0FBQyxZQUFZLENBQUMsQ0FDZixDQUFDO1FBRUYsK0JBQStCO1FBQy9CLE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUN0QixJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7Z0JBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDdkUsYUFBYSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEMsQ0FBQyxDQUFDLENBQUM7UUFFSCw4QkFBOEI7UUFDOUIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsQ0FBQztZQUNKLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUU7U0FDbEMsQ0FBQyxDQUFDLENBQUM7UUFFSixNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUVuQixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxPQUFPLEVBQUUsSUFBSTtZQUNiLFVBQVUsRUFBRSxLQUFLO1NBQ2xCLENBQUMsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsS0FBSztZQUNkLE9BQU8sRUFBRSw0QkFBNEI7WUFDckMsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDO0FBR0Qsa0NBQWtDO0FBQ2xDLDZCQUE2QjtBQUM3QixrQ0FBa0M7QUFDM0IsS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFFM0QsTUFBTSxNQUFNLEdBQUcsWUFBWSxFQUFFLENBQUM7UUFDOUIsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFdkIsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUMvQjs7O21CQUdhLEVBQ2IsQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLGNBQWMsSUFBSSxNQUFNLENBQUMsQ0FDbEQsQ0FBQztRQUVGLE1BQU0sTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRW5CLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztZQUNkLE9BQU8sRUFBRSxJQUFJO1lBQ2IsU0FBUyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQzFCLENBQUMsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsS0FBSztZQUNkLE9BQU8sRUFBRSw0QkFBNEI7WUFDckMsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDIn0=