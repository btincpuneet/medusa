"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.DELETE = DELETE;
const pg_1 = require("../../../lib/pg");
const admin_users_1 = require("../../../lib/admin-users");
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
async function POST(req, res) {
    const request = req;
    const authContext = request.auth_context;
    if (!authContext) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (authContext.actor_type === "user") {
        const userId = authContext.actor_id;
        if (!userId) {
            return res.status(403).json({
                message: "Your user account is not fully provisioned. Please contact an administrator.",
            });
        }
        try {
            const actor = await (0, admin_users_1.fetchAdminUserById)(req.scope, userId);
            if (!actor) {
                return res.status(401).json({
                    message: "Unable to locate the user linked to this account.",
                });
            }
            await (0, pg_1.ensureRedingtonAdminRoleAssignmentTable)();
            const existingRoleCount = await (0, pg_1.countAdminRoles)();
            if (existingRoleCount === 0) {
                const defaultRole = await (0, pg_1.ensureSuperAdminRole)();
                await (0, pg_1.assignRoleToUser)({
                    user_id: userId,
                    role_id: defaultRole.id,
                });
            }
            const assignedRoles = await (0, pg_1.getRolesForUser)(userId);
            const loginRoles = assignedRoles.filter((role) => role.can_login);
            if (!loginRoles.length) {
                return res.status(403).json({
                    message: "Your account does not have permission to access the admin dashboard. Please contact an administrator.",
                });
            }
            const roleKeys = loginRoles.map((role) => role.role_key);
            const permissions = aggregatePermissions(loginRoles);
            const enrichedContext = {
                ...authContext,
                roles: roleKeys,
                permissions,
                app_metadata: {
                    ...(authContext.app_metadata ?? {}),
                    roles: roleKeys,
                    permissions,
                },
            };
            request.auth_context = enrichedContext;
            request.session.auth_context = enrichedContext;
            return res.status(200).json({
                user: {
                    ...enrichedContext,
                    actor,
                    roles: loginRoles,
                    permissions,
                },
            });
        }
        catch (error) {
            return res.status(500).json({
                message: error instanceof Error
                    ? error.message
                    : "Unexpected error establishing admin session.",
            });
        }
    }
    request.session.auth_context = authContext;
    return res.status(200).json({
        user: authContext,
    });
}
async function DELETE(req, res) {
    const request = req;
    request.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                message: error instanceof Error
                    ? error.message
                    : "Failed to terminate session.",
            });
        }
        res.json({ success: true });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2F1dGgvc2Vzc2lvbi9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQTRCQSxvQkF3RkM7QUFFRCx3QkFjQztBQW5JRCx3Q0FPd0I7QUFFeEIsMERBQTZEO0FBTTdELE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxLQUFxQixFQUFZLEVBQUU7SUFDL0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQTtJQUM3QixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ3pCLEtBQUssTUFBTSxVQUFVLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzFDLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2YsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUNyQixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUE7QUFDakMsQ0FBQyxDQUFBO0FBRU0sS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sT0FBTyxHQUFHLEdBQWlDLENBQUE7SUFDakQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQTtJQUV4QyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDakIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFBO0lBQzFELENBQUM7SUFFRCxJQUFJLFdBQVcsQ0FBQyxVQUFVLEtBQUssTUFBTSxFQUFFLENBQUM7UUFDdEMsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQTtRQUVuQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixPQUFPLEVBQUUsOEVBQThFO2FBQ3hGLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxJQUFJLENBQUM7WUFDSCxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUEsZ0NBQWtCLEVBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUV6RCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDMUIsT0FBTyxFQUFFLG1EQUFtRDtpQkFDN0QsQ0FBQyxDQUFBO1lBQ0osQ0FBQztZQUVELE1BQU0sSUFBQSw0Q0FBdUMsR0FBRSxDQUFBO1lBRS9DLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxJQUFBLG9CQUFlLEdBQUUsQ0FBQTtZQUVqRCxJQUFJLGlCQUFpQixLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM1QixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEseUJBQW9CLEdBQUUsQ0FBQTtnQkFDaEQsTUFBTSxJQUFBLHFCQUFnQixFQUFDO29CQUNyQixPQUFPLEVBQUUsTUFBTTtvQkFDZixPQUFPLEVBQUUsV0FBVyxDQUFDLEVBQUU7aUJBQ3hCLENBQUMsQ0FBQTtZQUNKLENBQUM7WUFFRCxNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUEsb0JBQWUsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUNuRCxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7WUFFakUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdkIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDMUIsT0FBTyxFQUNMLHVHQUF1RztpQkFDMUcsQ0FBQyxDQUFBO1lBQ0osQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUN4RCxNQUFNLFdBQVcsR0FBRyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUVwRCxNQUFNLGVBQWUsR0FBRztnQkFDdEIsR0FBRyxXQUFXO2dCQUNkLEtBQUssRUFBRSxRQUFRO2dCQUNmLFdBQVc7Z0JBQ1gsWUFBWSxFQUFFO29CQUNaLEdBQUcsQ0FBQyxXQUFXLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQztvQkFDbkMsS0FBSyxFQUFFLFFBQVE7b0JBQ2YsV0FBVztpQkFDWjthQUNGLENBQUE7WUFFRCxPQUFPLENBQUMsWUFBWSxHQUFHLGVBQWUsQ0FBQTtZQUN0QyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksR0FBRyxlQUFlLENBQUE7WUFFOUMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsSUFBSSxFQUFFO29CQUNKLEdBQUcsZUFBZTtvQkFDbEIsS0FBSztvQkFDTCxLQUFLLEVBQUUsVUFBVTtvQkFDakIsV0FBVztpQkFDWjthQUNGLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1lBQ3BCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLE9BQU8sRUFDTCxLQUFLLFlBQVksS0FBSztvQkFDcEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPO29CQUNmLENBQUMsQ0FBQyw4Q0FBOEM7YUFDckQsQ0FBQyxDQUFBO1FBQ0osQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUE7SUFFMUMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUMxQixJQUFJLEVBQUUsV0FBVztLQUNsQixDQUFDLENBQUE7QUFDSixDQUFDO0FBRU0sS0FBSyxVQUFVLE1BQU0sQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2xFLE1BQU0sT0FBTyxHQUFHLEdBQWlDLENBQUE7SUFDakQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFjLEVBQUUsRUFBRTtRQUN6QyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ1YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxFQUNMLEtBQUssWUFBWSxLQUFLO29CQUNwQixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU87b0JBQ2YsQ0FBQyxDQUFDLDhCQUE4QjthQUNyQyxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQzdCLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyJ9