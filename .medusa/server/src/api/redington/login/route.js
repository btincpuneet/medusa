"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const legacy_auth_1 = require("../../utils/legacy-auth");
const session_1 = require("../utils/session");
const respond_1 = require("../utils/respond");
const POST = async (req, res) => {
    const body = (req.body || {});
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }
    try {
        const token = await (0, legacy_auth_1.authenticateWithLegacySupport)(req, email, password);
        (0, session_1.persistCustomerSession)(res, token);
        const payload = (0, legacy_auth_1.verifyCustomerToken)(token);
        return res.status(200).json({
            success: true,
            token,
            customer: {
                id: payload?.customer_id || null,
                email: payload?.email || email,
            },
        });
    }
    catch (error) {
        if (error?.name === "UnauthorizedError") {
            (0, session_1.clearCustomerSession)(res);
            return res.status(401).json({ message: "Invalid email or password." });
        }
        return (0, respond_1.sendErrorResponse)(res, error, "Unable to log in.");
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3JlZGluZ3Rvbi9sb2dpbi9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSx5REFHZ0M7QUFDaEMsOENBR3lCO0FBQ3pCLDhDQUFvRDtBQUU3QyxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FHM0IsQ0FBQTtJQUVELE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtJQUNyRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQTtJQUVwQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDeEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxrQ0FBa0MsRUFBRSxDQUFDLENBQUE7SUFDOUUsQ0FBQztJQUVELElBQUksQ0FBQztRQUNILE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBQSwyQ0FBNkIsRUFBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ3ZFLElBQUEsZ0NBQXNCLEVBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBRWxDLE1BQU0sT0FBTyxHQUFHLElBQUEsaUNBQW1CLEVBQUMsS0FBSyxDQUFDLENBQUE7UUFFMUMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsSUFBSTtZQUNiLEtBQUs7WUFDTCxRQUFRLEVBQUU7Z0JBQ1IsRUFBRSxFQUFFLE9BQU8sRUFBRSxXQUFXLElBQUksSUFBSTtnQkFDaEMsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLElBQUksS0FBSzthQUMvQjtTQUNGLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLElBQUksS0FBSyxFQUFFLElBQUksS0FBSyxtQkFBbUIsRUFBRSxDQUFDO1lBQ3hDLElBQUEsOEJBQW9CLEVBQUMsR0FBRyxDQUFDLENBQUE7WUFDekIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSw0QkFBNEIsRUFBRSxDQUFDLENBQUE7UUFDeEUsQ0FBQztRQUVELE9BQU8sSUFBQSwyQkFBaUIsRUFBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixDQUFDLENBQUE7SUFDM0QsQ0FBQztBQUNILENBQUMsQ0FBQTtBQW5DWSxRQUFBLElBQUksUUFtQ2hCIn0=