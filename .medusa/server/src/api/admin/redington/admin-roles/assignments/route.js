"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("../../../../../lib/pg");
const admin_users_1 = require("../../../../../lib/admin-users");
const parseRoleId = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};
const parseDomainId = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};
async function GET(req, res) {
    try {
        const assignments = await (0, pg_1.listRoleAssignments)();
        const userIds = Array.from(new Set(assignments.map((assignment) => assignment.user_id)));
        const userMap = await (0, admin_users_1.fetchAdminUsersByIds)(req.scope, userIds);
        const enriched = assignments.map((assignment) => ({
            ...assignment,
            user: userMap.get(assignment.user_id) ?? {
                id: assignment.user_id,
            },
        }));
        return res.json({ assignments: enriched });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Failed to list role assignments.",
        });
    }
}
async function POST(req, res) {
    const body = (req.body || {});
    const roleId = parseRoleId(body.role_id);
    if (!roleId) {
        return res.status(400).json({ message: "role_id must be provided" });
    }
    const role = await (0, pg_1.findAdminRoleById)(roleId);
    if (!role) {
        return res.status(404).json({ message: "Role not found" });
    }
    let userId = body.user_id?.trim();
    let userSummary = userId ? await (0, admin_users_1.fetchAdminUserById)(req.scope, userId) : null;
    if (!userId) {
        const email = (body.user_email || "").trim().toLowerCase();
        if (!email) {
            return res
                .status(400)
                .json({ message: "user_id or user_email must be provided" });
        }
        userSummary = await (0, admin_users_1.fetchAdminUserByEmail)(req.scope, email);
        userId = userSummary?.id;
    }
    if (!userId || !userSummary) {
        return res.status(404).json({
            message: "Unable to locate the specified user.",
        });
    }
    const domainId = parseDomainId(body.domain_id);
    if (!domainId) {
        return res.status(400).json({ message: "domain_id must be provided" });
    }
    const domain = await (0, pg_1.findDomainById)(domainId);
    if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
    }
    if (Array.isArray(role.domains) && role.domains.length && !role.domains.includes(domainId)) {
        return res
            .status(400)
            .json({ message: "Role cannot be assigned to the selected domain." });
    }
    try {
        const assignment = await (0, pg_1.assignRoleToUser)({
            user_id: userId,
            role_id: roleId,
            domain_id: domainId,
        });
        return res.json({
            assignment: {
                ...assignment,
                role,
                user: userSummary,
                domain_name: domain.domain_name,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Unexpected error assigning role.",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9hZG1pbi1yb2xlcy9hc3NpZ25tZW50cy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQTJDQSxrQkFzQkM7QUFFRCxvQkF5RUM7QUExSUQsOENBSzhCO0FBQzlCLGdFQUl1QztBQVN2QyxNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQWtDLEVBQXNCLEVBQUU7SUFDN0UsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3hELE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUNELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDOUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDekMsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQTtJQUNyRCxDQUFDO0lBQ0QsT0FBTyxTQUFTLENBQUE7QUFDbEIsQ0FBQyxDQUFBO0FBRUQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFrQyxFQUFzQixFQUFFO0lBQy9FLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUN4RCxPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFDRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzlCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ3pDLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUE7SUFDckQsQ0FBQztJQUNELE9BQU8sU0FBUyxDQUFBO0FBQ2xCLENBQUMsQ0FBQTtBQUVNLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxJQUFJLENBQUM7UUFDSCxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsd0JBQW1CLEdBQUUsQ0FBQTtRQUMvQyxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDeEYsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFBLGtDQUFvQixFQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFFOUQsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNoRCxHQUFHLFVBQVU7WUFDYixJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUk7Z0JBQ3ZDLEVBQUUsRUFBRSxVQUFVLENBQUMsT0FBTzthQUN2QjtTQUNGLENBQUMsQ0FBQyxDQUFBO1FBRUgsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUE7SUFDNUMsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQ0wsS0FBSyxZQUFZLEtBQUs7Z0JBQ3BCLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTztnQkFDZixDQUFDLENBQUMsa0NBQWtDO1NBQ3pDLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDO0FBRU0sS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQW1CLENBQUE7SUFFL0MsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUN4QyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLENBQUMsQ0FBQTtJQUN0RSxDQUFDO0lBRUQsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFBLHNCQUFpQixFQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQzVDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNWLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFBO0lBQzVELENBQUM7SUFFRCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFBO0lBQ2pDLElBQUksV0FBVyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFBLGdDQUFrQixFQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTtJQUU3RSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDWixNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDMUQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1gsT0FBTyxHQUFHO2lCQUNQLE1BQU0sQ0FBQyxHQUFHLENBQUM7aUJBQ1gsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLHdDQUF3QyxFQUFFLENBQUMsQ0FBQTtRQUNoRSxDQUFDO1FBRUQsV0FBVyxHQUFHLE1BQU0sSUFBQSxtQ0FBcUIsRUFBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzNELE1BQU0sR0FBRyxXQUFXLEVBQUUsRUFBRSxDQUFBO0lBQzFCLENBQUM7SUFFRCxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDNUIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixPQUFPLEVBQUUsc0NBQXNDO1NBQ2hELENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0lBQzlDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNkLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsQ0FBQyxDQUFBO0lBQ3hFLENBQUM7SUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsbUJBQWMsRUFBQyxRQUFRLENBQUMsQ0FBQTtJQUM3QyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQTtJQUM5RCxDQUFDO0lBRUQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDM0YsT0FBTyxHQUFHO2FBQ1AsTUFBTSxDQUFDLEdBQUcsQ0FBQzthQUNYLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxpREFBaUQsRUFBRSxDQUFDLENBQUE7SUFDekUsQ0FBQztJQUVELElBQUksQ0FBQztRQUNILE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSxxQkFBZ0IsRUFBQztZQUN4QyxPQUFPLEVBQUUsTUFBTTtZQUNmLE9BQU8sRUFBRSxNQUFNO1lBQ2YsU0FBUyxFQUFFLFFBQVE7U0FDcEIsQ0FBQyxDQUFBO1FBRUYsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ2QsVUFBVSxFQUFFO2dCQUNWLEdBQUcsVUFBVTtnQkFDYixJQUFJO2dCQUNKLElBQUksRUFBRSxXQUFXO2dCQUNqQixXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVc7YUFDaEM7U0FDRixDQUFDLENBQUE7SUFDSixDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFDTCxLQUFLLFlBQVksS0FBSztnQkFDcEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPO2dCQUNmLENBQUMsQ0FBQyxrQ0FBa0M7U0FDekMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMifQ==