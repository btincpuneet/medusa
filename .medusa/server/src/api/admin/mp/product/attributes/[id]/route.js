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
// GET: Fetch single attribute
// ===============================
async function GET(req, res) {
    try {
        const { id } = req.params;
        const client = createClient();
        await client.connect();
        const result = await client.query("SELECT * FROM mp_attributes WHERE id = $1", [id]);
        await client.end();
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attribute not found",
            });
        }
        return res.json({
            success: true,
            attribute: result.rows[0],
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch attribute",
            error: error.message,
        });
    }
}
// ===============================
// PUT: Update attribute
// ===============================
async function PUT(req, res) {
    try {
        const { id } = req.params;
        const { attribute_code, label, attribute_type } = req.body;
        const client = createClient();
        await client.connect();
        const result = await client.query(`UPDATE mp_attributes SET
        attribute_code = $1,
        label = $2,
        attribute_type = $3,
        updated_at = NOW()
       WHERE id = $4
       RETURNING *`, [attribute_code, label, attribute_type, id]);
        await client.end();
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attribute not found",
            });
        }
        return res.json({
            success: true,
            attribute: result.rows[0],
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update attribute",
            error: error.message,
        });
    }
}
// ===============================
// DELETE: Remove attribute
// ===============================
async function DELETE(req, res) {
    try {
        const { id } = req.params;
        const client = createClient();
        await client.connect();
        const result = await client.query("DELETE FROM mp_attributes WHERE id = $1 RETURNING id", [id]);
        await client.end();
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attribute not found",
            });
        }
        return res.json({
            success: true,
            message: "Attribute deleted",
            id: result.rows[0].id,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete attribute",
            error: error.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL3Byb2R1Y3QvYXR0cmlidXRlcy9baWRdL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBYUEsa0JBZ0NDO0FBS0Qsa0JBd0NDO0FBS0Qsd0JBaUNDO0FBOUhELDJCQUE0QjtBQUU1QixTQUFTLFlBQVk7SUFDbkIsT0FBTyxJQUFJLFdBQU0sQ0FBQztRQUNoQixnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7S0FDM0MsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELGtDQUFrQztBQUNsQyw4QkFBOEI7QUFDOUIsa0NBQWtDO0FBQzNCLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztRQUMxQixNQUFNLE1BQU0sR0FBRyxZQUFZLEVBQUUsQ0FBQztRQUM5QixNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUV2QixNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQy9CLDJDQUEyQyxFQUMzQyxDQUFDLEVBQUUsQ0FBQyxDQUNMLENBQUM7UUFFRixNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUVuQixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzdCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE9BQU8sRUFBRSxxQkFBcUI7YUFDL0IsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztZQUNkLE9BQU8sRUFBRSxJQUFJO1lBQ2IsU0FBUyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQzFCLENBQUMsQ0FBQztJQUVMLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsS0FBSztZQUNkLE9BQU8sRUFBRSwyQkFBMkI7WUFDcEMsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDO0FBRUQsa0NBQWtDO0FBQ2xDLHdCQUF3QjtBQUN4QixrQ0FBa0M7QUFDM0IsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO1FBQzFCLE1BQU0sRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFFM0QsTUFBTSxNQUFNLEdBQUcsWUFBWSxFQUFFLENBQUM7UUFDOUIsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFdkIsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUMvQjs7Ozs7O21CQU1hLEVBQ2IsQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxFQUFFLENBQUMsQ0FDNUMsQ0FBQztRQUVGLE1BQU0sTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRW5CLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDN0IsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsT0FBTyxFQUFFLHFCQUFxQjthQUMvQixDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ2QsT0FBTyxFQUFFLElBQUk7WUFDYixTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDMUIsQ0FBQyxDQUFDO0lBRUwsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsT0FBTyxFQUFFLDRCQUE0QjtZQUNyQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU87U0FDckIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztBQUNILENBQUM7QUFFRCxrQ0FBa0M7QUFDbEMsMkJBQTJCO0FBQzNCLGtDQUFrQztBQUMzQixLQUFLLFVBQVUsTUFBTSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDbEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7UUFDMUIsTUFBTSxNQUFNLEdBQUcsWUFBWSxFQUFFLENBQUM7UUFDOUIsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFdkIsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUMvQixzREFBc0QsRUFDdEQsQ0FBQyxFQUFFLENBQUMsQ0FDTCxDQUFDO1FBRUYsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFbkIsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUM3QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixPQUFPLEVBQUUsS0FBSztnQkFDZCxPQUFPLEVBQUUscUJBQXFCO2FBQy9CLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxPQUFPLEVBQUUsSUFBSTtZQUNiLE9BQU8sRUFBRSxtQkFBbUI7WUFDNUIsRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtTQUN0QixDQUFDLENBQUM7SUFFTCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUFFLEtBQUs7WUFDZCxPQUFPLEVBQUUsNEJBQTRCO1lBQ3JDLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTztTQUNyQixDQUFDLENBQUM7SUFDTCxDQUFDO0FBQ0gsQ0FBQyJ9