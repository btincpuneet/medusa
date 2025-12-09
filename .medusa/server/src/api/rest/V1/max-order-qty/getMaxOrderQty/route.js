"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const redington_max_qty_1 = require("../../../../../modules/redington-max-qty");
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
const POST = async (req, res) => {
    setCors(req, res);
    const body = (req.body || {});
    const brandId = body.brand_id ??
        body.brandId ??
        body.category_id ??
        body.categoryId ??
        "";
    const accessId = body.accessId ?? body.access_id ?? "";
    const customerId = body.customer_id ?? body.customerId ?? null;
    if (!String(brandId).trim().length || !String(accessId).trim().length) {
        return res.status(400).json({
            message: "brand_id and accessId are required.",
        });
    }
    try {
        const summary = await (0, redington_max_qty_1.getMaxOrderQtySummary)({
            brand_id: String(brandId),
            access_id: String(accessId),
            customer_id: customerId,
        });
        return res.json(summary);
    }
    catch (error) {
        const message = error?.message || "Failed to load max order quantity details.";
        const status = message.toLowerCase().includes("access mapping not found") ||
            message.toLowerCase().includes("brand_id is required")
            ? 404
            : 500;
        return res.status(status).json({ message });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvbWF4LW9yZGVyLXF0eS9nZXRNYXhPcmRlclF0eS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxnRkFBZ0Y7QUFFaEYsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUMxRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtJQUNqQyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNqRCxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUM5QixDQUFDO1NBQU0sQ0FBQztRQUNOLEdBQUcsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDaEQsQ0FBQztJQUVELEdBQUcsQ0FBQyxNQUFNLENBQ1IsOEJBQThCLEVBQzlCLEdBQUcsQ0FBQyxPQUFPLENBQUMsZ0NBQWdDLENBQUM7UUFDM0MsNkJBQTZCLENBQ2hDLENBQUE7SUFDRCxHQUFHLENBQUMsTUFBTSxDQUFDLDhCQUE4QixFQUFFLGNBQWMsQ0FBQyxDQUFBO0lBQzFELEdBQUcsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFDeEQsQ0FBQyxDQUFBO0FBRU0sTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3ZFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDakIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtBQUN4QixDQUFDLENBQUE7QUFIWSxRQUFBLE9BQU8sV0FHbkI7QUFFTSxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUVqQixNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUF3QixDQUFBO0lBQ3BELE1BQU0sT0FBTyxHQUNYLElBQUksQ0FBQyxRQUFRO1FBQ2IsSUFBSSxDQUFDLE9BQU87UUFDWixJQUFJLENBQUMsV0FBVztRQUNoQixJQUFJLENBQUMsVUFBVTtRQUNmLEVBQUUsQ0FBQTtJQUNKLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUE7SUFDdEQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQTtJQUU5RCxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN0RSxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxxQ0FBcUM7U0FDL0MsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELElBQUksQ0FBQztRQUNILE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBQSx5Q0FBcUIsRUFBQztZQUMxQyxRQUFRLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUN6QixTQUFTLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQztZQUMzQixXQUFXLEVBQUUsVUFBVTtTQUN4QixDQUFDLENBQUE7UUFDRixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDMUIsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsTUFBTSxPQUFPLEdBQ1gsS0FBSyxFQUFFLE9BQU8sSUFBSSw0Q0FBNEMsQ0FBQTtRQUNoRSxNQUFNLE1BQU0sR0FDVixPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsUUFBUSxDQUFDLDBCQUEwQixDQUFDO1lBQzFELE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUM7WUFDcEQsQ0FBQyxDQUFDLEdBQUc7WUFDTCxDQUFDLENBQUMsR0FBRyxDQUFBO1FBRVQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUE7SUFDN0MsQ0FBQztBQUNILENBQUMsQ0FBQTtBQXJDWSxRQUFBLElBQUksUUFxQ2hCIn0=