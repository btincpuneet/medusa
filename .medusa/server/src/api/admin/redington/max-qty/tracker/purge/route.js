"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const redington_config_1 = require("~modules/redington-config");
const redington_max_qty_1 = require("~modules/redington-max-qty");
const POST = async (req, res) => {
    const body = (req.body || {});
    if (body.before) {
        const cutoff = new Date(body.before);
        if (Number.isNaN(cutoff.getTime())) {
            return res.status(400).json({
                message: "Invalid 'before' date provided.",
            });
        }
        const deleted = await (0, redington_max_qty_1.purgeOrderQuantityTrackerBefore)(cutoff);
        return res.json({ deleted, before: cutoff.toISOString() });
    }
    let months = null;
    if (body.months !== undefined) {
        const parsed = Number(body.months);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return res.status(400).json({
                message: "months must be a positive number",
            });
        }
        months = parsed;
    }
    else if (redington_config_1.redingtonConfig.product.maxOrderDurationMonths) {
        months = redington_config_1.redingtonConfig.product.maxOrderDurationMonths;
    }
    if (!months) {
        return res.status(400).json({
            message: "No retention window provided. Pass 'months' or configure REDINGTON_PRODUCT_MAX_ORDER_DURATION.",
        });
    }
    const deleted = await (0, redington_max_qty_1.purgeOrderQuantityTrackerByMonths)(months);
    res.json({
        deleted,
        months,
    });
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9tYXgtcXR5L3RyYWNrZXIvcHVyZ2Uvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBS0EsZ0VBQTJEO0FBQzNELGtFQUdtQztBQUU1QixNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FHM0IsQ0FBQTtJQUVELElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2hCLE1BQU0sTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUNwQyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNuQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixPQUFPLEVBQUUsaUNBQWlDO2FBQzNDLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFDRCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUEsbURBQStCLEVBQUMsTUFBTSxDQUFDLENBQUE7UUFDN0QsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQzVELENBQUM7SUFFRCxJQUFJLE1BQU0sR0FBa0IsSUFBSSxDQUFBO0lBQ2hDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUM5QixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ2xDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUM1QyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixPQUFPLEVBQUUsa0NBQWtDO2FBQzVDLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFDRCxNQUFNLEdBQUcsTUFBTSxDQUFBO0lBQ2pCLENBQUM7U0FBTSxJQUFJLGtDQUFlLENBQUMsT0FBTyxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDMUQsTUFBTSxHQUFHLGtDQUFlLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFBO0lBQ3pELENBQUM7SUFFRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxnR0FBZ0c7U0FDMUcsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBQSxxREFBaUMsRUFBQyxNQUFNLENBQUMsQ0FBQTtJQUUvRCxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ1AsT0FBTztRQUNQLE1BQU07S0FDUCxDQUFDLENBQUE7QUFDSixDQUFDLENBQUE7QUExQ1ksUUFBQSxJQUFJLFFBMENoQiJ9