"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const axios_1 = __importDefault(require("axios"));
const MAGENTO_REST_BASE_URL = process.env.MAGENTO_REST_BASE_URL;
const ensureMagentoConfig = () => {
    if (!MAGENTO_REST_BASE_URL) {
        throw new Error("MAGENTO_REST_BASE_URL is required to proxy Magento reorder requests.");
    }
};
const buildBaseUrl = () => MAGENTO_REST_BASE_URL.replace(/\/+$/, "") + "/";
const setCors = (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Vary", "Origin");
    }
    else {
        res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] ||
        "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
};
const forwardToMagento = async (req, res) => {
    setCors(req, res);
    try {
        ensureMagentoConfig();
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Magento config missing.",
        });
    }
    const tokenHeader = req.headers.authorization || req.headers["x-auth-token"] || undefined;
    if (!tokenHeader) {
        return res.status(401).json({ message: "Missing Authorization header." });
    }
    const axiosConfig = {
        baseURL: buildBaseUrl(),
        url: "redington/reorder",
        method: "POST",
        headers: {
            Authorization: tokenHeader,
            "Content-Type": "application/json",
        },
        params: req.query,
        data: req.body,
        validateStatus: () => true,
    };
    try {
        const response = await axios_1.default.request(axiosConfig);
        return res.status(response.status).json(response.data);
    }
    catch (error) {
        const status = error?.response?.status ?? 500;
        const message = error?.response?.data?.message ||
            error?.message ||
            "Failed to reorder cart.";
        return res.status(status).json({ message });
    }
};
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
exports.POST = forwardToMagento;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvcmVkaW5ndG9uL3Jlb3JkZXIvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsa0RBQXlCO0FBR3pCLE1BQU0scUJBQXFCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQTtBQUUvRCxNQUFNLG1CQUFtQixHQUFHLEdBQUcsRUFBRTtJQUMvQixJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUMzQixNQUFNLElBQUksS0FBSyxDQUNiLHNFQUFzRSxDQUN2RSxDQUFBO0lBQ0gsQ0FBQztBQUNILENBQUMsQ0FBQTtBQUVELE1BQU0sWUFBWSxHQUFHLEdBQUcsRUFBRSxDQUFDLHFCQUFzQixDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFBO0FBRTNFLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDMUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDakMsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNYLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDakQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDOUIsQ0FBQztTQUFNLENBQUM7UUFDTixHQUFHLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUFFRCxHQUFHLENBQUMsTUFBTSxDQUNSLDhCQUE4QixFQUM5QixHQUFHLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDO1FBQzNDLDZCQUE2QixDQUNoQyxDQUFBO0lBQ0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsRUFBRSxjQUFjLENBQUMsQ0FBQTtJQUMxRCxHQUFHLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3hELENBQUMsQ0FBQTtBQUVELE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3pFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFFakIsSUFBSSxDQUFDO1FBQ0gsbUJBQW1CLEVBQUUsQ0FBQTtJQUN2QixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHlCQUF5QjtTQUM1RSxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsTUFBTSxXQUFXLEdBQ2YsR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxTQUFTLENBQUE7SUFFdkUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2pCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsK0JBQStCLEVBQUUsQ0FBQyxDQUFBO0lBQzNFLENBQUM7SUFFRCxNQUFNLFdBQVcsR0FBRztRQUNsQixPQUFPLEVBQUUsWUFBWSxFQUFFO1FBQ3ZCLEdBQUcsRUFBRSxtQkFBbUI7UUFDeEIsTUFBTSxFQUFFLE1BQWU7UUFDdkIsT0FBTyxFQUFFO1lBQ1AsYUFBYSxFQUFFLFdBQVc7WUFDMUIsY0FBYyxFQUFFLGtCQUFrQjtTQUNuQztRQUNELE1BQU0sRUFBRSxHQUFHLENBQUMsS0FBSztRQUNqQixJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7UUFDZCxjQUFjLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSTtLQUMzQixDQUFBO0lBRUQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ2pELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUN4RCxDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixNQUFNLE1BQU0sR0FBRyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sSUFBSSxHQUFHLENBQUE7UUFDN0MsTUFBTSxPQUFPLEdBQ1gsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTztZQUM5QixLQUFLLEVBQUUsT0FBTztZQUNkLHlCQUF5QixDQUFBO1FBQzNCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQzdDLENBQUM7QUFDSCxDQUFDLENBQUE7QUFFTSxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDdkUsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNqQixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQ3hCLENBQUMsQ0FBQTtBQUhZLFFBQUEsT0FBTyxXQUduQjtBQUVZLFFBQUEsSUFBSSxHQUFHLGdCQUFnQixDQUFBIn0=