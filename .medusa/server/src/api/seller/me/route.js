"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const seller_service_1 = require("../../../services/seller-service");
const GET = async (req, res) => {
    const sellerContext = req.seller;
    if (!sellerContext) {
        return res.status(401).json({ message: "Seller session missing." });
    }
    const sellerService = seller_service_1.SellerService.fromRequest(req);
    const seller = await sellerService.getById(sellerContext.id);
    if (!seller) {
        return res.status(404).json({ message: "Seller not found." });
    }
    return res.json({
        seller: {
            id: seller.id,
            name: seller.name,
            email: seller.email,
            status: seller.status,
            subscription_plan: seller.subscription_plan,
            allowed_services: seller.allowed_services,
        },
    });
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3NlbGxlci9tZS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxxRUFBZ0U7QUFTekQsTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQXdCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3pFLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7SUFFaEMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ25CLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUseUJBQXlCLEVBQUUsQ0FBQyxDQUFBO0lBQ3JFLENBQUM7SUFFRCxNQUFNLGFBQWEsR0FBRyw4QkFBYSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNwRCxNQUFNLE1BQU0sR0FBRyxNQUFNLGFBQWEsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBRTVELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNaLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFBO0lBQy9ELENBQUM7SUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDZCxNQUFNLEVBQUU7WUFDTixFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDYixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7WUFDakIsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLO1lBQ25CLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtZQUNyQixpQkFBaUIsRUFBRSxNQUFNLENBQUMsaUJBQWlCO1lBQzNDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxnQkFBZ0I7U0FDMUM7S0FDRixDQUFDLENBQUE7QUFDSixDQUFDLENBQUE7QUF4QlksUUFBQSxHQUFHLE9Bd0JmIn0=