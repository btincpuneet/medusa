"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.GET = void 0;
const pg_1 = require("../../../../lib/pg");
const GET = async (req, res) => {
    await (0, pg_1.ensureRedingtonRetainCartConfigTable)();
    const configs = await (0, pg_1.listRetainCartConfigs)();
    return res.json({
        retain_cart_configs: configs,
    });
};
exports.GET = GET;
const POST = async (req, res) => {
    await (0, pg_1.ensureRedingtonRetainCartConfigTable)();
    const body = (req.body || {});
    const record = await (0, pg_1.upsertRetainCartConfig)({
        domain_id: body.domain_id ?? null,
        retry_time: body.retry_time,
        add_bcc: body.add_bcc ?? null,
        is_active: body.is_active,
    });
    return res.status(201).json({ retain_cart_config: record });
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9yZXRhaW4tY2FydC9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSwyQ0FJMkI7QUFFcEIsTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ25FLE1BQU0sSUFBQSx5Q0FBb0MsR0FBRSxDQUFBO0lBQzVDLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBQSwwQkFBcUIsR0FBRSxDQUFBO0lBRTdDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztRQUNkLG1CQUFtQixFQUFFLE9BQU87S0FDN0IsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFBO0FBUFksUUFBQSxHQUFHLE9BT2Y7QUFTTSxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsTUFBTSxJQUFBLHlDQUFvQyxHQUFFLENBQUE7SUFFNUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBeUIsQ0FBQTtJQUVyRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsMkJBQXNCLEVBQUM7UUFDMUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSTtRQUNqQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7UUFDM0IsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSTtRQUM3QixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7S0FDMUIsQ0FBQyxDQUFBO0lBRUYsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUE7QUFDN0QsQ0FBQyxDQUFBO0FBYlksUUFBQSxJQUFJLFFBYWhCIn0=