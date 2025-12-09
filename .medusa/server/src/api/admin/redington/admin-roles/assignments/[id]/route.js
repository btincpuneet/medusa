"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = DELETE;
const pg_1 = require("../../../../../../lib/pg");
const parseId = (value) => {
    const id = Number.parseInt(value, 10);
    return Number.isFinite(id) ? id : undefined;
};
async function DELETE(req, res) {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: "Invalid assignment id" });
    }
    try {
        const assignment = await (0, pg_1.findRoleAssignmentById)(id);
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }
        const request = req;
        const authContext = request.auth_context;
        const actorId = authContext?.actor_type === "user" ? authContext.actor_id : undefined;
        if (actorId &&
            actorId === assignment.user_id &&
            assignment.role?.can_login) {
            const roles = await (0, pg_1.getRolesForUser)(actorId);
            const loginRoles = roles.filter((role) => role.can_login);
            if (loginRoles.length <= 1) {
                return res.status(400).json({
                    message: "You cannot remove your last login-enabled role.",
                });
            }
        }
        await (0, pg_1.removeRoleAssignment)(id);
        return res.json({
            id,
            object: "admin_role_assignment",
            deleted: true,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Unexpected error removing role assignment.",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9hZG1pbi1yb2xlcy9hc3NpZ25tZW50cy9baWRdL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBWUEsd0JBa0RDO0FBNURELGlEQUlpQztBQUNqQyxNQUFNLE9BQU8sR0FBRyxDQUFDLEtBQWEsRUFBRSxFQUFFO0lBQ2hDLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3JDLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUE7QUFDN0MsQ0FBQyxDQUFBO0FBRU0sS0FBSyxVQUFVLE1BQU0sQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2xFLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0lBRWpDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNSLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFBO0lBQ25FLENBQUM7SUFFRCxJQUFJLENBQUM7UUFDSCxNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUEsMkJBQXNCLEVBQUMsRUFBRSxDQUFDLENBQUE7UUFFbkQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsQ0FBQyxDQUFBO1FBQ2xFLENBQUM7UUFFRCxNQUFNLE9BQU8sR0FBRyxHQUE2QyxDQUFBO1FBQzdELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUE7UUFFeEMsTUFBTSxPQUFPLEdBQ1gsV0FBVyxFQUFFLFVBQVUsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQTtRQUV2RSxJQUNFLE9BQU87WUFDUCxPQUFPLEtBQUssVUFBVSxDQUFDLE9BQU87WUFDOUIsVUFBVSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQzFCLENBQUM7WUFDRCxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUEsb0JBQWUsRUFBQyxPQUFPLENBQUMsQ0FBQTtZQUM1QyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7WUFFekQsSUFBSSxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMzQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUMxQixPQUFPLEVBQUUsaURBQWlEO2lCQUMzRCxDQUFDLENBQUE7WUFDSixDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sSUFBQSx5QkFBb0IsRUFBQyxFQUFFLENBQUMsQ0FBQTtRQUU5QixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxFQUFFO1lBQ0YsTUFBTSxFQUFFLHVCQUF1QjtZQUMvQixPQUFPLEVBQUUsSUFBSTtTQUNkLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUNMLEtBQUssWUFBWSxLQUFLO2dCQUNwQixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU87Z0JBQ2YsQ0FBQyxDQUFDLDRDQUE0QztTQUNuRCxDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyJ9