"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const GET = async (req, res) => {
    const seller = req.seller;
    if (!seller) {
        return res.status(401).json({ message: "Seller session missing." });
    }
    // Dummy payload uses the seller id to show multi-tenant scoping.
    return res.json({
        seller_id: seller.id,
        subscription_plan: seller.subscription_plan,
        allowed_services: seller.allowed_services ?? [],
        stats: {
            orders: {
                total: 42,
                pending: 3,
                fulfilled: 35,
                cancelled: 4,
            },
            revenue: {
                total: 128400,
                currency: "USD",
                trailing_30d: 18200,
            },
            payouts: {
                pending: 2,
                completed: 12,
            },
            catalog: {
                live_products: 58,
                hidden_products: 4,
            },
        },
    });
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3NlbGxlci9kYXNoYm9hcmQvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBV08sTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQXdCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3pFLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7SUFFekIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ1osT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxDQUFDLENBQUE7SUFDckUsQ0FBQztJQUVELGlFQUFpRTtJQUNqRSxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDZCxTQUFTLEVBQUUsTUFBTSxDQUFDLEVBQUU7UUFDcEIsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLGlCQUFpQjtRQUMzQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLElBQUksRUFBRTtRQUMvQyxLQUFLLEVBQUU7WUFDTCxNQUFNLEVBQUU7Z0JBQ04sS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsT0FBTyxFQUFFLENBQUM7Z0JBQ1YsU0FBUyxFQUFFLEVBQUU7Z0JBQ2IsU0FBUyxFQUFFLENBQUM7YUFDYjtZQUNELE9BQU8sRUFBRTtnQkFDUCxLQUFLLEVBQUUsTUFBTTtnQkFDYixRQUFRLEVBQUUsS0FBSztnQkFDZixZQUFZLEVBQUUsS0FBSzthQUNwQjtZQUNELE9BQU8sRUFBRTtnQkFDUCxPQUFPLEVBQUUsQ0FBQztnQkFDVixTQUFTLEVBQUUsRUFBRTthQUNkO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLGFBQWEsRUFBRSxFQUFFO2dCQUNqQixlQUFlLEVBQUUsQ0FBQzthQUNuQjtTQUNGO0tBQ0YsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFBO0FBbENZLFFBQUEsR0FBRyxPQWtDZiJ9