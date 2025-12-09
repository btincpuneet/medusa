"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const legacy_auth_1 = require("../../utils/legacy-auth");
const POST = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "email and password are required" });
    }
    try {
        const token = await (0, legacy_auth_1.authenticateWithLegacySupport)(req, email, password);
        return res.status(200).json(token);
    }
    catch (error) {
        const status = error?.name === "UnauthorizedError" || error?.message === "Unauthorized"
            ? 401
            : 500;
        return res.status(status).json({
            message: status === 401
                ? "Unauthorized"
                : error?.message || "Unexpected error during authentication.",
        });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL21pZ3JhdGUtbG9naW4vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EseURBQXVFO0FBRWhFLE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNwRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUE2QyxDQUFBO0lBQzdFLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN4QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLGlDQUFpQyxFQUFFLENBQUMsQ0FBQTtJQUM3RSxDQUFDO0lBRUQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFBLDJDQUE2QixFQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDdkUsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNwQyxDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixNQUFNLE1BQU0sR0FDVixLQUFLLEVBQUUsSUFBSSxLQUFLLG1CQUFtQixJQUFJLEtBQUssRUFBRSxPQUFPLEtBQUssY0FBYztZQUN0RSxDQUFDLENBQUMsR0FBRztZQUNMLENBQUMsQ0FBQyxHQUFHLENBQUE7UUFFVCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzdCLE9BQU8sRUFDTCxNQUFNLEtBQUssR0FBRztnQkFDWixDQUFDLENBQUMsY0FBYztnQkFDaEIsQ0FBQyxDQUFDLEtBQUssRUFBRSxPQUFPLElBQUkseUNBQXlDO1NBQ2xFLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDLENBQUE7QUF0QlksUUFBQSxJQUFJLFFBc0JoQiJ9