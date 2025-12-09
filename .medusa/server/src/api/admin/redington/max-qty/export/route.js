"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const redington_max_qty_1 = require("../../../../../modules/redington-max-qty");
const GET = async (_req, res) => {
    const [rules] = await (0, redington_max_qty_1.listMaxQtyRules)({}, { limit: 1000, offset: 0 });
    const [categories] = await (0, redington_max_qty_1.listMaxQtyCategories)({}, { limit: 1000, offset: 0 });
    res.json({
        rules,
        categories,
    });
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9tYXgtcXR5L2V4cG9ydC9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLQSxnRkFHaUQ7QUFFMUMsTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUFFLElBQW1CLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3BFLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLElBQUEsbUNBQWUsRUFBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ3JFLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxNQUFNLElBQUEsd0NBQW9CLEVBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUUvRSxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ1AsS0FBSztRQUNMLFVBQVU7S0FDWCxDQUFDLENBQUE7QUFDSixDQUFDLENBQUE7QUFSWSxRQUFBLEdBQUcsT0FRZiJ9