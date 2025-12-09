"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const redington_mpgs_1 = require("../../../../../../../modules/redington-mpgs");
const POST = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        return res.status(400).json({ message: "Invalid transaction id" });
    }
    const transaction = await (0, redington_mpgs_1.retrieveMpgsTransaction)(id);
    if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
    }
    const body = (req.body || {});
    const returnUrl = body.return_url?.trim();
    if (!returnUrl) {
        return res.status(400).json({ message: "return_url is required" });
    }
    try {
        const result = await (0, redington_mpgs_1.resendPaymentSession)({
            scope: req.scope,
            orderRefId: transaction.order_ref_id,
            orderIncrementId: transaction.order_increment_id,
            returnUrl,
            amount: body.amount,
            currency: body.currency,
            interactionOperation: body.interaction_operation,
        });
        res.json(result);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to resend payment link.";
        res.status(400).json({ message });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9wYXltZW50LWludGVncmF0aW9uL3RyYW5zYWN0aW9ucy9baWRdL3Jlc2VuZC9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLQSxnRkFHb0Q7QUFFN0MsTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3BFLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDekIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxDQUFDLENBQUE7SUFDcEUsQ0FBQztJQUVELE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSx3Q0FBdUIsRUFBQyxFQUFFLENBQUMsQ0FBQTtJQUNyRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDakIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxDQUFDLENBQUE7SUFDbkUsQ0FBQztJQUVELE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBSzNCLENBQUE7SUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFBO0lBQ3pDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNmLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFBO0lBQ3BFLENBQUM7SUFFRCxJQUFJLENBQUM7UUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEscUNBQW9CLEVBQUM7WUFDeEMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO1lBQ2hCLFVBQVUsRUFBRSxXQUFXLENBQUMsWUFBWTtZQUNwQyxnQkFBZ0IsRUFBRSxXQUFXLENBQUMsa0JBQWtCO1lBQ2hELFNBQVM7WUFDVCxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07WUFDbkIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLG9CQUFvQixFQUFFLElBQUksQ0FBQyxxQkFBcUI7U0FDakQsQ0FBQyxDQUFBO1FBRUYsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNsQixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE1BQU0sT0FBTyxHQUNYLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGdDQUFnQyxDQUFBO1FBQzNFLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBeENZLFFBQUEsSUFBSSxRQXdDaEIifQ==