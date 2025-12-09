"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const admin_users_1 = require("../../../../../lib/admin-users");
const pg_1 = require("../../../../../lib/pg");
const ensureSuperAdminForUser = async (userId) => {
    let role = await (0, pg_1.findAdminRoleByKey)("super_admin");
    if (!role) {
        role = await (0, pg_1.createAdminRole)({
            role_name: "Super Admin",
            description: "Default role with full access to Redington admin tools.",
            permissions: ["*"],
            can_login: true,
            domains: [],
        });
    }
    const assignments = await (0, pg_1.listRoleAssignments)({ user_id: userId });
    const hasAssignment = assignments.some((assignment) => assignment.role?.role_key === "super_admin" &&
        (assignment.domain_id === null || assignment.domain_id === undefined));
    if (!hasAssignment) {
        await (0, pg_1.assignRoleToUser)({
            user_id: userId,
            role_id: role.id,
            domain_id: null,
        });
        return (0, pg_1.listRoleAssignments)({ user_id: userId });
    }
    return assignments;
};
const aggregatePermissions = (roles) => {
    const set = new Set();
    for (const role of roles) {
        for (const permission of role.permissions) {
            if (permission) {
                set.add(permission);
            }
        }
    }
    return Array.from(set.values());
};
async function GET(req, res) {
    const request = req;
    const authContext = request.auth_context;
    if (!authContext || authContext.actor_type !== "user") {
        return res.json({
            roles: [],
            login_roles: [],
            permissions: [],
            assignments: [],
        });
    }
    const userId = authContext.actor_id;
    if (!userId) {
        return res.json({
            roles: [],
            login_roles: [],
            permissions: [],
            assignments: [],
        });
    }
    try {
        const assignments = await ensureSuperAdminForUser(userId);
        const roleMap = new Map();
        for (const assignment of assignments) {
            if (assignment.role) {
                roleMap.set(assignment.role.id, assignment.role);
            }
        }
        const roles = Array.from(roleMap.values());
        const loginRoles = roles.filter((role) => role.can_login);
        const permissions = aggregatePermissions(loginRoles);
        const user = await (0, admin_users_1.fetchAdminUserById)(req.scope, userId);
        return res.json({
            user,
            roles,
            login_roles: loginRoles,
            permissions,
            assignments: assignments.map(mapAssignmentForResponse),
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Failed to load role details for the current user.",
        });
    }
}
function mapAssignmentForResponse(assignment) {
    return {
        id: assignment.id,
        user_id: assignment.user_id,
        role_id: assignment.role_id,
        domain_id: assignment.domain_id ?? null,
        domain_name: assignment.domain_name ?? null,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        role: assignment.role
            ? {
                id: assignment.role.id,
                role_key: assignment.role.role_key,
                role_name: assignment.role.role_name,
                description: assignment.role.description ?? null,
                can_login: assignment.role.can_login,
                permissions: assignment.role.permissions,
                domains: assignment.role.domains,
                created_at: assignment.role.created_at,
                updated_at: assignment.role.updated_at,
            }
            : null,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9hZG1pbi1yb2xlcy9tZS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQTBEQSxrQkFxREM7QUE3R0QsZ0VBQW1FO0FBQ25FLDhDQU84QjtBQUU5QixNQUFNLHVCQUF1QixHQUFHLEtBQUssRUFDbkMsTUFBYyxFQUNxQixFQUFFO0lBQ3JDLElBQUksSUFBSSxHQUFHLE1BQU0sSUFBQSx1QkFBa0IsRUFBQyxhQUFhLENBQUMsQ0FBQTtJQUVsRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDVixJQUFJLEdBQUcsTUFBTSxJQUFBLG9CQUFlLEVBQUM7WUFDM0IsU0FBUyxFQUFFLGFBQWE7WUFDeEIsV0FBVyxFQUFFLHlEQUF5RDtZQUN0RSxXQUFXLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDbEIsU0FBUyxFQUFFLElBQUk7WUFDZixPQUFPLEVBQUUsRUFBRTtTQUNaLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsd0JBQW1CLEVBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQTtJQUNsRSxNQUFNLGFBQWEsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUNwQyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQ2IsVUFBVSxDQUFDLElBQUksRUFBRSxRQUFRLEtBQUssYUFBYTtRQUMzQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLEtBQUssSUFBSSxJQUFJLFVBQVUsQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLENBQ3hFLENBQUE7SUFFRCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDbkIsTUFBTSxJQUFBLHFCQUFnQixFQUFDO1lBQ3JCLE9BQU8sRUFBRSxNQUFNO1lBQ2YsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ2hCLFNBQVMsRUFBRSxJ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