"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const redington_max_qty_1 = require("../../../../../modules/redington-max-qty");
const isRuleInput = (value) => {
    return (value &&
        typeof value.category_id === "string" &&
        typeof value.brand_id === "string" &&
        typeof value.company_code === "string" &&
        value.max_qty !== undefined);
};
const isCategoryInput = (value) => {
    return (value &&
        typeof value.category_ids === "string" &&
        typeof value.brand_id === "string" &&
        typeof value.company_code === "string" &&
        value.max_qty !== undefined);
};
const POST = async (req, res) => {
    const body = (req.body || {});
    const importedRules = Array.isArray(body.rules)
        ? body.rules.filter(isRuleInput)
        : [];
    const importedCategories = Array.isArray(body.categories)
        ? body.categories.filter(isCategoryInput)
        : [];
    const createdRules = [];
    for (const rule of importedRules) {
        const created = await (0, redington_max_qty_1.createMaxQtyRule)(rule);
        createdRules.push(created);
    }
    const createdCategories = [];
    for (const category of importedCategories) {
        const created = await (0, redington_max_qty_1.createMaxQtyCategory)(category);
        createdCategories.push(created);
    }
    res.json({
        imported_rules: createdRules.length,
        imported_categories: createdCategories.length,
        rules: createdRules,
        categories: createdCategories,
    });
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9tYXgtcXR5L2ltcG9ydC9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLQSxnRkFPaUQ7QUFFakQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxLQUFVLEVBQXNCLEVBQUU7SUFDckQsT0FBTyxDQUNMLEtBQUs7UUFDTCxPQUFPLEtBQUssQ0FBQyxXQUFXLEtBQUssUUFBUTtRQUNyQyxPQUFPLEtBQUssQ0FBQyxRQUFRLEtBQUssUUFBUTtRQUNsQyxPQUFPLEtBQUssQ0FBQyxZQUFZLEtBQUssUUFBUTtRQUN0QyxLQUFLLENBQUMsT0FBTyxLQUFLLFNBQVMsQ0FDNUIsQ0FBQTtBQUNILENBQUMsQ0FBQTtBQUVELE1BQU0sZUFBZSxHQUFHLENBQUMsS0FBVSxFQUEwQixFQUFFO0lBQzdELE9BQU8sQ0FDTCxLQUFLO1FBQ0wsT0FBTyxLQUFLLENBQUMsWUFBWSxLQUFLLFFBQVE7UUFDdEMsT0FBTyxLQUFLLENBQUMsUUFBUSxLQUFLLFFBQVE7UUFDbEMsT0FBTyxLQUFLLENBQUMsWUFBWSxLQUFLLFFBQVE7UUFDdEMsS0FBSyxDQUFDLE9BQU8sS0FBSyxTQUFTLENBQzVCLENBQUE7QUFDSCxDQUFDLENBQUE7QUFFTSxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FHM0IsQ0FBQTtJQUVELE1BQU0sYUFBYSxHQUFnQixLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDMUQsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztRQUNoQyxDQUFDLENBQUMsRUFBRSxDQUFBO0lBQ04sTUFBTSxrQkFBa0IsR0FBb0IsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUM7UUFDekMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtJQUVOLE1BQU0sWUFBWSxHQUFvQixFQUFFLENBQUE7SUFDeEMsS0FBSyxNQUFNLElBQUksSUFBSSxhQUFhLEVBQUUsQ0FBQztRQUNqQyxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUEsb0NBQWdCLEVBQUMsSUFBSSxDQUFDLENBQUE7UUFDNUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUM1QixDQUFDO0lBRUQsTUFBTSxpQkFBaUIsR0FBd0IsRUFBRSxDQUFBO0lBQ2pELEtBQUssTUFBTSxRQUFRLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUMxQyxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUEsd0NBQW9CLEVBQUMsUUFBUSxDQUFDLENBQUE7UUFDcEQsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ2pDLENBQUM7SUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ1AsY0FBYyxFQUFFLFlBQVksQ0FBQyxNQUFNO1FBQ25DLG1CQUFtQixFQUFFLGlCQUFpQixDQUFDLE1BQU07UUFDN0MsS0FBSyxFQUFFLFlBQVk7UUFDbkIsVUFBVSxFQUFFLGlCQUFpQjtLQUM5QixDQUFDLENBQUE7QUFDSixDQUFDLENBQUE7QUEvQlksUUFBQSxJQUFJLFFBK0JoQiJ9