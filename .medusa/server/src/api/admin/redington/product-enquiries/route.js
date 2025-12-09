"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../lib/pg");
const parseOptionalNumber = (value) => {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};
async function GET(req, res) {
    await (0, pg_1.ensureRedingtonProductEnquiryTable)();
    const query = (req.query || {});
    const [enquiries, count] = await (0, pg_1.listProductEnquiries)({
        status: query.status?.trim() || undefined,
        email: query.email?.trim() || undefined,
        sku: query.sku?.trim() || undefined,
        product_id: parseOptionalNumber(query.product_id),
        access_id: parseOptionalNumber(query.access_id),
        user_id: parseOptionalNumber(query.user_id),
    }, {
        limit: parseOptionalNumber(query.limit),
        offset: parseOptionalNumber(query.offset),
    });
    return res.json({
        product_enquiries: enquiries,
        count,
        limit: parseOptionalNumber(query.limit),
        offset: parseOptionalNumber(query.offset) ?? 0,
    });
}
async function POST(req, res) {
    await (0, pg_1.ensureRedingtonProductEnquiryTable)();
    const body = (req.body || {});
    const enquiry = await (0, pg_1.createProductEnquiry)({
        user_id: body.user_id ?? null,
        access_id: body.access_id ?? null,
        domain_id: body.domain_id ?? null,
        company_code: body.company_code ?? null,
        product_id: body.product_id ?? null,
        fullname: body.fullname ?? null,
        email: body.email ?? null,
        product_name: body.product_name ?? null,
        domain_name: body.domain_name ?? null,
        country_name: body.country_name ?? null,
        sku: body.sku ?? null,
        price: body.price ?? null,
        comments: body.comments ?? null,
        status: body.status ?? null,
    });
    return res.status(201).json({
        product_enquiry: enquiry,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9wcm9kdWN0LWVucXVpcmllcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQTRCQSxrQkEwQkM7QUFFRCxvQkF5QkM7QUEvRUQsMkNBSzJCO0FBYTNCLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRTtJQUM3QyxJQUFJLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssRUFBRSxFQUFFLENBQUM7UUFDMUQsT0FBTyxTQUFTLENBQUE7SUFDbEIsQ0FBQztJQUNELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUM1QixPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFBO0FBQ3JELENBQUMsQ0FBQTtBQUVNLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLElBQUEsdUNBQWtDLEdBQUUsQ0FBQTtJQUUxQyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFjLENBQUE7SUFFNUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNLElBQUEseUJBQW9CLEVBQ25EO1FBQ0UsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksU0FBUztRQUN6QyxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxTQUFTO1FBQ3ZDLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLFNBQVM7UUFDbkMsVUFBVSxFQUFFLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDakQsU0FBUyxFQUFFLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUM7UUFDL0MsT0FBTyxFQUFFLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7S0FDNUMsRUFDRDtRQUNFLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQ3ZDLE1BQU0sRUFBRSxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0tBQzFDLENBQ0YsQ0FBQTtJQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztRQUNkLGlCQUFpQixFQUFFLFNBQVM7UUFDNUIsS0FBSztRQUNMLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQ3ZDLE1BQU0sRUFBRSxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztLQUMvQyxDQUFDLENBQUE7QUFDSixDQUFDO0FBRU0sS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sSUFBQSx1Q0FBa0MsR0FBRSxDQUFBO0lBRTFDLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQXdCLENBQUE7SUFFcEQsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFBLHlCQUFvQixFQUFDO1FBQ3pDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUk7UUFDN0IsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSTtRQUNqQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJO1FBQ2pDLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxJQUFJLElBQUk7UUFDdkMsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSTtRQUNuQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJO1FBQy9CLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUk7UUFDekIsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSTtRQUN2QyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJO1FBQ3JDLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxJQUFJLElBQUk7UUFDdkMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSTtRQUNyQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJO1FBQ3pCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUk7UUFDL0IsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSTtLQUM1QixDQUFDLENBQUE7SUFFRixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzFCLGVBQWUsRUFBRSxPQUFPO0tBQ3pCLENBQUMsQ0FBQTtBQUNKLENBQUMifQ==