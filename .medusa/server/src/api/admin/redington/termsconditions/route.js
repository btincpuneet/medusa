"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const magentoClient_1 = require("../../../magentoClient");
const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL;
const MAGENTO_ADMIN_TOKEN = process.env.MAGENTO_ADMIN_TOKEN;
const ensureMagentoConfig = () => {
    if (!MAGENTO_REST_BASE_URL || !MAGENTO_ADMIN_TOKEN) {
        throw new Error("MAGENTO_REST_BASE_URL and MAGENTO_ADMIN_TOKEN are required for terms & conditions admin API.");
    }
};
const makeClient = () => (0, magentoClient_1.createMagentoB2CClient)({
    baseUrl: MAGENTO_REST_BASE_URL,
    axiosConfig: {
        headers: {
            Authorization: `Bearer ${MAGENTO_ADMIN_TOKEN}`,
            "Content-Type": "application/json",
        },
    },
});
const GET = async (req, res) => {
    try {
        ensureMagentoConfig();
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Magento configuration missing.",
        });
    }
    const client = makeClient();
    try {
        const accessId = req.query?.access_id ?? req.query?.accessId;
        const response = await client.request({
            url: "redington-termsconditions/termsconditions/getlist",
            method: "POST",
            data: accessId ? { accessId } : req.body ?? {},
        });
        return res.status(200).json({
            termsconditions: response.data,
        });
    }
    catch (error) {
        const status = error?.response?.status ?? 502;
        const message = error?.response?.data?.message ||
            error?.message ||
            "Failed to load terms & conditions.";
        return res.status(status).json({ message });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi90ZXJtc2NvbmRpdGlvbnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsMERBQStEO0FBRS9ELE1BQU0scUJBQXFCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQTtBQUMvRCxNQUFNLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUE7QUFFM0QsTUFBTSxtQkFBbUIsR0FBRyxHQUFHLEVBQUU7SUFDL0IsSUFBSSxDQUFDLHFCQUFxQixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUNuRCxNQUFNLElBQUksS0FBSyxDQUNiLDhGQUE4RixDQUMvRixDQUFBO0lBQ0gsQ0FBQztBQUNILENBQUMsQ0FBQTtBQUVELE1BQU0sVUFBVSxHQUFHLEdBQUcsRUFBRSxDQUN0QixJQUFBLHNDQUFzQixFQUFDO0lBQ3JCLE9BQU8sRUFBRSxxQkFBc0I7SUFDL0IsV0FBVyxFQUFFO1FBQ1gsT0FBTyxFQUFFO1lBQ1AsYUFBYSxFQUFFLFVBQVUsbUJBQW1CLEVBQUU7WUFDOUMsY0FBYyxFQUFFLGtCQUFrQjtTQUNuQztLQUNGO0NBQ0YsQ0FBQyxDQUFBO0FBRUcsTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ25FLElBQUksQ0FBQztRQUNILG1CQUFtQixFQUFFLENBQUE7SUFDdkIsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFDTCxLQUFLLFlBQVksS0FBSztnQkFDcEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPO2dCQUNmLENBQUMsQ0FBQyxnQ0FBZ0M7U0FDdkMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELE1BQU0sTUFBTSxHQUFHLFVBQVUsRUFBRSxDQUFBO0lBRTNCLElBQUksQ0FBQztRQUNILE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFBO1FBQzVELE1BQU0sUUFBUSxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUNwQyxHQUFHLEVBQUUsbURBQW1EO1lBQ3hELE1BQU0sRUFBRSxNQUFNO1lBQ2QsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFO1NBQy9DLENBQUMsQ0FBQTtRQUNGLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsZUFBZSxFQUFFLFFBQVEsQ0FBQyxJQUFJO1NBQy9CLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE1BQU0sTUFBTSxHQUFHLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxJQUFJLEdBQUcsQ0FBQTtRQUM3QyxNQUFNLE9BQU8sR0FDWCxLQUFLLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxPQUFPO1lBQzlCLEtBQUssRUFBRSxPQUFPO1lBQ2Qsb0NBQW9DLENBQUE7UUFDdEMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUE7SUFDN0MsQ0FBQztBQUNILENBQUMsQ0FBQTtBQWhDWSxRQUFBLEdBQUcsT0FnQ2YifQ==