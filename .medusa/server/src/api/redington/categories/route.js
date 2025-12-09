"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const category_tree_1 = require("../../../lib/redington/category-tree");
const respond_1 = require("../utils/respond");
const GET = async (req, res) => {
    try {
        const manager = req.scope.resolve("manager");
        const tree = await (0, category_tree_1.loadCategoryTree)(manager);
        const root = tree[0] ?? null;
        return res.json(root);
    }
    catch (error) {
        return (0, respond_1.sendErrorResponse)(res, error, "Unable to load categories.");
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3JlZGluZ3Rvbi9jYXRlZ29yaWVzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUtBLHdFQUF1RTtBQUN2RSw4Q0FBb0Q7QUFFN0MsTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ25FLElBQUksQ0FBQztRQUNILE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FFMUMsQ0FBQTtRQUNELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSxnQ0FBZ0IsRUFBQyxPQUFPLENBQUMsQ0FBQTtRQUM1QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFBO1FBQzVCLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUN2QixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sSUFBQSwyQkFBaUIsRUFBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLDRCQUE0QixDQUFDLENBQUE7SUFDcEUsQ0FBQztBQUNILENBQUMsQ0FBQTtBQVhZLFFBQUEsR0FBRyxPQVdmIn0=