"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const pg_1 = require("../../../../lib/pg");
async function GET(req, res) {
    await Promise.all([
        (0, pg_1.ensureRedingtonDomainOutOfStockTable)(),
        (0, pg_1.ensureRedingtonAccessMappingTable)(),
        (0, pg_1.ensureRedingtonDomainTable)(),
    ]);
    const { rows: outOfStockRows } = await (0, pg_1.getPgPool)().query(`
      SELECT dos.*, d.domain_name
      FROM redington_domain_out_of_stock dos
      LEFT JOIN redington_domain d ON d.id = dos.domain_id
    `);
    if (!outOfStockRows.length) {
        return res.json({ domain_out_of_stock: [] });
    }
    const { rows: accessRows } = await (0, pg_1.getPgPool)().query(`
      SELECT
        id,
        access_id,
        domain_id,
        company_code,
        country_code
      FROM redington_access_mapping
    `);
    const accessByDomain = new Map();
    for (const row of accessRows) {
        const domainId = Number(row.domain_id);
        if (!Number.isFinite(domainId)) {
            continue;
        }
        const list = accessByDomain.get(domainId) ??
            accessByDomain.set(domainId, []).get(domainId);
        list.push({
            access_id: typeof row.access_id === "string" && row.access_id.length
                ? row.access_id
                : Number.isFinite(Number(row.id))
                    ? String(row.id)
                    : null,
            company_code: typeof row.company_code === "string" ? row.company_code : null,
            country_code: typeof row.country_code === "string" ? row.country_code : null,
        });
    }
    const response = outOfStockRows.flatMap((row) => {
        const mapped = (0, pg_1.mapDomainOutOfStockRow)(row);
        const domainAccess = accessByDomain.get(mapped.domain_id);
        if (!domainAccess || !domainAccess.length) {
            return [
                {
                    ...mapped,
                    domain_name: typeof row.domain_name === "string" ? row.domain_name : null,
                    access_id: null,
                    company_code: null,
                    country_code: null,
                },
            ];
        }
        return domainAccess.map((access) => ({
            ...mapped,
            domain_name: typeof row.domain_name === "string" ? row.domain_name : null,
            access_id: access.access_id,
            company_code: access.company_code,
            country_code: access.country_code,
        }));
    });
    return res.json({
        domain_out_of_stock: response,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3JlZGluZ3Rvbi9vdXQtb2Ytc3RvY2svcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFVQSxrQkE4RkM7QUF0R0QsMkNBTTJCO0FBRXBCLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDaEIsSUFBQSx5Q0FBb0MsR0FBRTtRQUN0QyxJQUFBLHNDQUFpQyxHQUFFO1FBQ25DLElBQUEsK0JBQTBCLEdBQUU7S0FDN0IsQ0FBQyxDQUFBO0lBRUYsTUFBTSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsR0FBRyxNQUFNLElBQUEsY0FBUyxHQUFFLENBQUMsS0FBSyxDQUN0RDs7OztLQUlDLENBQ0YsQ0FBQTtJQUVELElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDM0IsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsbUJBQW1CLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUM5QyxDQUFDO0lBRUQsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsR0FBRyxNQUFNLElBQUEsY0FBUyxHQUFFLENBQUMsS0FBSyxDQUNsRDs7Ozs7Ozs7S0FRQyxDQUNGLENBQUE7SUFFRCxNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsRUFPM0IsQ0FBQTtJQUVILEtBQUssTUFBTSxHQUFHLElBQUksVUFBVSxFQUFFLENBQUM7UUFDN0IsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUN0QyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQy9CLFNBQVE7UUFDVixDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQ1IsY0FBYyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7WUFDNUIsY0FBYyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBRSxDQUFBO1FBRWpELElBQUksQ0FBQyxJQUFJLENBQUM7WUFDUixTQUFTLEVBQ1AsT0FBTyxHQUFHLENBQUMsU0FBUyxLQUFLLFFBQVEsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU07Z0JBQ3ZELENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUztnQkFDZixDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNqQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ2hCLENBQUMsQ0FBQyxJQUFJO1lBQ1YsWUFBWSxFQUNWLE9BQU8sR0FBRyxDQUFDLFlBQVksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUk7WUFDaEUsWUFBWSxFQUNWLE9BQU8sR0FBRyxDQUFDLFlBQVksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUk7U0FDakUsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVELE1BQU0sUUFBUSxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUM5QyxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFzQixFQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzFDLE1BQU0sWUFBWSxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBRXpELElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDMUMsT0FBTztnQkFDTDtvQkFDRSxHQUFHLE1BQU07b0JBQ1QsV0FBVyxFQUNULE9BQU8sR0FBRyxDQUFDLFdBQVcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUk7b0JBQzlELFNBQVMsRUFBRSxJQUFJO29CQUNmLFlBQVksRUFBRSxJQUFJO29CQUNsQixZQUFZLEVBQUUsSUFBSTtpQkFDbkI7YUFDRixDQUFBO1FBQ0gsQ0FBQztRQUVELE9BQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNuQyxHQUFHLE1BQU07WUFDVCxXQUFXLEVBQ1QsT0FBTyxHQUFHLENBQUMsV0FBVyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSTtZQUM5RCxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVM7WUFDM0IsWUFBWSxFQUFFLE1BQU0sQ0FBQyxZQUFZO1lBQ2pDLFlBQVksRUFBRSxNQUFNLENBQUMsWUFBWTtTQUNsQyxDQUFDLENBQUMsQ0FBQTtJQUNMLENBQUMsQ0FBQyxDQUFBO0lBRUYsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ2QsbUJBQW1CLEVBQUUsUUFBUTtLQUM5QixDQUFDLENBQUE7QUFDSixDQUFDIn0=