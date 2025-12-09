"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("../../../../lib/pg");
const isTruthyStatus = (status) => {
    if (typeof status !== "string") {
        return false;
    }
    const normalized = status.trim().toLowerCase();
    return ["1", "true", "yes", "active", "enabled"].includes(normalized);
};
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonCookiePolicyTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT *
      FROM redington_cookie_policy
      ORDER BY updated_at DESC
    `);
    const active = rows.find((row) => isTruthyStatus(row.status)) ?? rows[0];
    if (!active) {
        return res.status(404).json({ message: "No cookie policy configured." });
    }
    return res.json({
        cookie_policy: (0, pg_1.mapCookiePolicyRow)(active),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9jb29raWUtcG9saWN5L3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBaUJBLGtCQW9CQztBQW5DRCwyQ0FJMkI7QUFFM0IsTUFBTSxjQUFjLEdBQUcsQ0FBQyxNQUFlLEVBQUUsRUFBRTtJQUN6QyxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQy9CLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtJQUM5QyxPQUFPLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUN2RSxDQUFDLENBQUE7QUFFTSxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsTUFBTSxJQUFBLHFDQUFnQyxHQUFFLENBQUE7SUFFeEMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sSUFBQSxjQUFTLEdBQUUsQ0FBQyxLQUFLLENBQ3RDOzs7O0tBSUMsQ0FDRixDQUFBO0lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUV4RSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLDhCQUE4QixFQUFFLENBQUMsQ0FBQTtJQUMxRSxDQUFDO0lBRUQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ2QsYUFBYSxFQUFFLElBQUEsdUJBQWtCLEVBQUMsTUFBTSxDQUFDO0tBQzFDLENBQUMsQ0FBQTtBQUNKLENBQUMifQ==