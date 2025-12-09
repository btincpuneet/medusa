"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PUT = PUT;
const pg_1 = require("../../../../../lib/pg");
const PROMOTION_ROOT_KEY = "category_restriction_promotion_root";
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonSettingsTable)();
    const existing = await (0, pg_1.getRedingtonSetting)(PROMOTION_ROOT_KEY);
    return res.json({
        config: {
            promotion_root_category_id: existing?.promotion_root_category_id ?? null,
        },
    });
}
async function PUT(req, res) {
    await (0, pg_1.ensureRedingtonSettingsTable)();
    const body = (req.body || {});
    const value = typeof body.promotion_root_category_id === "string"
        ? body.promotion_root_category_id.trim()
        : null;
    await (0, pg_1.setRedingtonSetting)(PROMOTION_ROOT_KEY, {
        promotion_root_category_id: value,
    });
    return res.json({
        config: {
            promotion_root_category_id: value,
        },
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9jYXRlZ29yeS1yZXN0cmljdGlvbnMvY29uZmlnL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBY0Esa0JBWUM7QUFFRCxrQkFrQkM7QUE1Q0QsOENBSThCO0FBRTlCLE1BQU0sa0JBQWtCLEdBQUcscUNBQXFDLENBQUE7QUFNekQsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sSUFBQSxpQ0FBNEIsR0FBRSxDQUFBO0lBRXBDLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBQSx3QkFBbUIsRUFDeEMsa0JBQWtCLENBQ25CLENBQUE7SUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDZCxNQUFNLEVBQUU7WUFDTiwwQkFBMEIsRUFBRSxRQUFRLEVBQUUsMEJBQTBCLElBQUksSUFBSTtTQUN6RTtLQUNGLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFTSxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsTUFBTSxJQUFBLGlDQUE0QixHQUFFLENBQUE7SUFFcEMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBcUIsQ0FBQTtJQUNqRCxNQUFNLEtBQUssR0FDVCxPQUFPLElBQUksQ0FBQywwQkFBMEIsS0FBSyxRQUFRO1FBQ2pELENBQUMsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxFQUFFO1FBQ3hDLENBQUMsQ0FBQyxJQUFJLENBQUE7SUFFVixNQUFNLElBQUEsd0JBQW1CLEVBQUMsa0JBQWtCLEVBQUU7UUFDNUMsMEJBQTBCLEVBQUUsS0FBSztLQUNsQyxDQUFDLENBQUE7SUFFRixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDZCxNQUFNLEVBQUU7WUFDTiwwQkFBMEIsRUFBRSxLQUFLO1NBQ2xDO0tBQ0YsQ0FBQyxDQUFBO0FBQ0osQ0FBQyJ9