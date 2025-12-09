"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("../../../../lib/pg");
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonHomeVideoTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT id, title, url, status, created_at, updated_at
      FROM redington_home_video
      WHERE status = TRUE
      ORDER BY created_at DESC
    `);
    return res.json({
        videos: rows.map(pg_1.mapHomeVideoRow),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9ob21lLXZpZGVvcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVFBLGtCQWVDO0FBckJELDJDQUkyQjtBQUVwQixLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsTUFBTSxJQUFBLGtDQUE2QixHQUFFLENBQUE7SUFFckMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sSUFBQSxjQUFTLEdBQUUsQ0FBQyxLQUFLLENBQ3RDOzs7OztLQUtDLENBQ0YsQ0FBQTtJQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztRQUNkLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLG9CQUFlLENBQUM7S0FDbEMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyJ9