"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const http_1 = require("@medusajs/framework/http");
const seller_auth_service_1 = require("../services/seller-auth-service");
const seller_service_1 = require("../services/seller-service");
const setRestCors = (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Vary", "Origin");
    }
    else {
        res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] ||
        "Content-Type, Authorization, X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400");
};
const restCorsMiddleware = (req, res, next) => {
    setRestCors(req, res);
    if ((req.method || "").toUpperCase() === "OPTIONS") {
        res.status(204).send();
        return;
    }
    next();
};
const sellerAuthMiddleware = async (req, res, next) => {
    // Shared CORS treatment so the seller app can call APIs directly from the browser.
    setRestCors(req, res);
    if ((req.method || "").toUpperCase() === "OPTIONS") {
        res.status(204).send();
        return;
    }
    // Allow the auth/login + auth/me endpoints through without this middleware
    if (req.path?.startsWith("/seller/login") ||
        req.path?.startsWith("/seller/auth/login") ||
        req.path?.startsWith("/seller/auth/me")) {
        next();
        return;
    }
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ")
        ? header.slice("Bearer ".length).trim()
        : req.headers["x-seller-token"]?.trim();
    if (!token) {
        res.status(401).json({ message: "Seller token missing." });
        return;
    }
    try {
        // Support both legacy seller tokens and new seller auth tokens
        let sellerPayload = null;
        try {
            const auth = new seller_auth_service_1.SellerAuthService(req.scope.resolve("manager"));
            sellerPayload = auth.verify(token);
            req.seller = {
                id: sellerPayload.sellerId,
                name: sellerPayload.vendorName,
                subscription_plan: null,
                allowed_services: sellerPayload.allowedServices,
            };
            next();
            return;
        }
        catch {
            // fallback to legacy token format
            const sellerService = seller_service_1.SellerService.fromRequest(req);
            const payload = sellerService.verifyToken(token);
            const seller = await sellerService.getById(payload.seller_id);
            if (!seller || seller.status !== "active") {
                res.status(401).json({ message: "Seller session is not valid." });
                return;
            }
            req.seller = {
                ...payload,
                id: seller.id,
                name: seller.name,
                subscription_plan: seller.subscription_plan,
                allowed_services: seller.allowed_services,
            };
        }
        next();
    }
    catch (error) {
        res.status(401).json({
            message: error instanceof Error ? error.message : "Unable to verify seller token.",
        });
    }
};
const restAwareErrorHandler = () => {
    const defaultHandler = (0, http_1.errorHandler)();
    const logFile = path_1.default.join(process.cwd(), "logs", "rest-errors.log");
    return (err, req, res, next) => {
        if (req.path?.startsWith("/rest")) {
            setRestCors(req, res);
        }
        try {
            const payload = {
                time: new Date().toISOString(),
                method: req.method,
                path: req.path,
                message: err instanceof Error ? err.message : String(err),
                stack: err instanceof Error ? err.stack : undefined,
            };
            fs_1.default.mkdirSync(path_1.default.dirname(logFile), { recursive: true });
            fs_1.default.appendFileSync(logFile, `${JSON.stringify(payload)}\n`);
        }
        catch {
            // ignore logging failures
        }
        return defaultHandler(err, req, res, next);
    };
};
exports.default = (0, http_1.defineMiddlewares)({
    // Blanket CORS for Magento-compatible REST endpoints so browsers can read
    // error payloads even when upstream fails before route-level handlers run.
    routes: [
        {
            matcher: "/rest",
            middlewares: [restCorsMiddleware],
        },
        {
            // Seller APIs lean on the same CORS setup and JWT auth defined above.
            matcher: "/seller",
            middlewares: [sellerAuthMiddleware],
        },
    ],
    errorHandler: restAwareErrorHandler(),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpL21pZGRsZXdhcmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsNENBQW1CO0FBQ25CLGdEQUF1QjtBQU12QixtREFHaUM7QUFDakMseUVBQW1FO0FBQ25FLCtEQUEwRDtBQUUxRCxNQUFNLFdBQVcsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQzlELE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO0lBRWpDLElBQUksTUFBTSxFQUFFLENBQUM7UUFDWCxHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ2pELEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQzlCLENBQUM7U0FBTSxDQUFDO1FBQ04sR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNoRCxDQUFDO0lBRUQsR0FBRyxDQUFDLE1BQU0sQ0FDUiw4QkFBOEIsRUFDOUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQztRQUMzQywrQ0FBK0MsQ0FDbEQsQ0FBQTtJQUNELEdBQUcsQ0FBQyxNQUFNLENBQ1IsOEJBQThCLEVBQzlCLG1DQUFtQyxDQUNwQyxDQUFBO0lBQ0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxrQ0FBa0MsRUFBRSxNQUFNLENBQUMsQ0FBQTtJQUN0RCxHQUFHLENBQUMsTUFBTSxDQUFDLHdCQUF3QixFQUFFLE9BQU8sQ0FBQyxDQUFBO0FBQy9DLENBQUMsQ0FBQTtBQUVELE1BQU0sa0JBQWtCLEdBQUcsQ0FDekIsR0FBa0IsRUFDbEIsR0FBbUIsRUFDbkIsSUFBd0IsRUFDeEIsRUFBRTtJQUNGLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFFckIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDbkQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUN0QixPQUFNO0lBQ1IsQ0FBQztJQUVELElBQUksRUFBRSxDQUFBO0FBQ1IsQ0FBQyxDQUFBO0FBRUQsTUFBTSxvQkFBb0IsR0FBRyxLQUFLLEVBQ2hDLEdBQXFDLEVBQ3JDLEdBQW1CLEVBQ25CLElBQXdCLEVBQ3hCLEVBQUU7SUFDRixtRkFBbUY7SUFDbkYsV0FBVyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUVyQixJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUNuRCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO1FBQ3RCLE9BQU07SUFDUixDQUFDO0lBRUQsMkVBQTJFO0lBQzNFLElBQ0UsR0FBRyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsZUFBZSxDQUFDO1FBQ3JDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLG9CQUFvQixDQUFDO1FBQzFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLGlCQUFpQixDQUFDLEVBQ3ZDLENBQUM7UUFDRCxJQUFJLEVBQUUsQ0FBQTtRQUNOLE9BQU07SUFDUixDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLElBQUksRUFBRSxDQUFBO0lBQzlDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUU7UUFDdkMsQ0FBQyxDQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQXdCLEVBQUUsSUFBSSxFQUFFLENBQUE7SUFFakUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFBO1FBQzFELE9BQU07SUFDUixDQUFDO0lBRUQsSUFBSSxDQUFDO1FBQ0gsK0RBQStEO1FBQy9ELElBQUksYUFBYSxHQUFRLElBQUksQ0FBQTtRQUM3QixJQUFJLENBQUM7WUFDSCxNQUFNLElBQUksR0FBRyxJQUFJLHVDQUFpQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUE7WUFDaEUsYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDbEMsR0FBRyxDQUFDLE1BQU0sR0FBRztnQkFDWCxFQUFFLEVBQUUsYUFBYSxDQUFDLFFBQVE7Z0JBQzFCLElBQUksRUFBRSxhQUFhLENBQUMsVUFBVTtnQkFDOUIsaUJBQWlCLEVBQUUsSUFBSTtnQkFDdkIsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLGVBQWU7YUFDaEQsQ0FBQTtZQUNELElBQUksRUFBRSxDQUFBO1lBQ04sT0FBTTtRQUNSLENBQUM7UUFBQyxNQUFNLENBQUM7WUFDUCxrQ0FBa0M7WUFDbEMsTUFBTSxhQUFhLEdBQUcsOEJBQWEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDcEQsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNoRCxNQUFNLE1BQU0sR0FBRyxNQUFNLGFBQWEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBRTdELElBQUksQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDMUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsOEJBQThCLEVBQUUsQ0FBQyxDQUFBO2dCQUNqRSxPQUFNO1lBQ1IsQ0FBQztZQUVELEdBQUcsQ0FBQyxNQUFNLEdBQUc7Z0JBQ1gsR0FBRyxPQUFPO2dCQUNWLEVBQUUsRUFBRSxNQUFNLENBQUMsRUFBRTtnQkFDYixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7Z0JBQ2pCLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxpQkFBaUI7Z0JBQzNDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxnQkFBZ0I7YUFDMUMsQ0FBQTtRQUNILENBQUM7UUFFRCxJQUFJLEVBQUUsQ0FBQTtJQUNSLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLE9BQU8sRUFDTCxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxnQ0FBZ0M7U0FDNUUsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQTtBQUVELE1BQU0scUJBQXFCLEdBQUcsR0FBRyxFQUFFO0lBQ2pDLE1BQU0sY0FBYyxHQUFHLElBQUEsbUJBQWdCLEdBQUUsQ0FBQTtJQUN6QyxNQUFNLE9BQU8sR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsaUJBQWlCLENBQUMsQ0FBQTtJQUVuRSxPQUFPLENBQ0wsR0FBWSxFQUNaLEdBQWtCLEVBQ2xCLEdBQW1CLEVBQ25CLElBQXdCLEVBQ3hCLEVBQUU7UUFDRixJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDbEMsV0FBVyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUN2QixDQUFDO1FBRUQsSUFBSSxDQUFDO1lBQ0gsTUFBTSxPQUFPLEdBQUc7Z0JBQ2QsSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2dCQUM5QixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU07Z0JBQ2xCLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtnQkFDZCxPQUFPLEVBQUUsR0FBRyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztnQkFDekQsS0FBSyxFQUFFLEdBQUcsWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVM7YUFDcEQsQ0FBQTtZQUNELFlBQUUsQ0FBQyxTQUFTLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1lBQ3hELFlBQUUsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDNUQsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNQLDBCQUEwQjtRQUM1QixDQUFDO1FBRUQsT0FBTyxjQUFjLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDNUMsQ0FBQyxDQUFBO0FBQ0gsQ0FBQyxDQUFBO0FBRUQsa0JBQWUsSUFBQSx3QkFBaUIsRUFBQztJQUMvQiwwRUFBMEU7SUFDMUUsMkVBQTJFO0lBQzNFLE1BQU0sRUFBRTtRQUNOO1lBQ0UsT0FBTyxFQUFFLE9BQU87WUFDaEIsV0FBVyxFQUFFLENBQUMsa0JBQWtCLENBQUM7U0FDbEM7UUFDRDtZQUNFLHNFQUFzRTtZQUN0RSxPQUFPLEVBQUUsU0FBUztZQUNsQixXQUFXLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQztTQUNwQztLQUNGO0lBQ0QsWUFBWSxFQUFFLHFCQUFxQixFQUFFO0NBQ3RDLENBQUMsQ0FBQSJ9