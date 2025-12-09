"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const redington_guest_user_1 = require("../../../../../modules/redington-guest-user");
const GET = async (_req, res) => {
    try {
        const summary = await (0, redington_guest_user_1.collectAllowedGuestDomains)();
        res.json({
            allowed_domains: summary.allowed,
            config_domains: summary.config,
            database_domains: summary.database,
            domain_extensions: summary.extensions,
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unable to load allowed domains.";
        res.status(500).json({ message });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3JlZGluZ3Rvbi9ndWVzdC11c2VyLXJlZ2lzdGVyL2FsbG93ZWQtZG9tYWlucy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLQSxzRkFBd0Y7QUFFakYsTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUN0QixJQUFtQixFQUNuQixHQUFtQixFQUNuQixFQUFFO0lBQ0YsSUFBSSxDQUFDO1FBQ0gsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFBLGlEQUEwQixHQUFFLENBQUE7UUFDbEQsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNQLGVBQWUsRUFBRSxPQUFPLENBQUMsT0FBTztZQUNoQyxjQUFjLEVBQUUsT0FBTyxDQUFDLE1BQU07WUFDOUIsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLFFBQVE7WUFDbEMsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLFVBQVU7U0FDdEMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixNQUFNLE9BQU8sR0FDWCxLQUFLLFlBQVksS0FBSztZQUNwQixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU87WUFDZixDQUFDLENBQUMsaUNBQWlDLENBQUE7UUFDdkMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQ25DLENBQUM7QUFDSCxDQUFDLENBQUE7QUFuQlksUUFBQSxHQUFHLE9BbUJmIn0=