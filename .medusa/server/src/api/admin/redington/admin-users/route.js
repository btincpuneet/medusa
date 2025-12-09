"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const core_flows_1 = require("@medusajs/core-flows");
const utils_1 = require("@medusajs/framework/utils");
const pg_1 = require("../../../../lib/pg");
const parseRoleIds = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }
    const parsed = value
        .map((entry) => {
        if (typeof entry === "number" && Number.isFinite(entry)) {
            return entry;
        }
        if (typeof entry === "string") {
            const trimmed = entry.trim();
            if (!trimmed) {
                return null;
            }
            const asNumber = Number.parseInt(trimmed, 10);
            return Number.isFinite(asNumber) ? asNumber : null;
        }
        return null;
    })
        .filter((entry) => entry !== null);
    return Array.from(new Set(parsed));
};
const normalizeName = (value) => {
    const trimmed = (value ?? "").trim();
    return trimmed || null;
};
const sanitizeUser = (user) => ({
    id: user.id,
    email: user.email,
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    metadata: user.metadata ?? null,
});
const detachUserIfNeeded = async (scope, userId) => {
    try {
        const workflow = (0, core_flows_1.removeUserAccountWorkflow)(scope);
        await workflow.run({ input: { userId } });
    }
    catch (error) {
        const logger = scope.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
        logger?.error?.("Failed to rollback admin user creation", error);
    }
};
async function POST(req, res) {
    const body = (req.body || {});
    const email = (body.email ?? "").trim().toLowerCase();
    const password = (body.password ?? "").trim();
    const firstName = normalizeName(body.first_name);
    const lastName = normalizeName(body.last_name);
    const roleIds = parseRoleIds(body.role_ids);
    if (!email) {
        return res.status(400).json({ message: "email is required" });
    }
    if (!password || password.length < 8) {
        return res.status(400).json({
            message: "password must be at least 8 characters long",
        });
    }
    let validatedRoles = [];
    if (roleIds.length) {
        const roles = [];
        for (const id of roleIds) {
            const role = await (0, pg_1.findAdminRoleById)(id);
            if (!role) {
                return res
                    .status(404)
                    .json({ message: `Role ${id} not found.` });
            }
            roles.push(role);
        }
        validatedRoles = roles;
    }
    const userModule = req.scope.resolve(utils_1.Modules.USER);
    const authModule = req.scope.resolve(utils_1.Modules.AUTH);
    let createdUser;
    try {
        createdUser = await userModule.createUsers({
            email,
            first_name: firstName,
            last_name: lastName,
        });
    }
    catch (error) {
        if (error instanceof utils_1.MedusaError) {
            const status = error.type === utils_1.MedusaError.Types.DUPLICATE_ERROR ? 409 : 400;
            return res.status(status).json({ message: error.message });
        }
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Unexpected error creating user.",
        });
    }
    try {
        const registration = await authModule.register("emailpass", {
            body: { email, password },
        });
        if (!registration ||
            registration.error ||
            !registration.authIdentity?.id) {
            await detachUserIfNeeded(req.scope, createdUser.id);
            return res.status(400).json({
                message: registration?.error ??
                    "Unable to register credentials for the user.",
            });
        }
        await authModule.updateAuthIdentities({
            id: registration.authIdentity.id,
            app_metadata: {
                user_id: createdUser.id,
            },
        });
    }
    catch (error) {
        await detachUserIfNeeded(req.scope, createdUser.id);
        return res.status(500).json({
            message: error instanceof Error
                ? error.message
                : "Unexpected error registering user credentials.",
        });
    }
    const assignments = [];
    for (const [index, role] of validatedRoles.entries()) {
        try {
            const assignment = await (0, pg_1.assignRoleToUser)({
                user_id: createdUser.id,
                role_id: role.id,
            });
            assignments.push({
                ...assignment,
                role: role ?? assignment.role,
            });
        }
        catch (error) {
            const logger = req.scope.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
            logger?.warn?.(`Failed to assign role ${role.id} to user ${createdUser.id} (index ${index})`, error);
        }
    }
    return res.status(201).json({
        user: sanitizeUser(createdUser),
        assignments,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9hZG1pbi11c2Vycy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQXFGQSxvQkEwSUM7QUEvTkQscURBQWdFO0FBQ2hFLHFEQUlrQztBQU1sQywyQ0FLMkI7QUFVM0IsTUFBTSxZQUFZLEdBQUcsQ0FDbkIsS0FBc0MsRUFDNUIsRUFBRTtJQUNaLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDMUIsT0FBTyxFQUFFLENBQUE7SUFDWCxDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUcsS0FBSztTQUNqQixHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUNiLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN4RCxPQUFPLEtBQUssQ0FBQTtRQUNkLENBQUM7UUFDRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQzlCLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUM1QixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxJQUFJLENBQUE7WUFDYixDQUFDO1lBQ0QsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDN0MsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTtRQUNwRCxDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDLENBQUM7U0FDRCxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQW1CLEVBQUUsQ0FBQyxLQUFLLEtBQUssSUFB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