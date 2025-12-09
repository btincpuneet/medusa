"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("../../../../lib/pg");
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonGetInTouchTable)();
    const { rows } = await (0, pg_1.getPgPool)().query(`
      SELECT *
      FROM redington_get_in_touch
      ORDER BY created_at DESC
    `);
    return res.json({
        enquiries: rows.map(pg_1.mapGetInTouchRow),
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9nZXQtaW4tdG91Y2gvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSxrQkFjQztBQXBCRCwyQ0FJMkI7QUFFcEIsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sSUFBQSxtQ0FBOEIsR0FBRSxDQUFBO0lBRXRDLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUEsY0FBUyxHQUFFLENBQUMsS0FBSyxDQUN0Qzs7OztLQUlDLENBQ0YsQ0FBQTtJQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztRQUNkLFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLHFCQUFnQixDQUFDO0tBQ3RDLENBQUMsQ0FBQTtBQUNKLENBQUMifQ==