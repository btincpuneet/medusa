"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const core_flows_1 = require("@medusajs/core-flows");
const utils_1 = require("@medusajs/framework/utils");
const pg_1 = require("../../../../../lib/pg");
const normalizeString = (value) => typeof value === "string" ? value.trim() : "";
const parseAccessId = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }
    if (typeof value === "string" && value.trim().length) {
        return value.trim();
    }
    return undefined;
};
async function POST(req, res) {
    await Promise.all([
        (0, pg_1.ensureRedingtonCouponRuleTable)(),
        (0, pg_1.ensureRedingtonAccessMappingTable)(),
    ]);
    const body = (req.body || {});
    const cartId = normalizeString(body.cart_id);
    if (!cartId) {
        return res.status(400).json({ message: "cart_id is required" });
    }
    const couponCode = normalizeString(body.coupon_code);
    if (!couponCode) {
        return res.status(400).json({ message: "coupon_code is required" });
    }
    const accessId = parseAccessId(body.access_id);
    if (!accessId) {
        return res.status(400).json({ message: "access_id is required" });
    }
    const { rows: accessRows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        id,
        company_code,
        domain_id,
        domain_extention_id
      FROM redington_access_mapping
      WHERE access_id = $1
      LIMIT 1
    `, [accessId]);
    const mapping = accessRows[0];
    if (!mapping) {
        return res.status(404).json({
            message: `Access mapping ${accessId} not found.`,
        });
    }
    const { rows: couponRows } = await (0, pg_1.getPgPool)().query(`
      SELECT *
      FROM redington_coupon_rule
      WHERE coupon_code = $1
        AND company_code = $2
        AND domain_id = $3
        AND (domain_extention_id IS NULL OR domain_extention_id = $4)
        AND is_active = TRUE
      LIMIT 1
    `, [
        couponCode,
        mapping.company_code,
        mapping.domain_id,
        mapping.domain_extention_id,
    ]);
    if (!couponRows[0]) {
        return res.status(404).json({
            message: "Invalid coupon code for the selected access mapping. Please verify the company and domain configuration.",
        });
    }
    const workflowEngine = req.scope.resolve(utils_1.Modules.WORKFLOW_ENGINE);
    try {
        await workflowEngine.run(core_flows_1.updateCartPromotionsWorkflowId, {
            input: {
                cart_id: cartId,
                promo_codes: [couponCode],
                action: utils_1.PromotionActions.ADD,
            },
            transactionId: `redington-cart-apply-promo-${cartId}`,
        });
        return res.status(200).json({
            data: {
                success: true,
                message: "Coupon applied successfully.",
                cart_id: cartId,
                coupon_code: couponCode,
            },
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Failed to apply coupon to the cart.";
        return res.status(400).json({
            data: {
                success: false,
                message,
            },
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9jb3Vwb25zL2FwcGx5L3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBNkJBLG9CQXVHQztBQXBJRCxxREFBcUU7QUFFckUscURBQXFFO0FBRXJFLDhDQUk4QjtBQVE5QixNQUFNLGVBQWUsR0FBRyxDQUFDLEtBQWMsRUFBRSxFQUFFLENBQ3pDLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUE7QUFFL0MsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFjLEVBQXNCLEVBQUU7SUFDM0QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3hELE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ3RCLENBQUM7SUFDRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDckQsT0FBTyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDckIsQ0FBQztJQUNELE9BQU8sU0FBUyxDQUFBO0FBQ2xCLENBQUMsQ0FBQTtBQUVNLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDaEIsSUFBQSxtQ0FBOEIsR0FBRTtRQUNoQyxJQUFBLHNDQUFpQyxHQUFFO0tBQ3BDLENBQUMsQ0FBQTtJQUVGLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQW9CLENBQUE7SUFFaEQsTUFBTSxNQUFNLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxPQUFP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