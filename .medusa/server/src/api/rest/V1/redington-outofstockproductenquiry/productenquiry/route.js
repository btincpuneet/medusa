"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../../lib/pg");
const parseOptionalNumber = (value) => {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};
async function GET(req, res) {
    const [entries, count] = await (0, pg_1.listProductEnquiries)({
        status: typeof req.query.status === "string" ? req.query.status : undefined,
        email: typeof req.query.email === "string" ? req.query.email : undefined,
        sku: typeof req.query.sku === "string" ? req.query.sku : undefined,
        product_id: parseOptionalNumber(req.query.product_id),
        access_id: parseOptionalNumber(req.query.access_id),
        user_id: parseOptionalNumber(req.query.user_id),
    }, {
        limit: parseOptionalNumber(req.query.limit),
        offset: parseOptionalNumber(req.query.offset),
    });
    return res.json({
        items: entries,
        total_count: count,
    });
}
async function POST(req, res) {
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
        status: body.status ?? "new",
    });
    return res.status(201).json(enquiry);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3Jlc3QvVjEvcmVkaW5ndG9uLW91dG9mc3RvY2twcm9kdWN0ZW5xdWlyeS9wcm9kdWN0ZW5xdWlyeS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWdCQSxrQkFvQkM7QUFFRCxvQkFxQkM7QUF6REQsOENBSThCO0FBRTlCLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRTtJQUM3QyxJQUFJLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssRUFBRSxFQUFFLENBQUM7UUFDMUQsT0FBTyxTQUFTLENBQUE7SUFDbEIsQ0FBQztJQUNELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUM1QixPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFBO0FBQ3JELENBQUMsQ0FBQTtBQUVNLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU0sSUFBQSx5QkFBb0IsRUFDakQ7UUFDRSxNQUFNLEVBQUUsT0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTO1FBQzNFLEtBQUssRUFBRSxPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVM7UUFDeEUsR0FBRyxFQUFFLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUztRQUNsRSxVQUFVLEVBQUUsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDckQsU0FBUyxFQUFFLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDO1FBQ25ELE9BQU8sRUFBRSxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztLQUNoRCxFQUNEO1FBQ0UsS0FBSyxFQUFFLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQzNDLE1BQU0sRUFBRSxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztLQUM5QyxDQUNGLENBQUE7SUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDZCxLQUFLLEVBQUUsT0FBTztRQUNkLFdBQVcsRUFBRSxLQUFLO0tBQ25CLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBd0IsQ0FBQTtJQUVwRCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUEseUJBQW9CLEVBQUM7UUFDekMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSTtRQUM3QixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJO1FBQ2pDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUk7UUFDakMsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSTtRQUN2QyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJO1FBQ25DLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUk7UUFDL0IsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSTtRQUN6QixZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJO1FBQ3ZDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUk7UUFDckMsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSTtRQUN2QyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJO1FBQ3JCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUk7UUFDekIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSTtRQUMvQixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxLQUFLO0tBQzdCLENBQUMsQ0FBQTtJQUVGLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDdEMsQ0FBQyJ9