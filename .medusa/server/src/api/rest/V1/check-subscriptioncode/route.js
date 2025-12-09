"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const pg_1 = require("../../../../lib/pg");
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
const OPTIONS = async (req, res) => {
    setCors(req, res);
    res.status(204).send();
};
exports.OPTIONS = OPTIONS;
const buildResponse = (payload) => [
    {
        data: payload,
    },
];
const POST = async (req, res) => {
    setCors(req, res);
    await (0, pg_1.ensureRedingtonSubscriptionCodeTable)();
    const body = (req.body || {});
    const email = (body.email || "").trim().toLowerCase();
    const subscriptionCode = (body.subscription_code || body.subscriptionCode || "").trim();
    if (!email || !subscriptionCode) {
        return res.json(buildResponse({
            data: "",
            status: "failed",
            message: "Please provide the Subscription Code and Email",
        }));
    }
    const record = await (0, pg_1.findActiveSubscriptionCode)({ email, subscriptionCode });
    if (!record) {
        return res.json(buildResponse({
            subscription_code: subscriptionCode,
            status: "failed",
            message: "Subscription Code or Email not found or not match",
        }));
    }
    const accessMapping = await (0, pg_1.findAccessMappingByAccessId)(record.access_id, {
        companyCode: record.company_code,
    });
    return res.json(buildResponse({
        subscription_code: record.subscription_code,
        company_code: record.company_code,
        access_id: record.access_id,
        mobile_ext: accessMapping?.mobile_ext ?? null,
        status: "success",
        message: "",
    }));
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvY2hlY2stc3Vic2NyaXB0aW9uY29kZS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSwyQ0FJMkI7QUFFM0IsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUMxRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtJQUNqQyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNqRCxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUM5QixDQUFDO1NBQU0sQ0FBQztRQUNOLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDaEQsQ0FBQztJQUVELEdBQUcsQ0FBQyxNQUFNLENBQ1IsOEJBQThCLEVBQzlCLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0NBQWdDLENBQUM7UUFDM0MsNkJBQTZCLENBQ2hDLENBQUE7SUFDRCxHQUFHLENBQUMsTUFBTSxDQUFDLDhCQUE4QixFQUFFLGNBQWMsQ0FBQyxDQUFBO0lBQzFELEdBQUcsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDeEQsQ0FBQyxDQUFBO0FBRU0sTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3ZFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDakIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUN4QixDQUFDLENBQUE7QUFIWSxRQUFBLE9BQU8sV0FHbkI7QUFRRCxNQUFNLGFBQWEsR0FBRyxDQUFDLE9BQWdDLEVBQUUsRUFBRSxDQUFDO0lBQzFEO1FBQ0UsSUFBSSxFQUFFLE9BQU87S0FDZDtDQUNGLENBQUE7QUFFTSxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUVqQixNQUFNLElBQUEseUNBQW9DLEdBQUUsQ0FBQTtJQUU1QyxNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUF5QixDQUFBO0lBQ3JELE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtJQUNyRCxNQUFNLGdCQUFnQixHQUNwQixDQUFDLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7SUFFaEUsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDaEMsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUNiLGFBQWEsQ0FBQztZQUNaLElBQUksRUFBRSxFQUFFO1lBQ1IsTUFBTSxFQUFFLFFBQVE7WUFDaEIsT0FBTyxFQUFFLGdEQUFnRDtTQUMxRCxDQUFDLENBQ0gsQ0FBQTtJQUNILENBQUM7SUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsK0JBQTBCLEVBQUMsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFBO0lBRTVFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNaLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FDYixhQUFhLENBQUM7WUFDWixpQkFBaUIsRUFBRSxnQkFBZ0I7WUFDbkMsTUFBTSxFQUFFLFFBQVE7WUFDaEIsT0FBTyxFQUFFLG1EQUFtRDtTQUM3RCxDQUFDLENBQ0gsQ0FBQTtJQUNILENBQUM7SUFFRCxNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUEsZ0NBQTJCLEVBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRTtRQUN4RSxXQUFXLEVBQUUsTUFBTSxDQUFDLFlBQVk7S0FDakMsQ0FBQyxDQUFBO0lBRUYsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUNiLGFBQWEsQ0FBQztRQUNaLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxpQkFBaUI7UUFDM0MsWUFBWSxFQUFFLE1BQU0sQ0FBQyxZQUFZO1FBQ2pDLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUztRQUMzQixVQUFVLEVBQUUsYUFBYSxFQUFFLFVBQVUsSUFBSSxJQUFJO1FBQzdDLE1BQU0sRUFBRSxTQUFTO1FBQ2pCLE9BQU8sRUFBRSxFQUFFO0tBQ1osQ0FBQyxDQUNILENBQUE7QUFDSCxDQUFDLENBQUE7QUE5Q1ksUUFBQSxJQUFJLFFBOENoQiJ9