"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("pg");
function client() {
    return new pg_1.Client({ connectionString: process.env.DATABASE_URL });
}
// ====================================
// Returns all countries
// ====================================
async function GET(req, res) {
    try {
        const db = client();
        await db.connect();
        const result = await db.query("SELECT id, name, status FROM mp_countries WHERE status = 'active' ORDER BY id");
        await db.end();
        return res.json({
            success: true,
            countries: result.rows,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch countries",
            error: error.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL2NvdW50cmllcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVdBLGtCQXNCQztBQWhDRCwyQkFBNEI7QUFFNUIsU0FBUyxNQUFNO0lBQ2IsT0FBTyxJQUFJLFdBQU0sQ0FBQyxFQUFFLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztBQUNwRSxDQUFDO0FBRUQsdUNBQXVDO0FBQ3ZDLHdCQUF3QjtBQUN4Qix1Q0FBdUM7QUFFaEMsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxHQUFHLE1BQU0sRUFBRSxDQUFDO1FBQ3BCLE1BQU0sRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRW5CLE1BQU0sTUFBTSxHQUFHLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FDM0IsK0VBQStFLENBQ2hGLENBQUM7UUFFRixNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUVmLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztZQUNkLE9BQU8sRUFBRSxJQUFJO1lBQ2IsU0FBUyxFQUFFLE1BQU0sQ0FBQyxJQUFJO1NBQ3ZCLENBQUMsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsS0FBSztZQUNkLE9BQU8sRUFBRSwyQkFBMkI7WUFDcEMsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDIn0=